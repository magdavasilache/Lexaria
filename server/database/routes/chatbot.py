from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from server.core.dependencies import get_admin_user, get_authenticated_user, get_request_language
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.chatbot import ResponseLanguage
from server.database.models.user import User
from server.database.schemas.chatbot import (
    ChatbotAnalyticsOut,
    ChatMessageIn,
    ChatReplyOut,
    ChatTestIn,
    ChatTestOut,
    ConversationOut,
    FeedbackIn,
    FeedbackOut,
    FeedbackReviewOut,
    IntentExportOut,
    IntentImportIn,
    IntentIn,
    IntentOut,
    PatternIn,
    PatternOut,
    PatternOverlapOut,
    PromoteIn,
    SeedSummary,
    ResponseIn,
    ResponseOut,
    TrainingEvent,
    TrainingOut,
    UnknownMessageOut,
)
from server.services import chatbot_service

router = APIRouter(prefix="/chatbot", tags=["Chatbot"], dependencies=[Depends(get_authenticated_user)])

IntentId = Annotated[int, Path(ge=1)]
PatternId = Annotated[int, Path(ge=1)]
ResponseId = Annotated[int, Path(ge=1)]
MessageId = Annotated[int, Path(ge=1)]
ConversationId = Annotated[int, Path(ge=1)]
ANALYTICS_MIN_WEEKS = 4
ANALYTICS_MAX_WEEKS = 52
ANALYTICS_DEFAULT_WEEKS = 12


@router.post(
    "/messages",
    response_model=ApiResponse[ChatReplyOut],
    summary="Send a message to the chatbot and get its reply",
    responses=error_responses(401, 404, 422, 503),
)
def send_message(
    form: ChatMessageIn,
    user: User = Depends(get_authenticated_user),
    language: ResponseLanguage = Depends(get_request_language),
    db: Session = Depends(get_db),
) -> ApiResponse[ChatReplyOut]:
    return ok(chatbot_service.send_message(db, user, form, language))


@router.put(
    "/messages/{message_id}/feedback",
    response_model=ApiResponse[FeedbackOut],
    summary="Rate one of the chatbot's replies to the caller, or clear the rating",
    responses=error_responses(401, 404, 422),
)
def set_feedback(
    message_id: MessageId, form: FeedbackIn, user: User = Depends(get_authenticated_user), db: Session = Depends(get_db)
) -> ApiResponse[FeedbackOut]:
    return ok(chatbot_service.set_feedback(db, user, message_id, form))


@router.post(
    "/test",
    response_model=ApiResponse[ChatTestOut],
    summary="Classify a message and return the top intents without storing anything (admin)",
    responses=error_responses(401, 403, 422, 503),
)
def test_message(
    form: ChatTestIn,
    user: User = Depends(get_admin_user),
    language: ResponseLanguage = Depends(get_request_language),
    db: Session = Depends(get_db),
) -> ApiResponse[ChatTestOut]:
    return ok(chatbot_service.test_message(db, user, form, language))


@router.get(
    "/conversations/latest",
    response_model=ApiResponse[ConversationOut | None],
    summary="The caller's latest conversation with its last messages, or null",
    responses=error_responses(401),
)
def latest_conversation(user: User = Depends(get_authenticated_user), db: Session = Depends(get_db)) -> ApiResponse[ConversationOut | None]:
    return ok(chatbot_service.latest_conversation(db, user))


@router.delete(
    "/conversations/{conversation_id}",
    response_model=ApiResponse[None],
    summary="Delete one of the caller's conversations",
    responses=error_responses(401, 404, 422),
)
def delete_conversation(
    conversation_id: ConversationId, user: User = Depends(get_authenticated_user), db: Session = Depends(get_db)
) -> ApiResponse[None]:
    chatbot_service.delete_conversation(db, user, conversation_id)
    return ok(None)


@router.get(
    "/intents",
    response_model=ApiResponse[list[IntentOut]],
    summary="List intents with their patterns and responses (admin)",
    responses=error_responses(401, 403),
)
def list_intents(_: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> ApiResponse[list[IntentOut]]:
    return ok(chatbot_service.list_intents(db))


@router.get(
    "/intents/export",
    response_model=ApiResponse[list[IntentExportOut]],
    summary="Export every intent with its patterns and responses in the seed file format (admin)",
    responses=error_responses(401, 403),
)
def export_intents(_: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> ApiResponse[list[IntentExportOut]]:
    return ok(chatbot_service.export_intents(db))


@router.post(
    "/intents/import",
    response_model=ApiResponse[SeedSummary],
    summary="Import intents in the seed file format, merging or replacing the current ones (admin)",
    responses=error_responses(401, 403, 409, 422),
)
def import_intents(form: IntentImportIn, user: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> ApiResponse[SeedSummary]:
    return ok(chatbot_service.import_intents(db, form, user))


@router.get(
    "/intents/{intent_id}/overlaps",
    response_model=ApiResponse[list[PatternOverlapOut]],
    summary="Patterns of an intent that are very close to a pattern of another intent in the current index (admin)",
    responses=error_responses(401, 403, 404, 422, 503),
)
def intent_overlaps(intent_id: IntentId, _: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> ApiResponse[list[PatternOverlapOut]]:
    return ok(chatbot_service.intent_overlaps(db, intent_id))


@router.post(
    "/intents",
    response_model=ApiResponse[IntentOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add an intent (admin)",
    responses=error_responses(401, 403, 409, 422),
)
def create_intent(form: IntentIn, user: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> ApiResponse[IntentOut]:
    return ok(chatbot_service.create_intent(db, form, user))


@router.put(
    "/intents/{intent_id}",
    response_model=ApiResponse[IntentOut],
    summary="Rename an intent or change its type (admin)",
    responses=error_responses(401, 403, 404, 409, 422),
)
def update_intent(
    intent_id: IntentId, form: IntentIn, user: User = Depends(get_admin_user), db: Session = Depends(get_db)
) -> ApiResponse[IntentOut]:
    return ok(chatbot_service.update_intent(db, intent_id, form, user))


@router.delete(
    "/intents/{intent_id}",
    response_model=ApiResponse[None],
    summary="Delete an intent with its patterns and responses (admin)",
    responses=error_responses(401, 403, 404, 422),
)
def delete_intent(intent_id: IntentId, user: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> ApiResponse[None]:
    chatbot_service.delete_intent(db, intent_id, user)
    return ok(None)


@router.post(
    "/intents/{intent_id}/patterns",
    response_model=ApiResponse[PatternOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add a training pattern to an intent (admin)",
    responses=error_responses(401, 403, 404, 409, 422),
)
def create_pattern(
    intent_id: IntentId, form: PatternIn, user: User = Depends(get_admin_user), db: Session = Depends(get_db)
) -> ApiResponse[PatternOut]:
    return ok(chatbot_service.create_pattern(db, intent_id, form, user))


@router.put(
    "/patterns/{pattern_id}",
    response_model=ApiResponse[PatternOut],
    summary="Edit a training pattern (admin)",
    responses=error_responses(401, 403, 404, 409, 422),
)
def update_pattern(
    pattern_id: PatternId, form: PatternIn, user: User = Depends(get_admin_user), db: Session = Depends(get_db)
) -> ApiResponse[PatternOut]:
    return ok(chatbot_service.update_pattern(db, pattern_id, form, user))


@router.delete(
    "/patterns/{pattern_id}",
    response_model=ApiResponse[None],
    summary="Delete a training pattern (admin)",
    responses=error_responses(401, 403, 404, 422),
)
def delete_pattern(pattern_id: PatternId, user: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> ApiResponse[None]:
    chatbot_service.delete_pattern(db, pattern_id, user)
    return ok(None)


@router.post(
    "/intents/{intent_id}/responses",
    response_model=ApiResponse[ResponseOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add a reply to an intent (admin)",
    responses=error_responses(401, 403, 404, 409, 422),
)
def create_response(
    intent_id: IntentId, form: ResponseIn, user: User = Depends(get_admin_user), db: Session = Depends(get_db)
) -> ApiResponse[ResponseOut]:
    return ok(chatbot_service.create_response(db, intent_id, form, user))


@router.put(
    "/responses/{response_id}",
    response_model=ApiResponse[ResponseOut],
    summary="Edit a reply (admin)",
    responses=error_responses(401, 403, 404, 409, 422),
)
def update_response(
    response_id: ResponseId, form: ResponseIn, user: User = Depends(get_admin_user), db: Session = Depends(get_db)
) -> ApiResponse[ResponseOut]:
    return ok(chatbot_service.update_response(db, response_id, form, user))


@router.delete(
    "/responses/{response_id}",
    response_model=ApiResponse[None],
    summary="Delete a reply (admin)",
    responses=error_responses(401, 403, 404, 422),
)
def delete_response(response_id: ResponseId, user: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> ApiResponse[None]:
    chatbot_service.delete_response(db, response_id, user)
    return ok(None)


@router.get(
    "/unknown-messages",
    response_model=ApiResponse[list[UnknownMessageOut]],
    summary="List messages the chatbot couldn't classify (admin)",
    responses=error_responses(401, 403),
)
def list_unknown_messages(_: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> ApiResponse[list[UnknownMessageOut]]:
    return ok(chatbot_service.list_unknown_messages(db))


@router.delete(
    "/unknown-messages/{message_id}",
    response_model=ApiResponse[None],
    summary="Dismiss an unknown message (admin)",
    responses=error_responses(401, 403, 404, 422),
)
def delete_unknown_message(message_id: MessageId, user: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> ApiResponse[None]:
    chatbot_service.delete_unknown_message(db, message_id, user)
    return ok(None)


@router.post(
    "/unknown-messages/{message_id}/promote",
    response_model=ApiResponse[PatternOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add an unknown message as a pattern of an intent (admin)",
    responses=error_responses(401, 403, 404, 409, 422),
)
def promote_unknown_message(
    message_id: MessageId, form: PromoteIn, user: User = Depends(get_admin_user), db: Session = Depends(get_db)
) -> ApiResponse[PatternOut]:
    return ok(chatbot_service.promote_unknown_message(db, message_id, form, user))


@router.get(
    "/feedback",
    response_model=ApiResponse[list[FeedbackReviewOut]],
    summary="Thumbs-down replies waiting for review, newest first (admin)",
    responses=error_responses(401, 403),
)
def list_feedback(_: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> ApiResponse[list[FeedbackReviewOut]]:
    return ok(chatbot_service.list_feedback_reviews(db))


@router.post(
    "/feedback/{message_id}/promote",
    response_model=ApiResponse[PatternOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add the question behind a thumbs-down reply as a pattern of an intent (admin)",
    responses=error_responses(401, 403, 404, 409, 422),
)
def promote_feedback(
    message_id: MessageId, form: PromoteIn, user: User = Depends(get_admin_user), db: Session = Depends(get_db)
) -> ApiResponse[PatternOut]:
    return ok(chatbot_service.promote_feedback(db, message_id, form, user))


@router.post(
    "/feedback/{message_id}/dismiss",
    response_model=ApiResponse[None],
    summary="Remove a thumbs-down reply from the review queue (admin)",
    responses=error_responses(401, 403, 404, 422),
)
def dismiss_feedback(message_id: MessageId, user: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> ApiResponse[None]:
    chatbot_service.dismiss_feedback(db, message_id, user)
    return ok(None)


@router.get(
    "/analytics",
    response_model=ApiResponse[ChatbotAnalyticsOut],
    summary="Weekly fallback rate, unknown messages, feedback and intent mix (admin)",
    responses=error_responses(401, 403, 422),
)
def analytics(
    weeks: Annotated[int, Query(ge=ANALYTICS_MIN_WEEKS, le=ANALYTICS_MAX_WEEKS)] = ANALYTICS_DEFAULT_WEEKS,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ChatbotAnalyticsOut]:
    return ok(chatbot_service.analytics(db, weeks))


@router.get(
    "/trainings",
    response_model=ApiResponse[list[TrainingOut]],
    summary="List training runs, newest first (admin)",
    responses=error_responses(401, 403),
)
def list_trainings(_: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> ApiResponse[list[TrainingOut]]:
    return ok(chatbot_service.list_trainings(db))


@router.post(
    "/trainings",
    response_class=StreamingResponse,
    summary="Rebuild the chatbot index, evaluate it and stream progress as server-sent JSON events (admin)",
    responses={
        200: {"model": TrainingEvent, "content": {"text/event-stream": {}}},
        **error_responses(401, 403, 409, 422, 503),
    },
)
def start_training(user: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> StreamingResponse:
    return StreamingResponse(
        chatbot_service.start_training(db, user),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
