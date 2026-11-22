from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base

CHALLENGE_YEAR_MIN = 2000
CHALLENGE_YEAR_MAX = 2100
BOOKS_TARGET_MAX = 1000
PAGES_TARGET_MAX = 500_000
HOURS_TARGET_MAX = 8784


def _target_check(column: str, maximum: int) -> CheckConstraint:
    return CheckConstraint(f"{column} >= 1 AND {column} <= {maximum}", name=f"ck_reading_challenges_{column}_range")


class ReadingChallenge(Base):
    __tablename__ = "reading_challenges"
    __table_args__ = (
        UniqueConstraint("user_id", "year", name="uq_reading_challenges_user_year"),
        CheckConstraint(
            f"year >= {CHALLENGE_YEAR_MIN} AND year <= {CHALLENGE_YEAR_MAX}", name="ck_reading_challenges_year_range"
        ),
        _target_check("books_target", BOOKS_TARGET_MAX),
        _target_check("pages_target", PAGES_TARGET_MAX),
        _target_check("hours_target", HOURS_TARGET_MAX),
        CheckConstraint(
            "books_target IS NOT NULL OR pages_target IS NOT NULL OR hours_target IS NOT NULL",
            name="ck_reading_challenges_has_target",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    books_target: Mapped[int | None] = mapped_column(Integer)
    pages_target: Mapped[int | None] = mapped_column(Integer)
    hours_target: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="challenges")
