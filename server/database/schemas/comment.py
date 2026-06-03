from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from server.database.schemas.global_schemas import RequestResponse
from server.database.schemas.user import UserOut


class CommentBase(BaseModel):
    comment_content: str


class CommentOut(CommentBase):
    id: int
    user_liked: bool
    user: UserOut
    created_at: datetime
    can_edit: bool = False
    likes_count: int = 0


class CommentCreate(CommentBase):
    review_id: int

class CommentCreateResponse(RequestResponse):
    data: CommentOut