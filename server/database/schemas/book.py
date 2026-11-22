from datetime import date, datetime
from enum import StrEnum
from typing import Annotated

from fastapi import UploadFile
import re

from pydantic import Field, Json, field_validator, model_validator

from server.core.message_keys import MessageKey, key_error
from server.database.models.award import AWARD_NAME_MAX_LENGTH
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
from server.database.models.genres import GENRE_NAME_MAX_LENGTH
from server.database.models.reader_signal import Mood, Pace
from server.database.schemas.base import Id, InputSchema, OutputSchema, published_at_not_too_far
from server.database.models.content_warning import ContentWarning
from server.database.schemas.content_warning import ContentWarningsOut
from server.database.schemas.reader_signal import ReaderSignalsOut
from server.database.schemas.reading import ReadingOut
from server.database.schemas.user_book_status import UserBookStatusOut

BOOK_PAGE_SIZE_DEFAULT = 24
BOOK_PAGE_SIZE_MAX = 100
FILTER_IDS_MAX = 50

ListItem = Annotated[str, Field(min_length=1, max_length=LIST_ITEM_MAX_LENGTH)]
ImageName = Annotated[str, Field(min_length=1, max_length=IMAGE_NAME_MAX_LENGTH)]
Title = Annotated[str, Field(min_length=1, max_length=TITLE_MAX_LENGTH)]


def _unique(values: list) -> list:
    return list(dict.fromkeys(values))


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
    RELEVANCE = "relevance"
    TITLE = "title"
    RATING = "rating"
    NEWEST = "newest"


class BookListQuery(InputSchema):
    q: Annotated[
        str | None,
        Field(
            max_length=TITLE_MAX_LENGTH,
            description="Words from the title, author name or synopsis, or an ISBN. Accents and small typos are ignored.",
        ),
    ] = None
    genre_ids: Annotated[list[Id], Field(max_length=FILTER_IDS_MAX)] = []
    author_ids: Annotated[list[Id], Field(max_length=FILTER_IDS_MAX)] = []
    language_ids: Annotated[list[Id], Field(max_length=FILTER_IDS_MAX)] = []
    min_rating: Annotated[int | None, Field(ge=1, le=RATING_MAX, description="Minimum average rating.")] = None
    moods: Annotated[
        list[Mood],
        Field(max_length=len(Mood), description="Books that readers mostly describe with every one of these moods."),
    ] = []
    paces: Annotated[list[Pace], Field(max_length=len(Pace), description="Books whose pace is any of these.")] = []
    avoid_warnings: Annotated[
        list[ContentWarning],
        Field(max_length=len(ContentWarning), description="Leave out books any reader reported with these warnings."),
    ] = []
    min_pages: Annotated[int | None, Field(ge=1, le=PAGES_MAX)] = None
    max_pages: Annotated[int | None, Field(ge=1, le=PAGES_MAX)] = None
    sort: Annotated[
        BookSort, Field(description="`relevance` ranks search matches and falls back to `title` without `q`.")
    ] = BookSort.RELEVANCE
    offset: Annotated[int, Field(ge=0)] = 0
    limit: Annotated[int, Field(ge=1, le=BOOK_PAGE_SIZE_MAX)] = BOOK_PAGE_SIZE_DEFAULT

    @field_validator("moods", "paces", "avoid_warnings")
    @classmethod
    def drop_duplicate_values(cls, value: list) -> list:
        return _unique(value)

    @model_validator(mode="after")
    def pages_range(self) -> "BookListQuery":
        if self.min_pages is not None and self.max_pages is not None and self.max_pages < self.min_pages:
            raise key_error(MessageKey.PAGES_RANGE_INVALID)
        return self


class GenreRef(OutputSchema):
    id: int
    name: Annotated[str, Field(max_length=GENRE_NAME_MAX_LENGTH)]


class AwardRef(OutputSchema):
    id: int
    name: Annotated[str, Field(max_length=AWARD_NAME_MAX_LENGTH)]
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
    genres: list[GenreRef]
    average_rating: float | None
    ratings_count: int
    pace: Pace | None
    top_moods: list[Mood]


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
    genres: list[GenreRef]
    awards: list[AwardRef]
    average_rating: float | None
    ratings_count: int
    rating_histogram: list[RatingBucket]
    reader_tags: list[ReaderTag]
    reader_signals: ReaderSignalsOut
    content_warnings: ContentWarningsOut
    user_book_status: UserBookStatusOut | None
    active_reading: ReadingOut | None
    created_at: datetime
    updated_at: datetime
