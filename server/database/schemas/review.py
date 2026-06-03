from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from server.database.schemas.comment import CommentOut
from server.database.schemas.global_schemas import RequestResponse
from server.database.schemas.user import UserOut
from server.database.schemas.user_book_status import UserBookStatusOut


class ReviewBase(BaseModel):
    book_id: int
    rating: float | None = None
    review_content: str | None = None

class ReviewCreate(ReviewBase):
    pass

class ReviewOut(ReviewBase):
    id: int
    user_id: int
    start_date: datetime
    end_date: datetime | None = None

    class Config:
        from_attributes = True

class ReviewUpdate(ReviewOut):
    pass

class ReviewCreateResponse(RequestResponse):
    data: Optional[ReviewOut] = None 

class BookReviewOut(BaseModel):
    id: int
    rating: Optional[float] = None
    review_content: Optional[str] = None
    created_at: datetime
    comments: Optional[list[CommentOut]] = None
    user_liked: bool
    user: UserOut
    user_book_status: Optional[UserBookStatusOut] = None
    can_edit: bool = False
    likes_count: int = 0

    class Config:
        from_attributes = True

class GetReviewsResponse(RequestResponse):
    data: Optional[list[BookReviewOut]] = []