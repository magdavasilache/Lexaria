from datetime import datetime
from enum import StrEnum

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base


class Mood(StrEnum):
    ADVENTUROUS = "adventurous"
    CHALLENGING = "challenging"
    DARK = "dark"
    EMOTIONAL = "emotional"
    FUNNY = "funny"
    HOPEFUL = "hopeful"
    INFORMATIVE = "informative"
    INSPIRING = "inspiring"
    LIGHTHEARTED = "lighthearted"
    MYSTERIOUS = "mysterious"
    REFLECTIVE = "reflective"
    RELAXING = "relaxing"
    SAD = "sad"
    TENSE = "tense"


class Pace(StrEnum):
    SLOW = "slow"
    MEDIUM = "medium"
    FAST = "fast"


class SignalKind(StrEnum):
    MOOD = "mood"
    PACE = "pace"


MOOD_MAX_LENGTH = 20
PACE_MAX_LENGTH = 10
SIGNAL_KIND_MAX_LENGTH = 10
SIGNAL_VALUE_MAX_LENGTH = MOOD_MAX_LENGTH
MOODS_PER_VOTE_MAX = 3
MOOD_MIN_SHARE = 0.3
TOP_MOODS_SHOWN = 3

TAG_MOODS: dict[str, Mood] = {
    "dark": Mood.DARK,
    "grimdark": Mood.DARK,
    "horror": Mood.DARK,
    "hopeful": Mood.HOPEFUL,
    "beautiful-ending": Mood.HOPEFUL,
    "melancholic": Mood.SAD,
    "grief": Mood.SAD,
    "funny": Mood.FUNNY,
    "tense": Mood.TENSE,
    "thriller": Mood.TENSE,
    "psychological": Mood.TENSE,
    "mystery": Mood.MYSTERIOUS,
    "twisty": Mood.MYSTERIOUS,
    "gothic": Mood.MYSTERIOUS,
    "emotional": Mood.EMOTIONAL,
    "philosophical": Mood.REFLECTIVE,
    "social-commentary": Mood.REFLECTIVE,
    "cozy": Mood.RELAXING,
    "comfort-read": Mood.LIGHTHEARTED,
    "dense": Mood.CHALLENGING,
    "heist": Mood.ADVENTUROUS,
    "pirates": Mood.ADVENTUROUS,
    "survival": Mood.ADVENTUROUS,
}
TAG_PACES: dict[str, Pace] = {
    "slow-burn": Pace.SLOW,
    "fast-paced": Pace.FAST,
    "addictive": Pace.FAST,
}


def _values_sql(enum: type[StrEnum]) -> str:
    return ", ".join(repr(member.value) for member in enum)


class BookMoodVote(Base):
    __tablename__ = "book_mood_votes"
    __table_args__ = (
        CheckConstraint(f"mood IN ({_values_sql(Mood)})", name="ck_book_mood_votes_mood_valid"),
        Index("ix_book_mood_votes_book_id", "book_id"),
    )

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    mood: Mapped[str] = mapped_column(String(MOOD_MAX_LENGTH), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class BookPaceVote(Base):
    __tablename__ = "book_pace_votes"
    __table_args__ = (
        CheckConstraint(f"pace IN ({_values_sql(Pace)})", name="ck_book_pace_votes_pace_valid"),
        Index("ix_book_pace_votes_book_id", "book_id"),
    )

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    pace: Mapped[str] = mapped_column(String(PACE_MAX_LENGTH), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class BookSignal(Base):
    __tablename__ = "book_signals"
    __table_args__ = (
        CheckConstraint(f"kind IN ({_values_sql(SignalKind)})", name="ck_book_signals_kind_valid"),
        CheckConstraint(
            f"(kind = 'mood' AND value IN ({_values_sql(Mood)})) OR (kind = 'pace' AND value IN ({_values_sql(Pace)}))",
            name="ck_book_signals_value_valid",
        ),
        CheckConstraint("votes > 0", name="ck_book_signals_votes_positive"),
        Index("ix_book_signals_kind_value", "kind", "value", "book_id"),
    )

    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    kind: Mapped[str] = mapped_column(String(SIGNAL_KIND_MAX_LENGTH), primary_key=True)
    value: Mapped[str] = mapped_column(String(SIGNAL_VALUE_MAX_LENGTH), primary_key=True)
    votes: Mapped[int] = mapped_column(Integer, nullable=False)

    book = relationship("Book", back_populates="signals")
