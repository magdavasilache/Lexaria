from typing import Annotated

from pydantic import Field, field_validator, model_validator

from server.core.message_keys import MessageKey, key_error
from server.database.models.reader_signal import MOODS_PER_VOTE_MAX, Mood, Pace
from server.database.schemas.base import InputSchema, OutputSchema


class ReaderVoteUpdate(InputSchema):
    moods: Annotated[
        list[Mood], Field(max_length=MOODS_PER_VOTE_MAX, description="Up to three moods the book left you with.")
    ] = []
    pace: Pace | None = None

    @field_validator("moods")
    @classmethod
    def drop_duplicate_moods(cls, value: list[Mood]) -> list[Mood]:
        return list(dict.fromkeys(value))

    @model_validator(mode="after")
    def not_empty(self) -> "ReaderVoteUpdate":
        if not self.moods and self.pace is None:
            raise key_error(MessageKey.READER_VOTE_EMPTY)
        return self


class MoodShare(OutputSchema):
    mood: Mood
    votes: int
    share: float


class PaceShare(OutputSchema):
    pace: Pace
    votes: int
    share: float


class ReaderSignalsOut(OutputSchema):
    moods: list[MoodShare]
    paces: list[PaceShare]
    pace: Pace | None
    mood_voters: int
    my_moods: list[Mood]
    my_pace: Pace | None
    can_vote: bool
