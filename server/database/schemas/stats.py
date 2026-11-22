from datetime import date, datetime
from enum import StrEnum
from typing import Annotated

from pydantic import Field, model_validator

from server.core.message_keys import MessageKey, key_error
from server.database.models.edition import EditionFormat
from server.database.models.reader_signal import Mood, Pace
from server.database.models.reading_challenge import (
    BOOKS_TARGET_MAX,
    CHALLENGE_YEAR_MAX,
    CHALLENGE_YEAR_MIN,
    HOURS_TARGET_MAX,
    PAGES_TARGET_MAX,
)
from server.database.schemas.base import InputSchema, OutputSchema
from server.database.schemas.reading import TimeZone

ChallengeYear = Annotated[int, Field(ge=CHALLENGE_YEAR_MIN, le=CHALLENGE_YEAR_MAX)]


class ChallengeMetric(StrEnum):
    BOOKS = "books"
    PAGES = "pages"
    HOURS = "hours"


class PaceStatus(StrEnum):
    AHEAD = "ahead"
    ON_TRACK = "on_track"
    BEHIND = "behind"
    COMPLETED = "completed"
    MISSED = "missed"


class ChallengeSet(InputSchema):
    books_target: Annotated[int | None, Field(ge=1, le=BOOKS_TARGET_MAX)] = None
    pages_target: Annotated[int | None, Field(ge=1, le=PAGES_TARGET_MAX)] = None
    hours_target: Annotated[int | None, Field(ge=1, le=HOURS_TARGET_MAX)] = None

    @model_validator(mode="after")
    def at_least_one_target(self) -> "ChallengeSet":
        if self.books_target is None and self.pages_target is None and self.hours_target is None:
            raise key_error(MessageKey.CHALLENGE_EMPTY)
        return self


class ChallengeOut(OutputSchema):
    id: int
    year: int
    books_target: int | None
    pages_target: int | None
    hours_target: int | None
    created_at: datetime
    updated_at: datetime


class StatsQuery(InputSchema):
    year: ChallengeYear | None = None
    tz: TimeZone = "UTC"


class TargetProgress(OutputSchema):
    metric: ChallengeMetric
    target: int
    value: float
    expected: float
    status: PaceStatus


class ChallengeProgress(OutputSchema):
    challenge: ChallengeOut
    targets: list[TargetProgress]


class StatsTotals(OutputSchema):
    books: int
    pages: int
    minutes: int
    sessions: int
    reading_days: int
    average_rating: float | None


class MonthBucket(OutputSchema):
    month: Annotated[int, Field(ge=1, le=12)]
    books: int
    pages: int
    minutes: int


class GenreSlice(OutputSchema):
    genre_id: int
    name: str
    books: int


class FormatSlice(OutputSchema):
    format: EditionFormat | None
    books: int


class MoodSlice(OutputSchema):
    mood: Mood
    books: int


class PaceSlice(OutputSchema):
    pace: Pace | None
    books: int


class LengthBucket(StrEnum):
    SHORT = "short"
    MEDIUM = "medium"
    LONG = "long"
    EPIC = "epic"
    UNKNOWN = "unknown"


class LengthSlice(OutputSchema):
    length: LengthBucket
    min_pages: int | None
    max_pages: int | None
    books: int


class DayActivity(OutputSchema):
    day: date
    minutes: int


class StreakOut(OutputSchema):
    current: int
    longest: int
    last_days: list[DayActivity]


class StatsOut(OutputSchema):
    year: int
    today: date
    available_years: list[int]
    totals: StatsTotals
    all_time_books: int
    months: list[MonthBucket]
    genres: list[GenreSlice]
    formats: list[FormatSlice]
    moods: list[MoodSlice]
    paces: list[PaceSlice]
    lengths: list[LengthSlice]
    streak: StreakOut
    challenge: ChallengeProgress | None
