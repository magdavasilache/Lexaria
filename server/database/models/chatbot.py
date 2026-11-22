from datetime import datetime
from enum import StrEnum

from sqlalchemy import JSON, Boolean, CheckConstraint, DateTime, Float, ForeignKey, Index, Integer, String, false, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base

INTENT_TAG_MAX_LENGTH = 50
INTENT_TAG_PATTERN = r"^[a-z][a-z0-9_]*$"
INTENT_TYPE_MAX_LENGTH = 20
PATTERN_MAX_LENGTH = 200
RESPONSE_MAX_LENGTH = 1000
CHAT_MESSAGE_MAX_LENGTH = 500
STORED_MESSAGE_MAX_LENGTH = 2000
CHAT_ROLE_MAX_LENGTH = 10
RESPONSE_LANGUAGE_MAX_LENGTH = 5
TRAINING_MODEL_MAX_LENGTH = 150
FEEDBACK_MAX_LENGTH = 10
IMPORT_MAX_INTENTS = 200
IMPORT_MAX_PATTERNS = 500
IMPORT_MAX_RESPONSES = 100


class IntentType(StrEnum):
    INFORMATIONAL = "informational"
    ACTION = "action"
    FALLBACK = "fallback"


class ResponseLanguage(StrEnum):
    EN = "en"
    RO = "ro"


DEFAULT_RESPONSE_LANGUAGE = ResponseLanguage.EN


class ChatRole(StrEnum):
    USER = "user"
    BOT = "bot"


class ChatFeedback(StrEnum):
    UP = "up"
    DOWN = "down"


def _one_of(column: str, values: type[StrEnum]) -> str:
    return f"{column} IN ({', '.join(repr(value.value) for value in values)})"


def _json():
    return JSON().with_variant(JSONB, "postgresql")


def _probability(column: str) -> str:
    return f"{column} IS NULL OR ({column} >= 0 AND {column} <= 1)"


class ChatbotIntent(Base):
    __tablename__ = "chatbot_intents"
    __table_args__ = (
        CheckConstraint(_one_of("type", IntentType), name="ck_chatbot_intents_type_valid"),
        CheckConstraint("tag = lower(tag) AND length(tag) > 0", name="ck_chatbot_intents_tag_lowercase"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tag: Mapped[str] = mapped_column(String(INTENT_TAG_MAX_LENGTH), nullable=False, unique=True)
    type: Mapped[str] = mapped_column(String(INTENT_TYPE_MAX_LENGTH), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    patterns = relationship(
        "ChatbotPattern",
        back_populates="intent",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ChatbotPattern.id",
    )
    responses = relationship(
        "ChatbotResponse",
        back_populates="intent",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ChatbotResponse.id",
    )


class ChatbotPattern(Base):
    __tablename__ = "chatbot_patterns"
    __table_args__ = (
        CheckConstraint("length(pattern) > 0", name="ck_chatbot_patterns_not_blank"),
        Index("ix_chatbot_patterns_intent_id", "intent_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pattern: Mapped[str] = mapped_column(String(PATTERN_MAX_LENGTH), nullable=False)
    intent_id: Mapped[int] = mapped_column(ForeignKey("chatbot_intents.id", ondelete="CASCADE"), nullable=False)

    intent = relationship("ChatbotIntent", back_populates="patterns")


Index("uq_chatbot_patterns_pattern_lower", func.lower(ChatbotPattern.pattern), unique=True)


class ChatbotResponse(Base):
    __tablename__ = "chatbot_responses"
    __table_args__ = (
        CheckConstraint("length(response) > 0", name="ck_chatbot_responses_not_blank"),
        CheckConstraint(_one_of("language", ResponseLanguage), name="ck_chatbot_responses_language_valid"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    response: Mapped[str] = mapped_column(String(RESPONSE_MAX_LENGTH), nullable=False)
    language: Mapped[str] = mapped_column(
        String(RESPONSE_LANGUAGE_MAX_LENGTH),
        nullable=False,
        default=DEFAULT_RESPONSE_LANGUAGE.value,
        server_default=DEFAULT_RESPONSE_LANGUAGE.value,
    )
    intent_id: Mapped[int] = mapped_column(ForeignKey("chatbot_intents.id", ondelete="CASCADE"), nullable=False)

    intent = relationship("ChatbotIntent", back_populates="responses")


Index(
    "uq_chatbot_responses_intent_language_response_lower",
    ChatbotResponse.intent_id,
    ChatbotResponse.language,
    func.lower(ChatbotResponse.response),
    unique=True,
)


class ChatbotConversation(Base):
    __tablename__ = "chatbot_conversations"
    __table_args__ = (Index("ix_chatbot_conversations_user_id_created_at", "user_id", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    state: Mapped[dict | None] = mapped_column(_json())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    messages = relationship(
        "ChatbotMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class ChatbotMessage(Base):
    __tablename__ = "chatbot_messages"
    __table_args__ = (
        CheckConstraint(_one_of("role", ChatRole), name="ck_chatbot_messages_role_valid"),
        CheckConstraint(_probability("confidence"), name="ck_chatbot_messages_confidence_range"),
        CheckConstraint(
            f"feedback IS NULL OR ({_one_of('feedback', ChatFeedback)} AND role = '{ChatRole.BOT.value}')",
            name="ck_chatbot_messages_feedback_valid",
        ),
        CheckConstraint(f"NOT fallback OR role = '{ChatRole.BOT.value}'", name="ck_chatbot_messages_fallback_bot"),
        Index("ix_chatbot_messages_conversation_id_created_at", "conversation_id", "created_at"),
        Index("ix_chatbot_messages_created_at", "created_at"),
        Index("ix_chatbot_messages_feedback", "feedback"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("chatbot_conversations.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(CHAT_ROLE_MAX_LENGTH), nullable=False)
    message: Mapped[str] = mapped_column(String(STORED_MESSAGE_MAX_LENGTH), nullable=False)
    intent_id: Mapped[int | None] = mapped_column(ForeignKey("chatbot_intents.id", ondelete="SET NULL"))
    confidence: Mapped[float | None] = mapped_column(Float)
    fallback: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false())
    lines: Mapped[list[dict] | None] = mapped_column(_json())
    books: Mapped[list[dict] | None] = mapped_column(_json())
    feedback: Mapped[str | None] = mapped_column(String(FEEDBACK_MAX_LENGTH))
    feedback_reviewed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    conversation = relationship("ChatbotConversation", back_populates="messages")
    intent = relationship("ChatbotIntent")


class ChatbotUnknownMessage(Base):
    __tablename__ = "chatbot_unknown_messages"
    __table_args__ = (
        CheckConstraint(_probability("confidence"), name="ck_chatbot_unknown_messages_confidence_range"),
        CheckConstraint("occurrences >= 1", name="ck_chatbot_unknown_messages_occurrences_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message: Mapped[str] = mapped_column(String(CHAT_MESSAGE_MAX_LENGTH), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    occurrences: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


Index("uq_chatbot_unknown_messages_message_lower", func.lower(ChatbotUnknownMessage.message), unique=True)


class ChatbotTraining(Base):
    __tablename__ = "chatbot_trainings"
    __table_args__ = (
        CheckConstraint(_probability("accuracy"), name="ck_chatbot_trainings_accuracy_range"),
        Index("ix_chatbot_trainings_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    model: Mapped[str] = mapped_column(String(TRAINING_MODEL_MAX_LENGTH), nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    samples: Mapped[int | None] = mapped_column(Integer)
    intents: Mapped[int | None] = mapped_column(Integer)
    accuracy: Mapped[float | None] = mapped_column(Float)
    confused_pairs: Mapped[list[dict] | None] = mapped_column(_json())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
