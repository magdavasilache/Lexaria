from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, String, func, select, text
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from server.database.database import Base
from server.database.models.reading_session import ReadingSession, page_range_check, percent_range_check


class ReadingState(StrEnum):
    ACTIVE = "active"
    FINISHED = "finished"
    ABANDONED = "abandoned"


READING_STATE_MAX_LENGTH = 20

_ACTIVE = f"state = '{ReadingState.ACTIVE.value}'"


class Reading(Base):
    __tablename__ = "readings"
    __table_args__ = (
        CheckConstraint(
            f"state IN ({', '.join(repr(state.value) for state in ReadingState)})", name="ck_readings_state_valid"
        ),
        CheckConstraint("finished_at IS NULL OR finished_at >= started_at", name="ck_readings_finish_after_start"),
        CheckConstraint(
            f"(state = '{ReadingState.ACTIVE.value}') = (finished_at IS NULL)", name="ck_readings_finished_when_closed"
        ),
        page_range_check("current_page", "readings"),
        percent_range_check("current_percent", "readings"),
        Index(
            "uq_readings_user_book_active",
            "user_id",
            "book_id",
            unique=True,
            postgresql_where=text(_ACTIVE),
            sqlite_where=text(_ACTIVE),
        ),
        Index("ix_readings_user_id_book_id", "user_id", "book_id"),
        Index("ix_readings_edition_id", "edition_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    edition_id: Mapped[int | None] = mapped_column(ForeignKey("editions.id", ondelete="SET NULL"))
    state: Mapped[str] = mapped_column(
        String(READING_STATE_MAX_LENGTH),
        nullable=False,
        default=ReadingState.ACTIVE.value,
        server_default=ReadingState.ACTIVE.value,
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    current_page: Mapped[int | None] = mapped_column(Integer)
    current_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    total_seconds: Mapped[int] = column_property(
        select(func.coalesce(func.sum(ReadingSession.duration_seconds), 0))
        .where(ReadingSession.reading_id == id)
        .correlate_except(ReadingSession)
        .scalar_subquery()
    )
    sessions_count: Mapped[int] = column_property(
        select(func.count())
        .where(ReadingSession.reading_id == id, ReadingSession.ended_at.is_not(None))
        .correlate_except(ReadingSession)
        .scalar_subquery()
    )

    user = relationship("User", back_populates="readings")
    book = relationship("Book", back_populates="readings")
    edition = relationship("Edition")
    sessions = relationship(
        ReadingSession,
        back_populates="reading",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by=(ReadingSession.started_at, ReadingSession.id),
    )
    events = relationship(
        "ReadingEvent",
        back_populates="reading",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="[ReadingEvent.occurred_at, ReadingEvent.id]",
    )

    @property
    def progress_percent(self) -> float | None:
        if self.current_percent is not None:
            return float(self.current_percent)
        if self.current_page is not None and self.edition is not None and self.edition.pages:
            return round(min(100.0, self.current_page * 100 / self.edition.pages), 2)
        return None
