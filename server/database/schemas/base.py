from datetime import date, timedelta
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, StringConstraints

from server.core.message_keys import MessageKey, key_error

PUBLISHED_AT_MAX_DAYS_AHEAD = 365

RawStr = Annotated[str, StringConstraints(strip_whitespace=False)]
Id = Annotated[int, Field(ge=1)]


def single_spaced(value: str) -> str:
    return " ".join(value.split())


def blank_to_none(value: str | None) -> str | None:
    return value or None


def single_spaced_or_none(value: str | None) -> str | None:
    return single_spaced(value) or None if value else None


def name_field(max_length: int):
    return Annotated[str, Field(min_length=1, max_length=max_length), AfterValidator(single_spaced)]


def optional_name(max_length: int):
    return Annotated[str | None, Field(max_length=max_length), AfterValidator(single_spaced_or_none)]


def optional_text(max_length: int):
    return Annotated[str | None, Field(max_length=max_length), AfterValidator(blank_to_none)]


def not_in_future(value: date | None) -> date | None:
    if value is not None and value > date.today():
        raise key_error(MessageKey.DATE_IN_FUTURE)
    return value


def published_at_not_too_far(value: date | None) -> date | None:
    if value is not None and value > date.today() + timedelta(days=PUBLISHED_AT_MAX_DAYS_AHEAD):
        raise key_error(MessageKey.PUBLISHED_TOO_FAR)
    return value


class InputSchema(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class OutputSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
