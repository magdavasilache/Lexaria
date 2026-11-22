from datetime import date, datetime
from typing import Annotated

from pydantic import Field, ValidationInfo, field_validator

from server.core.message_keys import MessageKey, key_error
from server.database.models.book import TITLE_MAX_LENGTH
from server.database.models.edition import (
    EDITION_PAGES_MAX,
    ISBN_INPUT_MAX_LENGTH,
    ISBN_LENGTH,
    PERCENT_FORMATS,
    PUBLISHER_MAX_LENGTH,
    TRANSLATOR_MAX_LENGTH,
    EditionFormat,
)
from server.database.models.user import USERNAME_MAX_LENGTH
from server.database.schemas.base import Id, InputSchema, OutputSchema, published_at_not_too_far

EDITION_PAGE_SIZE_DEFAULT = 50
EDITION_PAGE_SIZE_MAX = 100


def _isbn10_check_digit_valid(digits: str) -> bool:
    if not (digits[:9].isdigit() and (digits[9].isdigit() or digits[9] == "X")):
        return False
    total = sum((10 - index) * int(char) for index, char in enumerate(digits[:9]))
    total += 10 if digits[9] == "X" else int(digits[9])
    return total % 11 == 0


def _isbn13_check_digit(first_twelve: str) -> str:
    total = sum(int(char) * (1 if index % 2 == 0 else 3) for index, char in enumerate(first_twelve))
    return str((10 - total % 10) % 10)


def normalize_isbn(value: str) -> str | None:
    compact = value.replace("-", "").replace(" ", "").upper()
    if len(compact) == 10 and _isbn10_check_digit_valid(compact):
        first_twelve = "978" + compact[:9]
        return first_twelve + _isbn13_check_digit(first_twelve)
    if len(compact) == ISBN_LENGTH and compact.isdigit() and _isbn13_check_digit(compact[:12]) == compact[12]:
        return compact
    return None


class EditionCreate(InputSchema):
    format: EditionFormat
    pages: Annotated[int | None, Field(ge=1, le=EDITION_PAGES_MAX, validate_default=True)] = None
    language_id: Id | None = None
    translator: Annotated[str | None, Field(max_length=TRANSLATOR_MAX_LENGTH)] = None
    publisher: Annotated[str | None, Field(max_length=PUBLISHER_MAX_LENGTH)] = None
    published_at: date | None = None
    isbn: Annotated[str | None, Field(max_length=ISBN_INPUT_MAX_LENGTH)] = None

    @field_validator("pages")
    @classmethod
    def print_editions_have_pages(cls, value: int | None, info: ValidationInfo) -> int | None:
        edition_format = info.data.get("format")
        if value is None and edition_format is not None and edition_format not in PERCENT_FORMATS:
            raise key_error(MessageKey.EDITION_PAGES_REQUIRED)
        return value

    @field_validator("translator", "publisher")
    @classmethod
    def empty_text_is_none(cls, value: str | None) -> str | None:
        return value or None

    @field_validator("published_at")
    @classmethod
    def check_published_at(cls, value: date | None) -> date | None:
        return published_at_not_too_far(value)

    @field_validator("isbn")
    @classmethod
    def valid_isbn(cls, value: str | None) -> str | None:
        if not value:
            return None
        normalized = normalize_isbn(value)
        if normalized is None:
            raise key_error(MessageKey.ISBN_INVALID)
        return normalized


class EditionUpdate(EditionCreate):
    pass


class EditionOut(OutputSchema):
    id: int
    book_id: int
    format: EditionFormat
    pages: int | None
    tracks_pages: bool
    language_id: int | None
    language_name: str | None
    translator: Annotated[str | None, Field(max_length=TRANSLATOR_MAX_LENGTH)]
    publisher: Annotated[str | None, Field(max_length=PUBLISHER_MAX_LENGTH)]
    published_at: date | None
    isbn: Annotated[str | None, Field(max_length=ISBN_LENGTH)]
    created_by_id: int | None
    created_at: datetime
    updated_at: datetime


class EditionListQuery(InputSchema):
    offset: Annotated[int, Field(ge=0)] = 0
    limit: Annotated[int, Field(ge=1, le=EDITION_PAGE_SIZE_MAX)] = EDITION_PAGE_SIZE_DEFAULT


class EditionAdminOut(EditionOut):
    book_title: Annotated[str, Field(max_length=TITLE_MAX_LENGTH)]
    created_by_username: Annotated[str | None, Field(max_length=USERNAME_MAX_LENGTH)]
