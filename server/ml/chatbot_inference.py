from datetime import datetime
import os
import random
import torch
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from server.database.crud.helpers.create_access_token import get_authenticated_user
from server.database.models.user import User
from server.ml.intent_handlers import INTENT_HANDLERS
from server.ml.model import (
    NeuralNet,
    ChatbotIntent,
    ChatbotMessage,
    ChatbotConversation,
    ChatbotUnknownMessage,
    ChatbotResponse
)
from server.ml.utils import bag_of_words, build_context, tokenize
from server.database.database import get_db
from server.ml.schemas import MessageRequest, MessageResponse

router = APIRouter(prefix="/ml-inference", tags=["ML"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "server/ml", "chatbot.pth")

CONFIDENCE_THRESHOLD = 0.75

_model_cache: dict = {}


def load_model() -> dict:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model file not found at {MODEL_PATH}. "
            "Please train the model first from the admin panel."
        )

    data = torch.load(MODEL_PATH, map_location=torch.device("cpu"))

    model = NeuralNet(
        input_size=data["input_size"],
        hidden_size=data["hidden_size"],
        num_classes=data["output_size"],
    )
    model.load_state_dict(data["model_state"])
    model.eval()

    return {
        "model": model,
        "all_words": data["all_words"],
        "tags": data["tags"],
    }


def get_model() -> dict:
    global _model_cache
    if not _model_cache:
        _model_cache = load_model()
    return _model_cache


def predict(message: str) -> tuple[str | None, float]:
    cache = get_model()
    model: NeuralNet = cache["model"]
    all_words: list[str] = cache["all_words"]
    tags: list[str] = cache["tags"]

    tokens = tokenize(message)
    X = bag_of_words(tokens, all_words)
    X = torch.from_numpy(X).unsqueeze(0)

    with torch.no_grad():
        output = model(X)

    probs = torch.softmax(output, dim=1)
    confidence, predicted_idx = torch.max(probs, dim=1)

    tag = tags[predicted_idx.item()]
    return tag, confidence.item()


@router.post("/message", response_model=MessageResponse)
def chat(body: MessageRequest, db: Session = Depends(get_db), user: User = Depends(get_authenticated_user)):
    if body.conversation_id:
        conversation = db.get(ChatbotConversation, body.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = ChatbotConversation(
            user_id=user.id,
            created_at=datetime.now(),
        )
        db.add(conversation)
        db.flush()

    user_msg = ChatbotMessage(
        conversation_id=conversation.id,
        role="user",
        message=body.message,
    )
    db.add(user_msg)

    try:
        tag, confidence = predict(body.message)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    fallback = confidence < CONFIDENCE_THRESHOLD
    bot_text: str
    intent_id: int | None = None

    if fallback:
        unknown = ChatbotUnknownMessage(
            message=body.message,
            confidence=confidence,
        )
        db.add(unknown)
        bot_text = random.choice([
            "I'm not sure I understood that. Could you rephrase?",
            "Hmm, I didn't quite catch that. Try asking about books, authors, or recommendations!",
            "I'm still learning! Could you ask me something about books?",
        ])
    else:
        ctx = build_context(
            message=body.message,
            intent=tag,
            confidence=confidence,
            user_id=user.id,         
            conversation_id=conversation.id,
            db=db,
        )

        handler = INTENT_HANDLERS.get(tag)

        if handler:
            bot_text = handler(ctx, db)
        else:
            intent = (
                db.query(ChatbotIntent)
                .options(joinedload(ChatbotIntent.responses))
                .filter(ChatbotIntent.tag == tag)
                .first()
            )
            bot_text = (
                random.choice(intent.responses).response
                if intent and intent.responses
                else "I know what you mean, but I don't have a response for that yet!"
            )

    bot_msg = ChatbotMessage(
        conversation_id=conversation.id,
        role="bot",
        message=bot_text,
        predicted_intent_id=intent_id,
        confidence=confidence,
    )
    db.add(bot_msg)
    db.commit()

    return MessageResponse(
        response=bot_text,
        intent=tag if not fallback else None,
        confidence=round(confidence, 4),
        fallback=fallback,
        conversation_id=conversation.id,
    )


@router.post("/reload", status_code=200)
def reload_model():
    global _model_cache
    try:
        _model_cache = load_model()
        return {"message": "Model reloaded successfully"}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))