import threading
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, selectinload
import queue
from server.database.crud.helpers.create_access_token import get_authenticated_user
from server.database.database import SessionLocal, get_db
from server.ml.model import ChatbotIntent, ChatbotPattern, ChatbotResponse
from server.ml.schemas import IntentCreate, IntentOut, IntentUpdate, PatternCreate, PatternOut, PatternUpdate, PromoteUnknownBody, ResponseCreate, ResponseOut, ResponseUpdate

router = APIRouter(prefix="/ml", dependencies=[Depends(get_authenticated_user)], tags=["ML"])

@router.post("/train", status_code=200)
def start_training(epochs: int = 1000, _ : Session = Depends(get_db)):
    log_queue: queue.Queue = queue.Queue()
    SENTINEL = "__DONE__" 

    def train_in_thread():
        from server.ml.train import run_training
        result = run_training(epochs=epochs, on_log=lambda msg: log_queue.put(msg))

        record_db = SessionLocal()
        try:
            from server.ml.model import ChatbotTraining
            training = ChatbotTraining(epochs=epochs, success=result["success"])
            record_db.add(training)
            record_db.commit()
        finally:
            record_db.close()

        log_queue.put(SENTINEL)  

    thread = threading.Thread(target=train_in_thread, daemon=True)
    thread.start()

    def event_stream():
        while True:
            try:
                msg = log_queue.get(timeout=60)  
            except queue.Empty:
                yield "data: [ERROR] Training timed out\n\n"
                break

            if msg == SENTINEL:
                yield "data: __DONE__\n\n"
                break

            yield f"data: {msg}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no", 
        }
    )


@router.get("/trainings")
def get_trainings(db: Session = Depends(get_db)):
    from server.ml.model import ChatbotTraining
    return db.query(ChatbotTraining).order_by(ChatbotTraining.created_at.desc()).all()


@router.get("/unknown-messages")
def get_unknown_messages(db: Session = Depends(get_db)):
    from server.ml.model import ChatbotUnknownMessage
    return (
        db.query(ChatbotUnknownMessage)
        .order_by(ChatbotUnknownMessage.created_at.desc())
        .all()
    )

@router.delete("/unknown-messages/{msg_id}", status_code=204)
def delete_unknown_message(msg_id: int, db: Session = Depends(get_db)):
    from server.ml.model import ChatbotUnknownMessage
    msg = db.get(ChatbotUnknownMessage, msg_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(msg)
    db.commit()

@router.post("/unknown-messages/{msg_id}/promote", status_code=201)
def promote_unknown_to_pattern(
    msg_id: int,
    body: PromoteUnknownBody,
    db: Session = Depends(get_db),
):
    from server.ml.model import ChatbotUnknownMessage
    msg = db.get(ChatbotUnknownMessage, msg_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Unknown message not found")

    intent = db.get(ChatbotIntent, body.intent_id)
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")

    pattern = ChatbotPattern(pattern=msg.message, intent_id=body.intent_id)
    db.add(pattern)
    db.delete(msg)
    db.commit()
    db.refresh(pattern)
    return pattern


def ok(data, message: str = "Success"):
    return {"success": True, "message": message, "data": data}


@router.get("", response_model=dict)
def get_intents(db: Session = Depends(get_db)):
    intents = (
        db.query(ChatbotIntent)
        .options(
            selectinload(ChatbotIntent.patterns),
            selectinload(ChatbotIntent.responses),
        )
        .order_by(ChatbotIntent.tag)
        .all()
    )
    return ok([IntentOut.model_validate(i) for i in intents])


@router.post("", response_model=dict, status_code=201)
def create_intent(body: IntentCreate, db: Session = Depends(get_db)):
    existing = db.query(ChatbotIntent).filter(ChatbotIntent.tag == body.tag).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Intent with tag '{body.tag}' already exists")

    intent = ChatbotIntent(tag=body.tag, type=body.type)
    db.add(intent)
    db.commit()
    db.refresh(intent)
    return ok(IntentOut.model_validate(intent), "Intent created")


@router.patch("/{intent_id}", response_model=dict)
def update_intent(intent_id: int, body: IntentUpdate, db: Session = Depends(get_db)):
    intent = db.get(ChatbotIntent, intent_id)
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")

    if body.tag is not None:
        if body.tag != intent.tag:
            clash = db.query(ChatbotIntent).filter(ChatbotIntent.tag == body.tag).first()
            if clash:
                raise HTTPException(status_code=409, detail=f"Tag '{body.tag}' already in use")
        intent.tag = body.tag

    if body.type is not None:
        intent.type = body.type

    db.commit()
    db.refresh(intent)
    return ok(IntentOut.model_validate(intent), "Intent updated")


@router.delete("/{intent_id}", status_code=200)
def delete_intent(intent_id: int, db: Session = Depends(get_db)):
    intent = db.get(ChatbotIntent, intent_id)
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")

    db.delete(intent)
    db.commit()
    return ok(None, "Intent deleted")


@router.post("/{intent_id}/patterns", response_model=dict, status_code=201)
def add_pattern(intent_id: int, body: PatternCreate, db: Session = Depends(get_db)):
    intent = db.get(ChatbotIntent, intent_id)
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")

    duplicate = (
        db.query(ChatbotPattern)
        .filter(
            ChatbotPattern.intent_id == intent_id,
            ChatbotPattern.pattern == body.pattern,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="This pattern already exists on this intent")

    pattern = ChatbotPattern(pattern=body.pattern, intent_id=intent_id)
    db.add(pattern)
    db.commit()
    db.refresh(pattern)
    return ok(PatternOut.model_validate(pattern), "Pattern added")


@router.patch("/patterns/{pattern_id}", response_model=dict)
def update_pattern(pattern_id: int, body: PatternUpdate, db: Session = Depends(get_db)):
    pattern = db.get(ChatbotPattern, pattern_id)
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")

    pattern.pattern = body.pattern.strip()
    db.commit()
    db.refresh(pattern)
    return ok(PatternOut.model_validate(pattern), "Pattern updated")


@router.delete("/patterns/{pattern_id}", status_code=200)
def delete_pattern(pattern_id: int, db: Session = Depends(get_db)):
    pattern = db.get(ChatbotPattern, pattern_id)
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")

    db.delete(pattern)
    db.commit()
    return ok(None, "Pattern deleted")


@router.post("/{intent_id}/responses", response_model=dict, status_code=201)
def add_response(intent_id: int, body: ResponseCreate, db: Session = Depends(get_db)):
    intent = db.get(ChatbotIntent, intent_id)
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")

    response = ChatbotResponse(response=body.response, intent_id=intent_id)
    db.add(response)
    db.commit()
    db.refresh(response)
    return ok(ResponseOut.model_validate(response), "Response added")


@router.patch("/responses/{response_id}", response_model=dict)
def update_response(response_id: int, body: ResponseUpdate, db: Session = Depends(get_db)):
    response = db.get(ChatbotResponse, response_id)
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")

    response.response = body.response.strip()
    db.commit()
    db.refresh(response)
    return ok(ResponseOut.model_validate(response), "Response updated")


@router.delete("/responses/{response_id}", status_code=200)
def delete_response(response_id: int, db: Session = Depends(get_db)):
    response = db.get(ChatbotResponse, response_id)
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")

    db.delete(response)
    db.commit()
    return ok(None, "Response deleted")