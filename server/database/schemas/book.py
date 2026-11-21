from datetime import date, datetime, timedelta
from enum import StrEnum
from typing import Annotated

from fastapi import UploadFile
import re

from pydantic import Field, Json, field_validator

from server.core.message_keys import MessageKey, key_error
from server.database.models.book import (
    BOOK_IMAGES_MAX,
    DESCRIPTION_LANGUAGE_MAX_LENGTH,
    DESCRIPTION_LANGUAGE_PATTERN,
    DESCRIPTIONS_MAX,
    IMAGE_NAME_MAX_LENGTH,
    LIST_ITEM_MAX_LENGTH,
    LIST_MAX_ITEMS,
    PAGES_MAX,
    RATING_MAX,
    SYNOPSIS_MAX_LENGTH,
    TITLE_MAX_LENGTH,
)
from server.database.schemas.base import InputSchema, OutputSchema
from server.database.schemas.genre import GenreOut
from server.database.schemas.user_book_status import UserBookStatusOut

BOOK_PAGE_SIZE_DEFAULT = 24
BOOK_PAGE_SIZE_MAX = 100
FILTER_IDS_MAX = 50
PUBLISHED_AT_MAX_DAYS_AHEAD = 365

Id = Annotated[int, Field(ge=1)]
ListItem = Annotated[str, Field(min_length=1, max_length=LIST_ITEM_MAX_LENGTH)]
ImageName = Annotated[str, Field(min_length=1, max_length=IMAGE_NAME_MAX_LENGTH)]
Title = Annotated[str, Field(min_length=1, max_length=TITLE_MAX_LENGTH)]


def _unique(values: list) -> list:
    return list(dict.fromkeys(values))


def published_at_not_too_far(value: date | None) -> date | None:
    if value is not None and value > date.today() + timedelta(days=PUBLISHED_AT_MAX_DAYS_AHEAD):
        raise key_error(MessageKey.PUBLISHED_TOO_FAR)
    return value


DescriptionLanguage = Annotated[str, Field(min_length=2, max_length=DESCRIPTION_LANGUAGE_MAX_LENGTH)]
Synopsis = Annotated[str, Field(min_length=1, max_length=SYNOPSIS_MAX_LENGTH)]


class BookDescriptionIn(InputSchema):
    language: DescriptionLanguage
    synopsis: Synopsis

    @field_validator("language")
    @classmethod
    def language_code(cls, value: str) -> str:
        if not re.fullmatch(DESCRIPTION_LANGUAGE_PATTERN, value):
            raise key_error(MessageKey.DESCRIPTION_LANGUAGE)
        return value


class BookDescriptionOut(OutputSchema):
    language: DescriptionLanguage
    synopsis: Synopsis


class BookCreate(InputSchema):
    title: Title
    author_id: Id | None = None
    language_id: Id | None = None
    country_id: Id | None = None
    pages: Annotated[int | None, Field(ge=1, le=PAGES_MAX)] = None
    published_at: date | None = None
    descriptions: Annotated[
        list[Json[BookDescriptionIn]],
        Field(max_length=DESCRIPTIONS_MAX, description='One JSON object {"language": "en", "synopsis": "..."} per language.'),
    ] = []
    is_series: bool = False
    settings: Annotated[list[ListItem], Field(max_length=LIST_MAX_ITEMS)] = []
    characters: Annotated[list[ListItem], Field(max_length=LIST_MAX_ITEMS)] = []
    genre_ids: Annotated[list[Id], Field(max_length=LIST_MAX_ITEMS)] = []
    award_ids: Annotated[list[Id], Field(max_length=LIST_MAX_ITEMS)] = []
    images: Annotated[
        list[UploadFile],
        Field(max_length=BOOK_IMAGES_MAX, description="JPG, PNG or WebP, the first one is the cover."),
    ] = []

    @field_validator("published_at")
    @classmethod
    def check_published_at(cls, value: date | None) -> date | None:
        return published_at_not_too_far(value)

    @field_validator("descriptions")
    @classmethod
    def one_description_per_language(cls, value: list[BookDescriptionIn]) -> list[BookDescriptionIn]:
        seen: set[str] = set()
        for description in value:
            if description.language in seen:
                raise key_error(MessageKey.DUPLICATE_DESCRIPTION, language=description.language)
            seen.add(description.language)
        return value

    @field_validator("settings", "characters", "genre_ids", "award_ids")
    @classmethod
    def drop_duplicates(cls, value: list) -> list:
        return _unique(value)


class BookUpdate(BookCreate):
    kept_images: Annotated[
        list[ImageName],
        Field(max_length=BOOK_IMAGES_MAX, description="Current image names to keep, in display order."),
    ] = []

    @field_validator("kept_images")
    @classmethod
    def drop_duplicate_images(cls, value: list[str]) -> list[str]:
        return _unique(value)


class BookSort(StrEnum):
    TITLE = "title"
    RATING = "rating"
    NEWEST = "newest"


class BookListQuery(InputSchema):
    q: Annotated[str | None, Field(max_length=TITLE_MAX_LENGTH, description="Part of the title.")] = None
    genre_ids: Annotated[list[Id], Field(max_length=FILTER_IDS_MAX)] = []
    author_ids: Annotated[list[Id], Field(max_length=FILTER_IDS_MAX)] = []
    language_ids: Annotated[list[Id], Field(max_length=FILTER_IDS_MAX)] = []
    min_rating: Annotated[int | None, Field(ge=1, le=RATING_MAX, description="Minimum average rating.")] = None
    sort: BookSort = BookSort.TITLE
    offset: Annotated[int, Field(ge=0)] = 0
    limit: Annotated[int, Field(ge=1, le=BOOK_PAGE_SIZE_MAX)] = BOOK_PAGE_SIZE_DEFAULT


class AwardRef(OutputSchema):
    id: int
    name: str
    year: int | None


class ReaderTag(OutputSchema):
    tag: str
    count: int


class RatingBucket(OutputSchema):
    stars: int
    count: int


class BookListItem(OutputSchema):
    id: int
    title: Annotated[str, Field(max_length=TITLE_MAX_LENGTH)]
    author_name: str | None
    language_name: str | None
    cover_url: str | None
    pages: int | None
    descriptions: list[BookDescriptionOut]
    genres: list[GenreOut]
    average_rating: float | None
    ratings_count: int


class BookDetail(OutputSchema):
    id: int
    title: Annotated[str, Field(max_length=TITLE_MAX_LENGTH)]
    author_id: int | None
    author_name: str | None
    language_id: int | None
    language_name: str | None
    country_id: int | None
    country_name: str | None
    images: list[str]
    image_urls: list[str]
    pages: int | None
    published_at: date | None
    descriptions: list[BookDescriptionOut]
    settings: list[str]
    characters: list[str]
    is_series: bool
    genres: list[GenreOut]
    awards: list[AwardRef]
    average_rating: float | None
    ratings_count: int
    rating_histogram: list[RatingBucket]
    reader_tags: list[ReaderTag]
    user_book_status: UserBookStatusOut | None
    created_at: datetime
    updated_at: datetime
