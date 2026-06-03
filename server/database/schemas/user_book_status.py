from datetime import datetime
from pydantic import BaseModel


class UserBookStatusCreate(BaseModel):
    book_id: int
    status: str

class UserBookStatusOut(BaseModel):
    user_id: int
    book_id: int
    status: str
    added_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True