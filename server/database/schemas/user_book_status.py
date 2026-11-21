from datetime import datetime

from server.database.models.user_book_status import ReadingStatus
from server.database.schemas.base import InputSchema, OutputSchema


class UserBookStatusSet(InputSchema):
    status: ReadingStatus


class UserBookStatusOut(OutputSchema):
    user_id: int
    book_id: int
    status: ReadingStatus
    added_at: datetime
    updated_at: datetime
