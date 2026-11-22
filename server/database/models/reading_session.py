from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base
from server.database.models.edition import EDITION_PAGES_MAX
from server.database.models.user_session import as_utc

PERCENT_MIN = Decimal("0")
PERCENT_MAX = Decimal("100")
MAX_SESSION_HOURS = 12

_ACTIVE = "ended_at IS NULL"


def percent_range_check(column: str, table: str) -> CheckConstraint:
    return CheckConstraint(
        f"{column} >= {PERCENT_MIN} AND {column} <= {PERCENT_MAX}", name=f"ck_{table}_{column}_range"
    )


def page_range_check(column: str, table: str) -> CheckConstraint:
    return CheckConstraint(f"{column} >= 0 AND {column} <= {EDITION_PAGES_MAX}", name=f"ck_{table}_{column}_range")


class ReadingSession(Base):
    __tablename__ = "reading_sessions"
    __table_args__ = (
        CheckConstraint("ended_at IS NULL OR ended_at >= started_at", name="ck_reading_sessions_end_after_start"),
        CheckConstraint("paused_at IS NULL OR paused_at >= started_at", name="ck_reading_sessions_pause_after_start"),
        CheckConstraint("paused_at IS NULL OR ended_at IS NULL", name="ck_reading_sessions_ended_not_paused"),
        CheckConstraint("paused_seconds >= 0", name="ck_reading_sessions_paused_seconds"),
        CheckConstraint(
            "(ended_at IS NULL) = (duration_seconds IS NULL)", name="ck_reading_sessions_duration_when_ended"
        ),
        CheckConstraint("duration_seconds >= 0", name="ck_reading_sessions_duration_positive"),
        page_range_check("start_page", "reading_sessions"),
        page_range_check("end_page", "reading_sessions"),
        percent_range_check("start_percent", "reading_sessions"),
        percent_range_check("end_percent", "reading_sessions"),
        CheckConstraint(
            "start_page IS NULL OR end_page IS NULL OR end_page >= start_page",
            name="ck_reading_sessions_page_order",
        ),
        CheckConstraint(
            "start_percent IS NULL OR end_percent IS NULL OR end_percent >= start_percent",
            name="ck_reading_sessions_percent_order",
        ),
        Index(
            "uq_reading_sessions_user_active",
            "user_id",
            unique=True,
            postgresql_where=text(_ACTIVE),
            sqlite_where=text(_ACTIVE),
        ),
        Index("ix_reading_sessions_reading_id", "reading_id"),
        Index("ix_reading_sessions_user_id_started_at", "user_id", "started_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reading_id: Mapped[int] = mapped_column(ForeignKey("readings.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    paused_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    paused_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    start_page: Mapped[int | None] = mapped_column(Integer)
    end_page: Mapped[int | None] = mapped_column(Integer)
    start_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    end_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))

    reading = relationship("Reading", back_populates="sessions")
    user = relationship("User")

    @property
    def is_active(self) -> bool:
        return self.ended_at is None

    @property
    def is_paused(self) -> bool:
        return self.paused_at is not None

    def seconds_until(self, moment: datetime) -> int:
        return max(0, int((as_utc(moment) - as_utc(self.started_at)).total_seconds()) - self.paused_seconds)

    @property
    def elapsed_seconds(self) -> int:
        if self.duration_seconds is not None:
            return self.duration_seconds
        return self.seconds_until(self.paused_at or datetime.now(timezone.utc))
