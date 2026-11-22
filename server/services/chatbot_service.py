import contextvars
import logging
import queue
import random
import threading
from collections.abc import Callable, Iterator
from dataclasses import asdict
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy.orm import Session

from server.core.errors import (
    AppError,
    ConflictError,
    ErrorCode,
    NotFoundError,
    ServiceUnavailableError,
    ValidationAppError,
)
from server.core.config import settings
from server.core.message_keys import MessageKey, render_english
from server.core.responses import ApiErrorItem
from server.database.models.audit_log import AuditAction, AuditOutcome
from server.database.models.book import Book
from server.database.models.chatbot import (
    DEFAULT_RESPONSE_LANGUAGE,
    PATTERN_MAX_LENGTH,
    STORED_MESSAGE_MAX_LENGTH,
    ChatbotConversation,
    ChatbotIntent,
    ChatbotMessage,
    ChatbotPattern,
    ChatbotResponse,
    ChatbotTraining,
    ChatRole,
    ResponseLanguage,
)
from server.database.models.user import User
from server.database.models.user_book_status import ReadingStatus
from server.database.schemas.chatbot import (
    AnalyticsWeekOut,
    ChatActionOut,
    ChatActionType,
    ChatbotAnalyticsOut,
    ChatBookOut,
    ChatHistoryMessageOut,
    ChatMessageIn,
    ChatReplyOut,
    ChatTestIn,
    ChatTestOut,
    ConversationOut,
    ExportResponsesOut,
    FeedbackIn,
    FeedbackOut,
    FeedbackReviewOut,
    IntentCountOut,
    IntentExportOut,
    IntentImportIn,
    IntentIn,
    IntentOut,
    IntentScoreOut,
    PatternIn,
    PatternOut,
    PatternOverlapOut,
    PromoteIn,
    ReplyLineOut,
    ResponseIn,
    ResponseOut,
    SeedIntent,
    SeedSummary,
    TrainingDoneEvent,
    TrainingErrorEvent,
    TrainingProgressEvent,
    TrainingOut,
    TrainingStartedEvent,
    UnknownMessageOut,
)
from server.ml import engine, nlp
from server.ml.errors import EngineUnavailable, ModelNotTrained
from server.repositories import chatbot_repository
from server.services import audit_service
from server.services.images import ImageFolder, image_url
from server.services.chatbot_replies import (
    BOOKS_SHOWN,
    FOLLOW_UPS,
    HANDLERS,
    RECOMMENDERS,
    SHORT_BOOK_PAGES,
    ChatContext,
    Line,
    Reply,
)

logger = logging.getLogger(__name__)

TRAINING_MIN_INTENTS = 2
KEEPALIVE_SECONDS = 15
MENTIONS_LIMIT = 3
HISTORY_LIMIT = 50
GENRE_SUGGESTIONS = 4
MOOD_SUGGESTIONS = (
    MessageKey.SUGGEST_MOOD_DARK,
    MessageKey.SUGGEST_MOOD_FUNNY,
    MessageKey.SUGGEST_MOOD_EMOTIONAL,
    MessageKey.SUGGEST_MOOD_TENSE,
)
GENRE_PROMPTS = {MessageKey.REPLY_GENRE_ASK.value, MessageKey.REPLY_GENRE_MISSING.value, MessageKey.REPLY_GENRE_NONE.value}
MOOD_PROMPTS = {MessageKey.REPLY_MOOD_ASK.value, MessageKey.REPLY_MOOD_NONE.value}
GENERAL_PROMPTS = {
    MessageKey.REPLY_NO_MORE.value,
    MessageKey.REPLY_FOLLOW_UP_NOTHING.value,
    MessageKey.REPLY_SEARCH_ASK.value,
    MessageKey.REPLY_SIMILAR_ASK.value,
    MessageKey.REPLY_BOOK_ASK.value,
    MessageKey.REPLY_AUTHOR_ASK.value,
    MessageKey.REPLY_SHELVES_EMPTY.value,
    MessageKey.REPLY_SHORT_NONE.value,
    MessageKey.REPLY_TASTE_EMPTY.value,
    MessageKey.REPLY_TASTE_NONE.value,
}
GENERAL_TAGS = frozenset({"greetings", "help", "bot_identity", "fallback", "deny", "thanks", "my_stats"})
PLACEHOLDERS: dict[ResponseLanguage, dict[str, str]] = {
    ResponseLanguage.EN: {"book": "this book", "author": "this author"},
    ResponseLanguage.RO: {"book": "această carte", "author": "acest autor"},
}
FALLBACKS = (MessageKey.REPLY_FALLBACK_REPHRASE, MessageKey.REPLY_FALLBACK_TOPICS, MessageKey.REPLY_FALLBACK_LEARNING)
_FINISHED = object()


def _unavailable() -> ServiceUnavailableError:
    return ServiceUnavailableError(MessageKey.CHATBOT_UNAVAILABLE, code=ErrorCode.CHATBOT_UNAVAILABLE)


def _require_intent(db: Session, intent_id: int, field: str | None = None) -> ChatbotIntent:
    intent = chatbot_repository.get_intent(db, intent_id)
    if intent is None:
        error = ValidationAppError if field else NotFoundError
        raise error(MessageKey.INTENT_NOT_FOUND, code=ErrorCode.CHATBOT_INTENT_NOT_FOUND, field=field)
    return intent


def _require_pattern(db: Session, pattern_id: int) -> ChatbotPattern:
    pattern = chatbot_repository.get_pattern(db, pattern_id)
    if pattern is None:
        raise NotFoundError(MessageKey.PATTERN_NOT_FOUND, code=ErrorCode.CHATBOT_PATTERN_NOT_FOUND)
    return pattern


def _require_response(db: Session, response_id: int) -> ChatbotResponse:
    response = chatbot_repository.get_response(db, response_id)
    if response is None:
        raise NotFoundError(MessageKey.RESPONSE_NOT_FOUND, code=ErrorCode.CHATBOT_RESPONSE_NOT_FOUND)
    return response


def _unique_tag(db: Session, tag: str, exclude_id: int | None) -> None:
    if chatbot_repository.tag_taken(db, tag, exclude_id):
        raise ConflictError(MessageKey.INTENT_EXISTS, params={"tag": tag}, code=ErrorCode.CHATBOT_INTENT_EXISTS, field="tag")


def _unique_pattern(db: Session, pattern: str, exclude_id: int | None) -> None:
    owner = chatbot_repository.pattern_owner(db, pattern, exclude_id)
    if owner is not None:
        raise ConflictError(
            MessageKey.PATTERN_EXISTS, params={"tag": owner.tag}, code=ErrorCode.CHATBOT_PATTERN_EXISTS, field="pattern"
        )


def _unique_response(db: Session, intent_id: int, form: ResponseIn, exclude_id: int | None) -> None:
    if chatbot_repository.response_taken(db, intent_id, form.language.value, form.response, exclude_id):
        raise ConflictError(MessageKey.RESPONSE_EXISTS, code=ErrorCode.CHATBOT_RESPONSE_EXISTS, field="response")


def _intent(intent: ChatbotIntent) -> IntentOut:
    return IntentOut(
        id=intent.id,
        tag=intent.tag,
        type=intent.type,
        handled=intent.tag in HANDLERS,
        patterns=[PatternOut.model_validate(pattern) for pattern in intent.patterns],
        responses=[ResponseOut.model_validate(response) for response in intent.responses],
    )


def _intent_out(db: Session, intent_id: int) -> IntentOut:
    db.expire_all()
    return _intent(chatbot_repository.list_intents(db, intent_id)[0])


def list_intents(db: Session) -> list[IntentOut]:
    return [_intent(intent) for intent in chatbot_repository.list_intents(db)]


def create_intent(db: Session, form: IntentIn, user: User) -> IntentOut:
    with audit_service.track(db, AuditAction.CHATBOT_INTENT_CREATE, actor=user, params={"username": user.username, "tag": form.tag}) as entry:
        _unique_tag(db, form.tag, None)
        intent = ChatbotIntent(tag=form.tag, type=form.type.value)
        chatbot_repository.add(db, intent)
        entry.set_entity("chatbot_intent", intent.id)
    return _intent_out(db, intent.id)


def update_intent(db: Session, intent_id: int, form: IntentIn, user: User) -> IntentOut:
    params = {"username": user.username, "intent_id": intent_id}
    with audit_service.track(db, AuditAction.CHATBOT_INTENT_UPDATE, actor=user, params=params) as entry:
        entry.set_entity("chatbot_intent", intent_id)
        intent = _require_intent(db, intent_id)
        _unique_tag(db, form.tag, intent_id)
        intent.tag = form.tag
        intent.type = form.type.value
        entry.params["tag"] = form.tag
        db.flush()
    return _intent_out(db, intent_id)


def delete_intent(db: Session, intent_id: int, user: User) -> None:
    params = {"username": user.username, "intent_id": intent_id}
    with audit_service.track(db, AuditAction.CHATBOT_INTENT_DELETE, actor=user, params=params) as entry:
        entry.set_entity("chatbot_intent", intent_id)
        intent = _require_intent(db, intent_id)
        entry.params["tag"] = intent.tag
        chatbot_repository.delete(db, intent)


def create_pattern(db: Session, intent_id: int, form: PatternIn, user: User) -> PatternOut:
    params = {"username": user.username, "intent_id": intent_id}
    with audit_service.track(db, AuditAction.CHATBOT_PATTERN_CREATE, actor=user, params=params) as entry:
        intent = _require_intent(db, intent_id)
        entry.params["tag"] = intent.tag
        _unique_pattern(db, form.pattern, None)
        pattern = ChatbotPattern(pattern=form.pattern, intent_id=intent_id)
        chatbot_repository.add(db, pattern)
        entry.set_entity("chatbot_pattern", pattern.id)
    return PatternOut.model_validate(pattern)


def update_pattern(db: Session, pattern_id: int, form: PatternIn, user: User) -> PatternOut:
    params = {"username": user.username, "pattern_id": pattern_id}
    with audit_service.track(db, AuditAction.CHATBOT_PATTERN_UPDATE, actor=user, params=params) as entry:
        entry.set_entity("chatbot_pattern", pattern_id)
        pattern = _require_pattern(db, pattern_id)
        entry.params["tag"] = pattern.intent.tag
        _unique_pattern(db, form.pattern, pattern_id)
        pattern.pattern = form.pattern
        db.flush()
    return PatternOut.model_validate(pattern)


def delete_pattern(db: Session, pattern_id: int, user: User) -> None:
    params = {"username": user.username, "pattern_id": pattern_id}
    with audit_service.track(db, AuditAction.CHATBOT_PATTERN_DELETE, actor=user, params=params) as entry:
        entry.set_entity("chatbot_pattern", pattern_id)
        pattern = _require_pattern(db, pattern_id)
        entry.params["tag"] = pattern.intent.tag
        chatbot_repository.delete(db, pattern)


def create_response(db: Session, intent_id: int, form: ResponseIn, user: User) -> ResponseOut:
    params = {"username": user.username, "intent_id": intent_id}
    with audit_service.track(db, AuditAction.CHATBOT_RESPONSE_CREATE, actor=user, params=params) as entry:
        intent = _require_intent(db, intent_id)
        entry.params["tag"] = intent.tag
        _unique_response(db, intent_id, form, None)
        response = ChatbotResponse(response=form.response, language=form.language.value, intent_id=intent_id)
        chatbot_repository.add(db, response)
        entry.set_entity("chatbot_response", response.id)
    return ResponseOut.model_validate(response)


def update_response(db: Session, response_id: int, form: ResponseIn, user: User) -> ResponseOut:
    params = {"username": user.username, "response_id": response_id}
    with audit_service.track(db, AuditAction.CHATBOT_RESPONSE_UPDATE, actor=user, params=params) as entry:
        entry.set_entity("chatbot_response", response_id)
        response = _require_response(db, response_id)
        entry.params["tag"] = response.intent.tag
        _unique_response(db, response.intent_id, form, response_id)
        response.response = form.response
        response.language = form.language.value
        db.flush()
    return ResponseOut.model_validate(response)


def delete_response(db: Session, response_id: int, user: User) -> None:
    params = {"username": user.username, "response_id": response_id}
    with audit_service.track(db, AuditAction.CHATBOT_RESPONSE_DELETE, actor=user, params=params) as entry:
        entry.set_entity("chatbot_response", response_id)
        response = _require_response(db, response_id)
        entry.params["tag"] = response.intent.tag
        chatbot_repository.delete(db, response)


def list_unknown_messages(db: Session) -> list[UnknownMessageOut]:
    return [UnknownMessageOut.model_validate(message) for message in chatbot_repository.list_unknown_messages(db)]


def _require_unknown(db: Session, message_id: int):
    message = chatbot_repository.get_unknown_message(db, message_id)
    if message is None:
        raise NotFoundError(MessageKey.UNKNOWN_MESSAGE_NOT_FOUND, code=ErrorCode.CHATBOT_UNKNOWN_NOT_FOUND)
    return message


def delete_unknown_message(db: Session, message_id: int, user: User) -> None:
    params = {"username": user.username, "message_id": message_id}
    with audit_service.track(db, AuditAction.CHATBOT_UNKNOWN_DELETE, actor=user, params=params) as entry:
        entry.set_entity("chatbot_unknown_message", message_id)
        chatbot_repository.delete(db, _require_unknown(db, message_id))


def _add_pattern(db: Session, intent: ChatbotIntent, text: str) -> ChatbotPattern:
    form = PatternIn(pattern=text)
    _unique_pattern(db, form.pattern, None)
    pattern = ChatbotPattern(pattern=form.pattern, intent_id=intent.id)
    chatbot_repository.add(db, pattern)
    return pattern


def promote_unknown_message(db: Session, message_id: int, form: PromoteIn, user: User) -> PatternOut:
    params = {"username": user.username, "message_id": message_id}
    with audit_service.track(db, AuditAction.CHATBOT_UNKNOWN_PROMOTE, actor=user, params=params) as entry:
        entry.set_entity("chatbot_unknown_message", message_id)
        message = _require_unknown(db, message_id)
        intent = _require_intent(db, form.intent_id, field="intent_id")
        entry.params["tag"] = intent.tag
        pattern = _add_pattern(db, intent, message.message)
        chatbot_repository.delete(db, message)
    return PatternOut.model_validate(pattern)


def list_trainings(db: Session) -> list[TrainingOut]:
    return [TrainingOut.model_validate(training) for training in chatbot_repository.list_trainings(db)]


def _conversation(db: Session, user: User, conversation_id: int | None) -> ChatbotConversation:
    if conversation_id is None:
        conversation = ChatbotConversation(user_id=user.id)
        chatbot_repository.add(db, conversation)
        return conversation
    conversation = chatbot_repository.get_conversation(db, conversation_id, user.id)
    if conversation is None:
        raise NotFoundError(
            MessageKey.CONVERSATION_NOT_FOUND, code=ErrorCode.CONVERSATION_NOT_FOUND, field="conversation_id"
        )
    return conversation


def _engine(call: Callable, *args):
    try:
        return call(*args)
    except ModelNotTrained as error:
        raise ServiceUnavailableError(
            MessageKey.CHATBOT_NOT_TRAINED, code=ErrorCode.CHATBOT_NOT_TRAINED, hint_key=MessageKey.CHATBOT_NOT_TRAINED_HINT
        ) from error
    except EngineUnavailable as error:
        raise _unavailable() from error


def _context(db: Session, user: User, message: str, tz: str) -> ChatContext:
    names = nlp.entity_names(message)
    ctx = ChatContext(
        user=user,
        modifiers=nlp.extract_modifiers(message),
        tz=tz,
        books=chatbot_repository.books_mentioned(db, message, MENTIONS_LIMIT),
        authors=chatbot_repository.authors_mentioned(db, message, MENTIONS_LIMIT),
        genres=chatbot_repository.genres_mentioned(db, message, MENTIONS_LIMIT),
        excluded_ids=chatbot_repository.excluded_book_ids(db, user.id),
    )
    for name in names:
        book = chatbot_repository.find_book_by_title(db, name)
        if book is not None and book not in ctx.books:
            ctx.books.append(book)
        author = chatbot_repository.find_author_by_name(db, name)
        if author is not None and author not in ctx.authors:
            ctx.authors.append(author)
    for name in ctx.modifiers.genres:
        genre = chatbot_repository.find_genre_by_name(db, name)
        if genre is not None and genre not in ctx.genres:
            ctx.genres.append(genre)
    return ctx


def _line(key: MessageKey, params: dict) -> ReplyLineOut:
    return ReplyLineOut(key=key.value, params=params, text=render_english(key, params))


def _lines(reply: Reply) -> list[ReplyLineOut]:
    return [_line(key, params) for key, params in reply.lines]


def _actions(book_id: int, status: str | None) -> list[ChatActionOut]:
    start = ChatActionOut(type=ChatActionType.START_SESSION, book_id=book_id, status=None)
    if status is None:
        shelve = ChatActionOut(type=ChatActionType.ADD_TO_SHELF, book_id=book_id, status=ReadingStatus.WANT_TO_READ)
        return [shelve, start]
    if status in (ReadingStatus.WANT_TO_READ, ReadingStatus.CURRENTLY_READING):
        return [start]
    return []


def _book_out(book: Book, status: str | None, reason: ReplyLineOut | None) -> ChatBookOut:
    return ChatBookOut(
        id=book.id,
        title=book.title,
        author_name=book.author.full_name if book.author else None,
        average_rating=float(book.average_rating) if book.average_rating is not None else None,
        cover_url=image_url(ImageFolder.BOOKS, book.images[0]) if book.images else None,
        reason=reason,
        actions=_actions(book.id, status),
    )


def _books_out(db: Session, user: User, books: list[Book], reasons: dict[int, ReplyLineOut]) -> list[ChatBookOut]:
    statuses = chatbot_repository.book_statuses(db, user.id, [book.id for book in books])
    return [_book_out(book, statuses.get(book.id), reasons.get(book.id)) for book in books]


def _reason_lines(books: list[Book], reasons: dict[int, Line]) -> dict[int, ReplyLineOut]:
    return {book.id: _line(*reasons[book.id]) for book in books if book.id in reasons}


def _response_in(intent: ChatbotIntent, language: ResponseLanguage) -> str | None:
    for wanted in (language, DEFAULT_RESPONSE_LANGUAGE):
        options = [response.response for response in intent.responses if response.language == wanted]
        if options:
            return random.choice(options)
    return None


def _intent_text(message: str, ctx: ChatContext, language: ResponseLanguage) -> str:
    placeholders = PLACEHOLDERS[language]
    replacements = {book.title: placeholders["book"] for book in ctx.books}
    replacements |= {author.full_name: placeholders["author"] for author in ctx.authors}
    return nlp.mask(message, replacements)


def _response_lines(intent: ChatbotIntent, language: ResponseLanguage) -> list[ReplyLineOut]:
    text = _response_in(intent, language)
    if text is not None:
        return [ReplyLineOut(key=None, params={}, text=text)]
    return _lines(Reply([(MessageKey.REPLY_NO_RESPONSE, {})]))


def _save_state(conversation: ChatbotConversation, tag: str, ctx: ChatContext, shown: list[int], max_pages: int | None) -> None:
    conversation.state = {
        "handler": tag,
        "book_ids": [book.id for book in ctx.books],
        "author_ids": [author.id for author in ctx.authors],
        "genre_ids": [genre.id for genre in ctx.genres],
        "modifiers": asdict(ctx.modifiers),
        "shown": shown,
        "max_pages": max_pages,
    }


def _restore(db: Session, user: User, state: dict, tz: str) -> ChatContext:
    return ChatContext(
        user=user,
        modifiers=nlp.Modifiers(**state.get("modifiers", {})),
        tz=tz,
        books=chatbot_repository.books_with_details(db, state.get("book_ids", [])),
        authors=chatbot_repository.authors_by_ids(db, state.get("author_ids", [])),
        genres=chatbot_repository.genres_by_ids(db, state.get("genre_ids", [])),
        excluded_ids=chatbot_repository.excluded_book_ids(db, user.id),
    )


def _fits(book: Book, shown: set[int], max_pages: int | None) -> bool:
    return book.id not in shown and (max_pages is None or (book.pages is not None and book.pages <= max_pages))


Answer = tuple[list[ReplyLineOut], list[Book], dict[int, ReplyLineOut]]


def _follow_up(db: Session, user: User, conversation: ChatbotConversation, tag: str, tz: str) -> Answer:
    state = conversation.state or {}
    handler_tag = state.get("handler")
    if handler_tag not in RECOMMENDERS:
        return _lines(Reply([(MessageKey.REPLY_FOLLOW_UP_NOTHING, {})])), [], {}

    shorter = tag == "refine_shorter"
    max_pages = SHORT_BOOK_PAGES if shorter else state.get("max_pages")
    shown = set(state.get("shown", []))
    reply = HANDLERS[handler_tag](_restore(db, user, state, tz), db)
    books = [book for book in reply.books if _fits(book, shown, max_pages)][:BOOKS_SHOWN]
    if not books:
        key, params = (MessageKey.REPLY_SHORT_NONE, {"pages": SHORT_BOOK_PAGES}) if shorter else (MessageKey.REPLY_NO_MORE, {})
        return _lines(Reply([(key, params)])), [], {}

    conversation.state = {**state, "shown": [*shown, *(book.id for book in books)], "max_pages": max_pages}
    key, params = (MessageKey.REPLY_SHORT_FOUND, {"pages": SHORT_BOOK_PAGES}) if shorter else (MessageKey.REPLY_MORE_FOUND, {})
    return _lines(Reply([(key, params)])), books, _reason_lines(books, reply.reasons)


def _answer(
    db: Session,
    user: User,
    conversation: ChatbotConversation,
    ctx: ChatContext,
    intent: ChatbotIntent,
    language: ResponseLanguage,
) -> Answer:
    if intent.tag in FOLLOW_UPS:
        return _follow_up(db, user, conversation, intent.tag, ctx.tz)
    handler = HANDLERS.get(intent.tag)
    if handler is None:
        return _response_lines(intent, language), [], {}
    reply = handler(ctx, db)
    books = reply.books[:BOOKS_SHOWN]
    if intent.tag in RECOMMENDERS:
        _save_state(conversation, intent.tag, ctx, [book.id for book in books], None)
    return _lines(reply), books, _reason_lines(books, reply.reasons)


def _suggestions(db: Session, tag: str | None, lines: list[ReplyLineOut], books: list[Book]) -> list[ReplyLineOut]:
    keys = {line.key for line in lines}
    if books and (tag in RECOMMENDERS or tag in FOLLOW_UPS):
        chosen = [(MessageKey.SUGGEST_MORE, {}), (MessageKey.SUGGEST_SHORTER, {})]
    elif keys & GENRE_PROMPTS:
        chosen = [(MessageKey.SUGGEST_GENRE, {"genre": genre.name}) for genre in chatbot_repository.top_genres(db, GENRE_SUGGESTIONS)]
    elif keys & MOOD_PROMPTS:
        chosen = [(key, {}) for key in MOOD_SUGGESTIONS]
    elif tag is None or tag in GENERAL_TAGS or keys & GENERAL_PROMPTS:
        chosen = [
            (MessageKey.SUGGEST_RECOMMEND, {}),
            (MessageKey.SUGGEST_SHELVES, {}),
            (MessageKey.SUGGEST_STATS, {}),
            (MessageKey.SUGGEST_HELP, {}),
        ]
    else:
        chosen = []
    return _lines(Reply(chosen))


def send_message(db: Session, user: User, form: ChatMessageIn, language: ResponseLanguage) -> ChatReplyOut:
    conversation = _conversation(db, user, form.conversation_id)
    ctx = _context(db, user, form.message, form.tz)
    prediction = _engine(engine.predict, _intent_text(form.message, ctx, language))
    confident = prediction.confidence >= settings.chatbot_min_similarity and prediction.margin >= settings.chatbot_min_margin
    intent = chatbot_repository.get_intent_by_tag(db, prediction.tag) if confident else None

    if intent is None:
        chatbot_repository.record_unknown_message(db, form.message, prediction.confidence)
        lines, books, reasons = _lines(Reply([(random.choice(FALLBACKS), {})])), [], {}
    else:
        lines, books, reasons = _answer(db, user, conversation, ctx, intent, language)
    tag = intent.tag if intent else None
    suggestions = _suggestions(db, tag, lines, books)

    bot_message = ChatbotMessage(
        conversation_id=conversation.id,
        role=ChatRole.BOT.value,
        message=" ".join(line.text for line in lines)[:STORED_MESSAGE_MAX_LENGTH],
        intent_id=intent.id if intent else None,
        confidence=prediction.confidence,
        fallback=intent is None,
        lines=[line.model_dump() for line in lines],
        books=[
            {"id": book.id, "reason": reasons[book.id].model_dump() if book.id in reasons else None}
            for book in books
        ],
    )
    chatbot_repository.add_messages(
        db,
        ChatbotMessage(conversation_id=conversation.id, role=ChatRole.USER.value, message=form.message),
        bot_message,
    )
    message_id = bot_message.id
    db.commit()
    return ChatReplyOut(
        conversation_id=conversation.id,
        message_id=message_id,
        lines=lines,
        books=_books_out(db, user, books, reasons),
        suggestions=suggestions,
        intent=tag,
        confidence=round(prediction.confidence, 4),
        fallback=intent is None,
    )


def _history_lines(message: ChatbotMessage) -> list[ReplyLineOut]:
    if message.role == ChatRole.USER:
        return []
    if message.lines:
        return [ReplyLineOut.model_validate(line) for line in message.lines]
    return [ReplyLineOut(key=None, params={}, text=message.message)]


def _stored_books(message: ChatbotMessage, books: dict[int, Book], statuses: dict[int, str]) -> list[ChatBookOut]:
    return [
        _book_out(
            books[item["id"]],
            statuses.get(item["id"]),
            ReplyLineOut.model_validate(item["reason"]) if item.get("reason") else None,
        )
        for item in message.books or []
        if item["id"] in books
    ]


def latest_conversation(db: Session, user: User) -> ConversationOut | None:
    conversation = chatbot_repository.latest_conversation(db, user.id)
    if conversation is None:
        return None
    messages = chatbot_repository.conversation_messages(db, conversation.id, HISTORY_LIMIT)
    book_ids = sorted({item["id"] for message in messages for item in message.books or []})
    books = {book.id: book for book in chatbot_repository.books_by_ids(db, book_ids)}
    statuses = chatbot_repository.book_statuses(db, user.id, book_ids)
    return ConversationOut(
        id=conversation.id,
        messages=[
            ChatHistoryMessageOut(
                id=message.id,
                role=message.role,
                text=message.message,
                lines=_history_lines(message),
                books=_stored_books(message, books, statuses),
                intent=message.intent.tag if message.intent else None,
                feedback=message.feedback,
                created_at=message.created_at,
            )
            for message in messages
        ],
    )


def delete_conversation(db: Session, user: User, conversation_id: int) -> None:
    params = {"username": user.username, "conversation_id": conversation_id}
    with audit_service.track(db, AuditAction.CHATBOT_CONVERSATION_DELETE, actor=user, params=params) as entry:
        entry.set_entity("chatbot_conversation", conversation_id)
        conversation = chatbot_repository.get_conversation(db, conversation_id, user.id)
        if conversation is None:
            raise NotFoundError(MessageKey.CONVERSATION_NOT_FOUND, code=ErrorCode.CONVERSATION_NOT_FOUND)
        chatbot_repository.delete(db, conversation)


def _error_item(error: AppError) -> ApiErrorItem:
    return ApiErrorItem(code=error.code.value, key=error.key.value, params=error.params, message=error.message)


TrainingEventSink = Callable[[TrainingProgressEvent | TrainingDoneEvent | TrainingErrorEvent], None]


def _progress_event(progress: engine.IndexProgress) -> TrainingProgressEvent:
    return TrainingProgressEvent(stage=progress.stage, done=progress.done, total=progress.total)


def _run_training(bind, entry: audit_service.AuditEntry, samples: list[tuple[str, str]], emit: TrainingEventSink) -> bool:
    with Session(bind=bind) as db:
        try:
            result = engine.build_index(samples, lambda progress: emit(_progress_event(progress)))
        except Exception:
            logger.exception("Chatbot index build failed")
            error = AppError(MessageKey.TRAINING_FAILED, code=ErrorCode.TRAINING_FAILED, status_code=500)
            training = ChatbotTraining(model=settings.chatbot_model, success=False, samples=len(samples))
            chatbot_repository.add(db, training)
            entry.set_entity("chatbot_training", training.id)
            audit_service.record(db, AuditAction.CHATBOT_TRAIN, outcome=AuditOutcome.FAILURE, entry=entry, error=error)
            db.commit()
            emit(TrainingErrorEvent(error=_error_item(error)))
            return False
        training = ChatbotTraining(
            model=result.model,
            success=True,
            samples=result.samples,
            intents=result.intents,
            accuracy=result.accuracy,
            confused_pairs=[pair.__dict__ for pair in result.confused_pairs],
        )
        chatbot_repository.add(db, training)
        entry.set_entity("chatbot_training", training.id)
        audit_service.record(db, AuditAction.CHATBOT_TRAIN, outcome=AuditOutcome.SUCCESS, entry=entry)
        db.commit()
        db.refresh(training)
        emit(TrainingDoneEvent(training=TrainingOut.model_validate(training)))
        return True


def _train_in_background(bind, entry: audit_service.AuditEntry, samples: list[tuple[str, str]], events: queue.Queue) -> None:
    try:
        _run_training(bind, entry, samples, events.put)
    finally:
        engine.release_training()
        events.put(_FINISHED)


def _check_training(db: Session) -> list[tuple[str, str]]:
    samples = chatbot_repository.training_samples(db)
    if len({tag for _, tag in samples}) < TRAINING_MIN_INTENTS:
        raise ValidationAppError(
            MessageKey.TRAINING_NOT_ENOUGH_INTENTS,
            params={"min": TRAINING_MIN_INTENTS},
            code=ErrorCode.TRAINING_NOT_ENOUGH_INTENTS,
        )
    try:
        engine.ensure_available()
    except EngineUnavailable as error:
        raise _unavailable() from error
    if not engine.reserve_training():
        raise ConflictError(MessageKey.TRAINING_IN_PROGRESS, code=ErrorCode.TRAINING_IN_PROGRESS)
    return samples


def _begin_training(db: Session, operator: str, user: User | None) -> tuple[audit_service.AuditEntry, list[tuple[str, str]]]:
    entry = audit_service.AuditEntry(params={"username": operator})
    if user is not None:
        entry.set_actor(user)
    try:
        samples = _check_training(db)
    except AppError as error:
        db.rollback()
        audit_service.record(db, AuditAction.CHATBOT_TRAIN, outcome=AuditOutcome.FAILURE, entry=entry, error=error)
        db.commit()
        raise
    entry.params["samples"] = len(samples)
    return entry, samples


def _started(samples: list[tuple[str, str]]) -> TrainingStartedEvent:
    return TrainingStartedEvent(model=settings.chatbot_model, intents=len({tag for _, tag in samples}), samples=len(samples))


def start_training(db: Session, user: User) -> Iterator[str]:
    entry, samples = _begin_training(db, user.username, user)
    events: queue.Queue = queue.Queue()
    events.put(_started(samples))
    context = contextvars.copy_context()
    thread = threading.Thread(
        target=context.run, args=(_train_in_background, db.get_bind(), entry, samples, events), daemon=True
    )
    thread.start()
    return _stream(events)


def train_now(db: Session, operator: str, emit: Callable[[object], None]) -> bool:
    entry, samples = _begin_training(db, operator, None)
    emit(_started(samples))
    try:
        return _run_training(db.get_bind(), entry, samples, emit)
    finally:
        engine.release_training()


def _summary(intents: list[SeedIntent]) -> SeedSummary:
    return SeedSummary(
        intents=len(intents),
        patterns=sum(len(item.patterns) for item in intents),
        responses=sum(len(item.responses.en) + len(item.responses.ro) for item in intents),
    )


def _clear(db: Session, intent: ChatbotIntent) -> None:
    for item in [*intent.patterns, *intent.responses]:
        db.delete(item)
    db.flush()


def _load_intents(db: Session, intents: list[SeedIntent], replace: bool) -> None:
    existing = {intent.tag: intent for intent in chatbot_repository.list_intents(db)}
    incoming = {item.tag for item in intents}
    if replace:
        for tag, intent in existing.items():
            if tag in incoming:
                _clear(db, intent)
            else:
                chatbot_repository.delete(db, intent)
        existing = {tag: intent for tag, intent in existing.items() if tag in incoming}
    for item in intents:
        intent = existing.get(item.tag)
        if intent is None:
            intent = ChatbotIntent(tag=item.tag, type=item.type.value)
            chatbot_repository.add(db, intent)
            existing[item.tag] = intent
        elif replace:
            intent.type = item.type.value
        for text in item.patterns:
            owner = chatbot_repository.pattern_owner(db, text, None)
            if owner is None or owner.id != intent.id:
                _add_pattern(db, intent, text)
        for language, texts in ((ResponseLanguage.EN, item.responses.en), (ResponseLanguage.RO, item.responses.ro)):
            for text in texts:
                if not chatbot_repository.response_taken(db, intent.id, language.value, text, None):
                    chatbot_repository.add(db, ChatbotResponse(response=text, language=language.value, intent_id=intent.id))


def seed_intents(db: Session, intents: list[SeedIntent], *, replace: bool) -> SeedSummary:
    summary = _summary(intents)
    with audit_service.track(db, AuditAction.CHATBOT_SEED, params=summary.model_dump()):
        _load_intents(db, intents, replace)
    return summary


def import_intents(db: Session, form: IntentImportIn, user: User) -> SeedSummary:
    summary = _summary(form.intents)
    params = {"username": user.username, **summary.model_dump(), "replace": form.replace}
    with audit_service.track(db, AuditAction.CHATBOT_IMPORT, actor=user, params=params):
        _load_intents(db, form.intents, form.replace)
    return summary


def export_intents(db: Session) -> list[IntentExportOut]:
    return [
        IntentExportOut(
            tag=intent.tag,
            type=intent.type,
            patterns=[pattern.pattern for pattern in intent.patterns],
            responses=ExportResponsesOut(
                en=[response.response for response in intent.responses if response.language == ResponseLanguage.EN],
                ro=[response.response for response in intent.responses if response.language == ResponseLanguage.RO],
            ),
        )
        for intent in chatbot_repository.list_intents(db)
    ]


def test_message(db: Session, user: User, form: ChatTestIn, language: ResponseLanguage) -> ChatTestOut:
    ctx = _context(db, user, form.message, "UTC")
    masked = _intent_text(form.message, ctx, language)
    ranking = _engine(engine.rank, masked)
    prediction = ranking.prediction
    confident = prediction.confidence >= settings.chatbot_min_similarity and prediction.margin >= settings.chatbot_min_margin
    intent_ids = {intent.tag: intent.id for intent in chatbot_repository.list_intents(db)}
    return ChatTestOut(
        masked=masked,
        intent=prediction.tag if confident and prediction.tag in intent_ids else None,
        confidence=round(prediction.confidence, 4),
        margin=round(prediction.margin, 4),
        min_similarity=settings.chatbot_min_similarity,
        min_margin=settings.chatbot_min_margin,
        fallback=not confident or prediction.tag not in intent_ids,
        candidates=[IntentScoreOut(intent_id=intent_ids.get(tag), tag=tag, score=round(score, 4)) for tag, score in ranking.scores],
    )


def set_feedback(db: Session, user: User, message_id: int, form: FeedbackIn) -> FeedbackOut:
    feedback = form.feedback.value if form.feedback else None
    params = {"username": user.username, "message_id": message_id, "feedback": feedback}
    with audit_service.track(db, AuditAction.CHATBOT_FEEDBACK, actor=user, params=params) as entry:
        entry.set_entity("chatbot_message", message_id)
        message = chatbot_repository.get_user_bot_message(db, message_id, user.id)
        if message is None:
            raise NotFoundError(MessageKey.MESSAGE_NOT_FOUND, code=ErrorCode.CHATBOT_MESSAGE_NOT_FOUND)
        if message.feedback != feedback:
            message.feedback = feedback
            message.feedback_reviewed = False
        db.flush()
    return FeedbackOut(message_id=message_id, feedback=form.feedback)


def _review(message: ChatbotMessage, question: str | None) -> FeedbackReviewOut:
    return FeedbackReviewOut(
        id=message.id,
        question=question,
        lines=_history_lines(message),
        intent=message.intent.tag if message.intent else None,
        confidence=message.confidence,
        created_at=message.created_at,
    )


def list_feedback_reviews(db: Session) -> list[FeedbackReviewOut]:
    return [_review(message, question) for message, question in chatbot_repository.feedback_queue(db)]


def _require_feedback(db: Session, message_id: int) -> tuple[ChatbotMessage, str | None]:
    found = chatbot_repository.get_pending_feedback(db, message_id)
    if found is None:
        raise NotFoundError(MessageKey.FEEDBACK_NOT_FOUND, code=ErrorCode.CHATBOT_FEEDBACK_NOT_FOUND)
    return found


def promote_feedback(db: Session, message_id: int, form: PromoteIn, user: User) -> PatternOut:
    params = {"username": user.username, "message_id": message_id}
    with audit_service.track(db, AuditAction.CHATBOT_FEEDBACK_PROMOTE, actor=user, params=params) as entry:
        entry.set_entity("chatbot_message", message_id)
        message, question = _require_feedback(db, message_id)
        if not question:
            raise ValidationAppError(MessageKey.FEEDBACK_NO_QUESTION, code=ErrorCode.CHATBOT_FEEDBACK_NO_QUESTION)
        intent = _require_intent(db, form.intent_id, field="intent_id")
        entry.params["tag"] = intent.tag
        pattern = _add_pattern(db, intent, question[:PATTERN_MAX_LENGTH])
        message.feedback_reviewed = True
        db.flush()
    return PatternOut.model_validate(pattern)


def dismiss_feedback(db: Session, message_id: int, user: User) -> None:
    params = {"username": user.username, "message_id": message_id}
    with audit_service.track(db, AuditAction.CHATBOT_FEEDBACK_DISMISS, actor=user, params=params) as entry:
        entry.set_entity("chatbot_message", message_id)
        message, _ = _require_feedback(db, message_id)
        message.feedback_reviewed = True
        db.flush()


def _week_start(day: date) -> date:
    return day - timedelta(days=day.weekday())


def analytics(db: Session, weeks: int) -> ChatbotAnalyticsOut:
    first = _week_start(datetime.now(UTC).date()) - timedelta(weeks=weeks - 1)
    since = datetime.combine(first, time.min, tzinfo=UTC)
    messages = chatbot_repository.weekly_messages(db, since)
    unknowns = chatbot_repository.weekly_unknowns(db, since)
    rows = []
    for offset in range(weeks):
        start = first + timedelta(weeks=offset)
        total, fallbacks, up, down = messages.get(start, (0, 0, 0, 0))
        rows.append(
            AnalyticsWeekOut(
                week_start=start,
                messages=total,
                fallbacks=fallbacks,
                unknowns=unknowns.get(start, 0),
                thumbs_up=up,
                thumbs_down=down,
            )
        )
    return ChatbotAnalyticsOut(
        weeks=rows,
        intents=[IntentCountOut(tag=tag, count=count) for tag, count in chatbot_repository.intent_counts(db, since)],
    )


def intent_overlaps(db: Session, intent_id: int) -> list[PatternOverlapOut]:
    intent = _require_intent(db, intent_id)
    patterns = list(intent.patterns)
    try:
        found = engine.overlaps([pattern.pattern for pattern in patterns], intent.tag, settings.chatbot_overlap_similarity)
    except ModelNotTrained:
        return []
    except EngineUnavailable as error:
        raise _unavailable() from error
    current = chatbot_repository.patterns_by_text(db, [overlap.other_text for overlap in found])
    result = []
    for overlap in found:
        other = current.get(overlap.other_text.lower())
        if other is None or other.intent_id == intent.id:
            continue
        result.append(
            PatternOverlapOut(
                pattern_id=patterns[overlap.index].id,
                other_pattern_id=other.id,
                other_pattern=other.pattern,
                other_intent_id=other.intent_id,
                other_tag=other.intent.tag,
                similarity=round(overlap.similarity, 4),
            )
        )
    return result


def _stream(events: queue.Queue) -> Iterator[str]:
    while True:
        try:
            event = events.get(timeout=KEEPALIVE_SECONDS)
        except queue.Empty:
            yield ": keep-alive\n\n"
            continue
        if event is _FINISHED:
            return
        yield f"data: {event.model_dump_json()}\n\n"
