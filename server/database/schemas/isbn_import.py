from datetime import date
from typing import Annotated

from pydantic import Field, ValidationInfo, field_validator

from server.core.message_keys import MessageKey, key_error
from server.database.models.author import AUTHOR_NAME_MAX_LENGTH
from server.database.models.book import SYNOPSIS_MAX_LENGTH, TITLE_MAX_LENGTH
from server.database.models.edition import (
    EDITION_PAGES_MAX,
    ISBN_INPUT_MAX_LENGTH,
    ISBN_LENGTH,
    PUBLISHER_MAX_LENGTH,
    EditionFormat,
)
from server.database.models.language import LANGUAGE_NAME_MAX_LENGTH
from server.database.schemas.base import InputSchema, OutputSchema
from server.database.schemas.book import GenreRef
from server.database.schemas.edition import normalize_isbn, require_print_pages


class IsbnLookupQuery(InputSchema):
    isbn: Annotated[str, Field(min_length=1, max_length=ISBN_INPUT_MAX_LENGTH, description="ISBN-10 or ISBN-13.")]

    @field_validator("isbn")
    @classmethod
    def valid_isbn(cls, value: str) -> str:
        normalized = normalize_isbn(value)
        if normalized is None:
            raise key_error(MessageKey.ISBN_INVALID)
        return normalized


class IsbnImportCreate(IsbnLookupQuery):
    format: EditionFormat
    pages: Annotated[int | None, Field(ge=1, le=EDITION_PAGES_MAX, validate_default=True)] = None
    include_cover: Annotated[
        bool, Field(description="Download the Open Library cover. Covers are copyrighted by their publishers.")
    ] = False

    @field_validator("pages")
    @classmethod
    def print_editions_have_pages(cls, value: int | None, info: ValidationInfo) -> int | None:
        return require_print_pages(value, info)


class IsbnPreview(OutputSchema):
    isbn: Annotated[str, Field(max_length=ISBN_LENGTH)]
    title: Annotated[str, Field(max_length=TITLE_MAX_LENGTH)]
    author_name: Annotated[str | None, Field(max_length=AUTHOR_NAME_MAX_LENGTH * 2 + 1)]
    author_id: int | None
    language_name: Annotated[str | None, Field(max_length=LANGUAGE_NAME_MAX_LENGTH)]
    language_id: int | None
    pages: Annotated[int | None, Field(ge=1, le=EDITION_PAGES_MAX)]
    publisher: Annotated[str | None, Field(max_length=PUBLISHER_MAX_LENGTH)]
    published_at: date | None
    edition_format: EditionFormat | None
    synopsis: Annotated[str | None, Field(max_length=SYNOPSIS_MAX_LENGTH)]
    genres: list[GenreRef]
    has_cover: bool
    existing_book_id: int | None
    matched_book_id: int | None
    matched_book_title: Annotated[str | None, Field(max_length=TITLE_MAX_LENGTH)]


class IsbnImportResult(OutputSchema):
    book_id: int
    edition_id: int
    book_created: bool
    cover_imported: bool
