from datetime import date, datetime
from typing import Annotated

from pydantic import Field, field_validator

from server.core.message_keys import MessageKey, key_error
from server.database.models.award import AWARD_DESCRIPTION_MAX_LENGTH, AWARD_NAME_MAX_LENGTH, AWARD_YEAR_MIN
from server.database.schemas.base import InputSchema, OutputSchema, name_field, optional_text


class AwardIn(InputSchema):
    name: name_field(AWARD_NAME_MAX_LENGTH)
    year: Annotated[int | None, Field(ge=AWARD_YEAR_MIN)] = None
    description: optional_text(AWARD_DESCRIPTION_MAX_LENGTH) = None

    @field_validator("year")
    @classmethod
    def year_not_in_future(cls, value: int | None) -> int | None:
        if value is not None and value > date.today().year:
            raise key_error(MessageKey.AWARD_YEAR_IN_FUTURE)
        return value


class AwardOut(OutputSchema):
    id: int
    name: Annotated[str, Field(max_length=AWARD_NAME_MAX_LENGTH)]
    year: int | None
    description: Annotated[str | None, Field(max_length=AWARD_DESCRIPTION_MAX_LENGTH)]
    books_count: int
    created_at: datetime
    updated_at: datetime
