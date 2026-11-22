from datetime import datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import JSON, BigInteger, CheckConstraint, DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from server.database.database import Base
from server.database.models.user import USERNAME_MAX_LENGTH

AUDIT_ACTION_MAX_LENGTH = 64
AUDIT_KEY_MAX_LENGTH = 100
AUDIT_OUTCOME_MAX_LENGTH = 10
HTTP_METHOD_MAX_LENGTH = 10
AUDIT_PATH_MAX_LENGTH = 500
ERROR_CODE_MAX_LENGTH = 50
ENTITY_TYPE_MAX_LENGTH = 50
REQUEST_ID_MAX_LENGTH = 64
IP_ADDRESS_MAX_LENGTH = 45
USER_AGENT_MAX_LENGTH = 255


class AuditAction(StrEnum):
    USER_REGISTER = "user.register"
    USER_LOGIN = "user.login"
    TOKEN_REFRESH = "user.tokenRefresh"
    ACCESS_DENIED = "security.accessDenied"
    USER_LOGOUT = "user.logout"
    USER_LOGOUT_ALL = "user.logoutAll"
    SESSION_REUSE_DETECTED = "security.sessionReuse"
    BOOK_CREATE = "book.create"
    BOOK_UPDATE = "book.update"
    BOOK_DELETE = "book.delete"
    GOODREADS_IMPORT = "import.goodreads"
    BOOK_IMPORT = "import.isbn"
    READER_VOTE_SET = "book.readerVote"
    READER_VOTE_REMOVE = "book.readerVoteRemove"
    CONTENT_WARNINGS_SET = "book.contentWarnings"
    CONTENT_WARNINGS_REMOVE = "book.contentWarningsRemove"
    REVIEW_CREATE = "review.create"
    REVIEW_UPDATE = "review.update"
    REVIEW_DELETE = "review.delete"
    COMMENT_CREATE = "comment.create"
    COMMENT_UPDATE = "comment.update"
    COMMENT_DELETE = "comment.delete"
    REVIEW_LIKE = "review.like"
    REVIEW_UNLIKE = "review.unlike"
    COMMENT_LIKE = "comment.like"
    COMMENT_UNLIKE = "comment.unlike"
    READING_STATUS_SET = "readingStatus.set"
    READING_STATUS_REMOVE = "readingStatus.remove"
    EDITION_CREATE = "edition.create"
    EDITION_UPDATE = "edition.update"
    EDITION_DELETE = "edition.delete"
    READING_SESSION_START = "readingSession.start"
    READING_SESSION_PAUSE = "readingSession.pause"
    READING_SESSION_RESUME = "readingSession.resume"
    READING_SESSION_END = "readingSession.end"
    READING_SESSION_DISCARD = "readingSession.discard"
    READING_UPDATE = "reading.update"
    READING_DELETE = "reading.delete"
    READING_NOTE_CREATE = "readingNote.create"
    READING_NOTE_UPDATE = "readingNote.update"
    READING_NOTE_DELETE = "readingNote.delete"
    READING_GOAL_SET = "readingGoal.set"
    CHALLENGE_SET = "challenge.set"
    CHALLENGE_DELETE = "challenge.delete"
    AUTHOR_CREATE = "author.create"
    AUTHOR_UPDATE = "author.update"
    AUTHOR_DELETE = "author.delete"
    LANGUAGE_CREATE = "language.create"
    LANGUAGE_UPDATE = "language.update"
    LANGUAGE_DELETE = "language.delete"
    COUNTRY_CREATE = "country.create"
    COUNTRY_UPDATE = "country.update"
    COUNTRY_DELETE = "country.delete"
    GENRE_CREATE = "genre.create"
    GENRE_UPDATE = "genre.update"
    GENRE_DELETE = "genre.delete"
    AWARD_CREATE = "award.create"
    AWARD_UPDATE = "award.update"
    AWARD_DELETE = "award.delete"
    CHATBOT_INTENT_CREATE = "chatbot.intentCreate"
    CHATBOT_INTENT_UPDATE = "chatbot.intentUpdate"
    CHATBOT_INTENT_DELETE = "chatbot.intentDelete"
    CHATBOT_PATTERN_CREATE = "chatbot.patternCreate"
    CHATBOT_PATTERN_UPDATE = "chatbot.patternUpdate"
    CHATBOT_PATTERN_DELETE = "chatbot.patternDelete"
    CHATBOT_RESPONSE_CREATE = "chatbot.responseCreate"
    CHATBOT_RESPONSE_UPDATE = "chatbot.responseUpdate"
    CHATBOT_RESPONSE_DELETE = "chatbot.responseDelete"
    CHATBOT_UNKNOWN_DELETE = "chatbot.unknownDelete"
    CHATBOT_UNKNOWN_PROMOTE = "chatbot.unknownPromote"
    CHATBOT_TRAIN = "chatbot.train"
    CHATBOT_SEED = "chatbot.seed"
    CHATBOT_CONVERSATION_DELETE = "chatbot.conversationDelete"
    CHATBOT_FEEDBACK = "chatbot.feedback"
    CHATBOT_FEEDBACK_PROMOTE = "chatbot.feedbackPromote"
    CHATBOT_FEEDBACK_DISMISS = "chatbot.feedbackDismiss"
    CHATBOT_IMPORT = "chatbot.import"
    USER_AVATAR_UPDATE = "user.avatarUpdate"
    USER_AVATAR_REMOVE = "user.avatarRemove"
    USER_BAN = "user.ban"
    USER_UNBAN = "user.unban"


class AuditOutcome(StrEnum):
    SUCCESS = "success"
    FAILURE = "failure"


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        CheckConstraint(
            f"outcome IN ({', '.join(repr(outcome.value) for outcome in AuditOutcome)})",
            name="ck_audit_logs_outcome_valid",
        ),
        Index("ix_audit_logs_created_at", "created_at"),
        Index("ix_audit_logs_user_id_created_at", "user_id", "created_at"),
        Index("ix_audit_logs_action_created_at", "action", "created_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    username: Mapped[str | None] = mapped_column(String(USERNAME_MAX_LENGTH))
    method: Mapped[str | None] = mapped_column(String(HTTP_METHOD_MAX_LENGTH))
    path: Mapped[str | None] = mapped_column(String(AUDIT_PATH_MAX_LENGTH))
    action: Mapped[str] = mapped_column(String(AUDIT_ACTION_MAX_LENGTH), nullable=False)
    description_key: Mapped[str] = mapped_column(String(AUDIT_KEY_MAX_LENGTH), nullable=False)
    params: Mapped[dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"), nullable=False, default=dict, server_default="{}"
    )
    outcome: Mapped[str] = mapped_column(String(AUDIT_OUTCOME_MAX_LENGTH), nullable=False)
    error_code: Mapped[str | None] = mapped_column(String(ERROR_CODE_MAX_LENGTH))
    entity_type: Mapped[str | None] = mapped_column(String(ENTITY_TYPE_MAX_LENGTH))
    entity_id: Mapped[int | None] = mapped_column(Integer)
    request_id: Mapped[str | None] = mapped_column(String(REQUEST_ID_MAX_LENGTH))
    ip_address: Mapped[str | None] = mapped_column(String(IP_ADDRESS_MAX_LENGTH))
    user_agent: Mapped[str | None] = mapped_column(String(USER_AGENT_MAX_LENGTH))
