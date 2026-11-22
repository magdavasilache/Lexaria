from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Annotated

from pydantic import Field, field_validator, model_validator

from server.core.message_keys import MessageKey, key_error
from server.database.models.comment import COMMENT_CONTENT_MAX_LENGTH
from server.database.models.review import (
    REVIEW_CONTENT_MAX_LENGTH,
    REVIEW_RATING_MAX,
    REVIEW_RATING_MIN,
    REVIEW_RATING_STEP,
)
from server.database.models.user import AVATAR_URL_MAX_LENGTH, USERNAME_MAX_LENGTH
from server.database.schemas.base import InputSchema, OutputSchema

REVIEW_PAGE_SIZE_DEFAULT = 10
REVIEW_PAGE_SIZE_MAX = 50


class ReviewCreate(InputSchema):
    rating: Decimal | None = None
    content: Annotated[str | None, Field(max_length=REVIEW_CONTENT_MAX_LENGTH)] = None
    start_date: date | None = None
    end_date: date | None = None

    @field_validator("rating")
    @classmethod
    def rating_in_half_steps(cls, value: Decimal | None) -> Decimal | None:
        if value is None:
            return None
        if not REVIEW_RATING_MIN <= value <= REVIEW_RATING_MAX or value % REVIEW_RATING_STEP != 0:
            raise key_error(MessageKey.REVIEW_RATING_STEP, min=float(REVIEW_RATING_MIN), max=float(REVIEW_RATING_MAX))
        return value

    @field_validator("content")
    @classmethod
    def empty_content_is_none(cls, value: str | None) -> str | None:
        return value or None

    @field_validator("start_date", "end_date")
    @classmethod
    def not_in_future(cls, value: date | None) -> date | None:
        if value is not None and value > date.today():
            raise key_error(MessageKey.REVIEW_FUTURE_DATE)
        return value

    @model_validator(mode="after")
    def check_review(self) -> "ReviewCreate":
        if self.rating is None and self.content is None:
            raise key_error(MessageKey.REVIEW_EMPTY)
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise key_error(MessageKey.DATE_RANGE)
        return self


class ReviewUpdate(ReviewCreate):
    pass


class ReviewSort(StrEnum):
    NEWEST = "newest"
    TOP = "top"


class ReviewListQuery(InputSchema):
    sort: ReviewSort = ReviewSort.NEWEST
    stars: Annotated[
        int | None, Field(ge=1, le=int(REVIEW_RATING_MAX), description="Only ratings in this star bucket, as in the histogram.")
    ] = None
    offset: Annotated[int, Field(ge=0)] = 0
    limit: Annotated[int, Field(ge=1, le=REVIEW_PAGE_SIZE_MAX)] = REVIEW_PAGE_SIZE_DEFAULT


class CommentCreate(InputSchema):
    content: Annotated[str, Field(min_length=1, max_length=COMMENT_CONTENT_MAX_LENGTH)]


class CommentUpdate(CommentCreate):
    pass


class ReviewerOut(OutputSchema):
    id: int
    username: Annotated[str, Field(max_length=USERNAME_MAX_LENGTH)]
    avatar_url: Annotated[str | None, Field(max_length=AVATAR_URL_MAX_LENGTH)]


class CommentOut(OutputSchema):
    id: int
    review_id: int
    content: Annotated[str, Field(max_length=COMMENT_CONTENT_MAX_LENGTH)]
    author: ReviewerOut
    likes_count: int
    liked_by_me: bool
    can_edit: bool
    can_delete: bool
    created_at: datetime
    updated_at: datetime


class ReviewOut(OutputSchema):
    id: int
    book_id: int
    rating: float | None
    content: Annotated[str | None, Field(max_length=REVIEW_CONTENT_MAX_LENGTH)]
    start_date: date | None
    end_date: date | None
    author: ReviewerOut
    likes_count: int
    liked_by_me: bool
    can_edit: bool
    can_delete: bool
    comments: list[CommentOut]
    created_at: datetime
    updated_at: datetime


class LikeOut(OutputSchema):
    liked: bool
    likes_count: int
