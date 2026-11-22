from datetime import date, datetime
from typing import Annotated

from fastapi import UploadFile
from pydantic import Field, field_validator

from server.database.models.author import AUTHOR_ABOUT_MAX_LENGTH, AUTHOR_NAME_MAX_LENGTH
from server.database.models.country import COUNTRY_NAME_MAX_LENGTH
from server.database.schemas.base import Id, InputSchema, OutputSchema, name_field, not_in_future, optional_name, optional_text


class AuthorIn(InputSchema):
    first_name: name_field(AUTHOR_NAME_MAX_LENGTH)
    last_name: optional_name(AUTHOR_NAME_MAX_LENGTH) = None
    birthdate: date | None = None
    country_id: Id | None = None
    about: optional_text(AUTHOR_ABOUT_MAX_LENGTH) = None
    image: Annotated[UploadFile | None, Field(description="JPG, PNG or WebP portrait.")] = None

    @field_validator("birthdate")
    @classmethod
    def birthdate_not_in_future(cls, value: date | None) -> date | None:
        return not_in_future(value)


class AuthorUpdate(AuthorIn):
    remove_image: Annotated[bool, Field(description="Delete the current portrait when no new image is sent.")] = False


class AuthorOut(OutputSchema):
    id: int
    first_name: Annotated[str, Field(max_length=AUTHOR_NAME_MAX_LENGTH)]
    last_name: Annotated[str | None, Field(max_length=AUTHOR_NAME_MAX_LENGTH)]
    full_name: str
    birthdate: date | None
    country_id: int | None
    country_name: Annotated[str | None, Field(max_length=COUNTRY_NAME_MAX_LENGTH)]
    about: Annotated[str | None, Field(max_length=AUTHOR_ABOUT_MAX_LENGTH)]
    image_url: str | None
    books_count: int
    created_at: datetime
    updated_at: datetime
