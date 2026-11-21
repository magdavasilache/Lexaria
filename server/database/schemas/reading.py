from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import Field, field_validator, model_validator

from server.core.message_keys import MessageKey, key_error
from server.database.models.edition import EDITION_PAGES_MAX
from server.database.models.reading import ReadingState
from server.database.models.reading_event import NOTE_MAX_LENGTH, ReadingEventType
from server.database.models.reading_session import PERCENT_MAX, PERCENT_MIN
from server.database.models.user import READING_GOAL_MINUTES_MAX, READING_GOAL_MINUTES_MIN
from server.database.models.user_book_status import ReadingStatus
from server.database.schemas.base import InputSchema, OutputSchema
from server.database.schemas.book import Id
from server.database.schemas.edition import EditionOut

CLOCK_SKEW = timedelta(minutes=1)

Page = Annotated[int, Field(ge=0, le=EDITION_PAGES_MAX)]
Percent = Annotated[Decimal, Field(ge=PERCENT_MIN, le=PERCENT_MAX, max_digits=5, decimal_places=2)]
NoteContent = Annotated[str, Field(min_length=1, max_length=NOTE_MAX_LENGTH)]


def _not_in_future(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    aware = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if aware > datetime.now(timezone.utc) + CLOCK_SKEW:
        raise key_error(MessageKey.READING_FUTURE_TIME)
    return aware


def _at_most_one(page: int | None, percent: Decimal | None) -> None:
    if page is not None and percent is not None:
        raise key_error(MessageKey.PROGRESS_ONE_OF)


class SessionStart(InputSchema):
    edition_id: Id | None = None
    start_page: Page | None = None
    start_percent: Percent | None = None

    @model_validator(mode="after")
    def one_progress_kind(self) -> "SessionStart":
        _at_most_one(self.start_page, self.start_percent)
        return self


class SessionEnd(InputSchema):
    end_page: Page | None = None
    end_percent: Percent | None = None
    ended_at: datetime | None = None
    note: Annotated[str | None, Field(max_length=NOTE_MAX_LENGTH)] = None
    mark_finished: bool = False

    @field_validator("ended_at")
    @classmethod
    def ended_at_not_in_future(cls, value: datetime | None) -> datetime | None:
        return _not_in_future(value)

    @field_validator("note")
    @classmethod
    def empty_note_is_none(cls, value: str | None) -> str | None:
        return value or None

    @model_validator(mode="after")
    def one_progress_kind(self) -> "SessionEnd":
        _at_most_one(self.end_page, self.end_percent)
        return self


class ReadingUpdate(InputSchema):
    edition_id: Id | None = None
    started_at: datetime
    finished_at: datetime | None = None
    current_page: Page | None = None
    current_percent: Percent | None = None

    @field_validator("started_at", "finished_at")
    @classmethod
    def not_in_future(cls, value: datetime | None) -> datetime | None:
        return _not_in_future(value)

    @model_validator(mode="after")
    def check_reading(self) -> "ReadingUpdate":
        if self.finished_at is not None and self.finished_at < self.started_at:
            raise key_error(MessageKey.DATE_RANGE)
        _at_most_one(self.current_page, self.current_percent)
        return self


class NoteUpdate(InputSchema):
    content: NoteContent
    page: Page | None = None
    percent: Percent | None = None

    @model_validator(mode="after")
    def one_progress_kind(self) -> "NoteUpdate":
        _at_most_one(self.page, self.percent)
        return self


class NoteCreate(NoteUpdate):
    session_id: Id | None = None


class ReadingGoalSet(InputSchema):
    daily_reading_goal_minutes: Annotated[
        int | None, Field(ge=READING_GOAL_MINUTES_MIN, le=READING_GOAL_MINUTES_MAX)
    ]


class ReadingGoalOut(OutputSchema):
    daily_reading_goal_minutes: int | None


class SessionOut(OutputSchema):
    id: int
    reading_id: int
    started_at: datetime
    ended_at: datetime | None
    paused_at: datetime | None
    paused_seconds: int
    duration_seconds: int | None
    elapsed_seconds: int
    is_paused: bool
    start_page: int | None
    end_page: int | None
    start_percent: float | None
    end_percent: float | None


class ReadingOut(OutputSchema):
    id: int
    book_id: int
    edition_id: int | None
    edition: EditionOut | None
    state: ReadingState
    started_at: datetime
    finished_at: datetime | None
    current_page: int | None
    current_percent: float | None
    progress_percent: float | None
    total_seconds: int
    sessions_count: int
    created_at: datetime
    updated_at: datetime


class ActiveSessionOut(SessionOut):
    book_id: int
    book_title: str
    cover_url: str | None
    reading: ReadingOut
    today_seconds: int
    daily_reading_goal_minutes: int | None


class ReadingEventOut(OutputSchema):
    id: int
    reading_id: int | None
    session_id: int | None
    type: ReadingEventType
    status: ReadingStatus | None
    content: Annotated[str | None, Field(max_length=NOTE_MAX_LENGTH)]
    page: int | None
    percent: float | None
    occurred_at: datetime
    updated_at: datetime


class JourneyEventEntry(OutputSchema):
    kind: Literal["event"] = "event"
    at: datetime
    event: ReadingEventOut


class JourneySessionEntry(OutputSchema):
    kind: Literal["session"] = "session"
    at: datetime
    session: SessionOut


JourneyEntry = Annotated[JourneyEventEntry | JourneySessionEntry, Field(discriminator="kind")]


class JourneyReading(OutputSchema):
    reading: ReadingOut
    entries: list[JourneyEntry]
    pages_read: int | None
    pages_per_hour: float | None


class JourneyOut(OutputSchema):
    book_id: int
    shelf_history: list[ReadingEventOut]
    readings: list[JourneyReading]
