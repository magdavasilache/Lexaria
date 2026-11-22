import re
from datetime import date, datetime
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import AfterValidator, Field

from server.core.message_keys import MessageKey, MessageParam, key_error
from server.core.responses import ApiErrorItem
from server.database.models.chatbot import (
    CHAT_MESSAGE_MAX_LENGTH,
    IMPORT_MAX_INTENTS,
    IMPORT_MAX_PATTERNS,
    IMPORT_MAX_RESPONSES,
    INTENT_TAG_MAX_LENGTH,
    INTENT_TAG_PATTERN,
    PATTERN_MAX_LENGTH,
    RESPONSE_MAX_LENGTH,
    TRAINING_MODEL_MAX_LENGTH,
    ChatFeedback,
    ChatRole,
    IntentType,
    ResponseLanguage,
)
from server.database.models.user_book_status import ReadingStatus
from server.database.schemas.base import Id, InputSchema, OutputSchema, name_field
from server.database.schemas.reading import TimeZone


def _intent_tag(value: str) -> str:
    tag = "_".join(value.lower().split())
    if not re.fullmatch(INTENT_TAG_PATTERN, tag):
        raise key_error(MessageKey.INTENT_TAG_PATTERN)
    return tag


IntentTag = Annotated[
    str,
    Field(min_length=1, max_length=INTENT_TAG_MAX_LENGTH, json_schema_extra={"pattern": INTENT_TAG_PATTERN}),
    AfterValidator(_intent_tag),
]


class IntentIn(InputSchema):
    tag: IntentTag
    type: IntentType


class PatternIn(InputSchema):
    pattern: name_field(PATTERN_MAX_LENGTH)


class ResponseIn(InputSchema):
    response: Annotated[str, Field(min_length=1, max_length=RESPONSE_MAX_LENGTH)]
    language: ResponseLanguage


class PromoteIn(InputSchema):
    intent_id: Id


class ChatTestIn(InputSchema):
    message: name_field(CHAT_MESSAGE_MAX_LENGTH)


class FeedbackIn(InputSchema):
    feedback: ChatFeedback | None


class ChatMessageIn(InputSchema):
    message: name_field(CHAT_MESSAGE_MAX_LENGTH)
    conversation_id: Id | None = None
    tz: TimeZone = "UTC"


class ChatActionType(StrEnum):
    ADD_TO_SHELF = "add_to_shelf"
    START_SESSION = "start_session"


class PatternOut(OutputSchema):
    id: int
    pattern: Annotated[str, Field(max_length=PATTERN_MAX_LENGTH)]
    intent_id: int


class ResponseOut(OutputSchema):
    id: int
    response: Annotated[str, Field(max_length=RESPONSE_MAX_LENGTH)]
    language: ResponseLanguage
    intent_id: int


class IntentOut(OutputSchema):
    id: int
    tag: Annotated[str, Field(max_length=INTENT_TAG_MAX_LENGTH)]
    type: IntentType
    handled: bool
    patterns: list[PatternOut]
    responses: list[ResponseOut]


class UnknownMessageOut(OutputSchema):
    id: int
    message: Annotated[str, Field(max_length=CHAT_MESSAGE_MAX_LENGTH)]
    confidence: float
    occurrences: int
    created_at: datetime
    last_seen_at: datetime


class ConfusedPairOut(OutputSchema):
    expected: str
    predicted: str
    count: int


class TrainingOut(OutputSchema):
    id: int
    model: Annotated[str, Field(max_length=TRAINING_MODEL_MAX_LENGTH)]
    success: bool
    samples: int | None
    intents: int | None
    accuracy: float | None
    confused_pairs: list[ConfusedPairOut] | None
    created_at: datetime


class ReplyLineOut(OutputSchema):
    key: str | None
    params: dict[str, MessageParam]
    text: str


class ChatActionOut(OutputSchema):
    type: ChatActionType
    book_id: int
    status: ReadingStatus | None


class ChatBookOut(OutputSchema):
    id: int
    title: str
    author_name: str | None
    average_rating: float | None
    cover_url: str | None
    reason: ReplyLineOut | None
    actions: list[ChatActionOut]


class ChatReplyOut(OutputSchema):
    conversation_id: int
    message_id: int
    lines: list[ReplyLineOut]
    books: list[ChatBookOut]
    suggestions: list[ReplyLineOut]
    intent: str | None
    confidence: float
    fallback: bool


class ChatHistoryMessageOut(OutputSchema):
    id: int
    role: ChatRole
    text: str
    lines: list[ReplyLineOut]
    books: list[ChatBookOut]
    intent: str | None
    feedback: ChatFeedback | None
    created_at: datetime


class ConversationOut(OutputSchema):
    id: int
    messages: list[ChatHistoryMessageOut]


class IntentScoreOut(OutputSchema):
    intent_id: int | None
    tag: str
    score: float


class ChatTestOut(OutputSchema):
    masked: str
    intent: str | None
    confidence: float
    margin: float
    min_similarity: float
    min_margin: float
    fallback: bool
    candidates: list[IntentScoreOut]


class FeedbackOut(OutputSchema):
    message_id: int
    feedback: ChatFeedback | None


class FeedbackReviewOut(OutputSchema):
    id: int
    question: str | None
    lines: list[ReplyLineOut]
    intent: str | None
    confidence: float | None
    created_at: datetime


class AnalyticsWeekOut(OutputSchema):
    week_start: date
    messages: int
    fallbacks: int
    unknowns: int
    thumbs_up: int
    thumbs_down: int


class IntentCountOut(OutputSchema):
    tag: str
    count: int


class ChatbotAnalyticsOut(OutputSchema):
    weeks: list[AnalyticsWeekOut]
    intents: list[IntentCountOut]


class PatternOverlapOut(OutputSchema):
    pattern_id: int
    other_pattern_id: int
    other_pattern: str
    other_intent_id: int
    other_tag: str
    similarity: float


class TrainingStartedEvent(OutputSchema):
    type: Literal["started"] = "started"
    model: str
    intents: int
    samples: int


class TrainingProgressEvent(OutputSchema):
    type: Literal["progress"] = "progress"
    stage: Literal["encode", "evaluate"]
    done: int
    total: int


class TrainingDoneEvent(OutputSchema):
    type: Literal["done"] = "done"
    training: TrainingOut


class TrainingErrorEvent(OutputSchema):
    type: Literal["error"] = "error"
    error: ApiErrorItem


TrainingEvent = Annotated[
    TrainingStartedEvent | TrainingProgressEvent | TrainingDoneEvent | TrainingErrorEvent,
    Field(discriminator="type"),
]


SeedPattern = name_field(PATTERN_MAX_LENGTH)
SeedResponse = Annotated[str, Field(min_length=1, max_length=RESPONSE_MAX_LENGTH)]


class SeedResponses(InputSchema):
    en: list[SeedResponse] = Field(default_factory=list, max_length=IMPORT_MAX_RESPONSES)
    ro: list[SeedResponse] = Field(default_factory=list, max_length=IMPORT_MAX_RESPONSES)


class SeedIntent(InputSchema):
    tag: IntentTag
    type: IntentType
    patterns: list[SeedPattern] = Field(max_length=IMPORT_MAX_PATTERNS)
    responses: SeedResponses = Field(default_factory=SeedResponses)


class IntentImportIn(InputSchema):
    intents: list[SeedIntent] = Field(min_length=1, max_length=IMPORT_MAX_INTENTS)
    replace: bool = False


class ExportResponsesOut(OutputSchema):
    en: list[str]
    ro: list[str]


class IntentExportOut(OutputSchema):
    tag: str
    type: IntentType
    patterns: list[str]
    responses: ExportResponsesOut


class SeedSummary(OutputSchema):
    intents: int
    patterns: int
    responses: int
