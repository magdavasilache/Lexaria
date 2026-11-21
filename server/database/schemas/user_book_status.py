from datetime import datetime

from pydantic import BaseModel

from server.database.schemas.base import OutputSchema


class UserBookStatusCreate(BaseModel):
    book_id: int
    status: str


class UserBookStatusOut(OutputSchema):
    user_id: int
    book_id: int
    status: str
    added_at: datetime
    updated_at: datetime
