from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base
from server.database.models.reading_session import page_range_check, percent_range_check
from server.database.models.user_book_status import READING_STATUS_MAX_LENGTH, ReadingStatus


class ReadingEventType(StrEnum):
    SHELVED = "shelved"
    STARTED = "started"
    NOTE = "note"
    FINISHED = "finished"
    ABANDONED = "abandoned"
    EDITION_CHANGED = "edition_changed"


READING_EVENT_TYPE_MAX_LENGTH = 20
NOTE_MAX_LENGTH = 5000


class ReadingEvent(Base):
    __tablename__ = "reading_events"
    __table_args__ = (
        CheckConstraint(
            f"type IN ({', '.join(repr(event_type.value) for event_type in ReadingEventType)})",
            name="ck_reading_events_type_valid",
        ),
        CheckConstraint(
            f"status IN ({', '.join(repr(status.value) for status in ReadingStatus)})",
            name="ck_reading_events_status_valid",
        ),
        CheckConstraint(
            f"(type = '{ReadingEventType.SHELVED.value}') = (status IS NOT NULL)",
            name="ck_reading_events_status_when_shelved",
        ),
        CheckConstraint(
            f"(type = '{ReadingEventType.NOTE.value}') = (content IS NOT NULL)",
            name="ck_reading_events_content_when_note",
        ),
        CheckConstraint(
            f"type = '{ReadingEventType.SHELVED.value}' OR reading_id IS NOT NULL",
            name="ck_reading_events_reading_required",
        ),
        page_range_check("page", "reading_events"),
        percent_range_check("percent", "reading_events"),
        Index("ix_reading_events_user_id_book_id_occurred_at", "user_id", "book_id", "occurred_at"),
        Index("ix_reading_events_reading_id", "reading_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    reading_id: Mapped[int | None] = mapped_column(ForeignKey("readings.id", ondelete="CASCADE"))
    session_id: Mapped[int | None] = mapped_column(ForeignKey("reading_sessions.id", ondelete="SET NULL"))
    type: Mapped[str] = mapped_column(String(READING_EVENT_TYPE_MAX_LENGTH), nullable=False)
    status: Mapped[str | None] = mapped_column(String(READING_STATUS_MAX_LENGTH))
    content: Mapped[str | None] = mapped_column(String(NOTE_MAX_LENGTH))
    page: Mapped[int | None] = mapped_column(Integer)
    percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    reading = relationship("Reading", back_populates="events")
    session = relationship("ReadingSession")
