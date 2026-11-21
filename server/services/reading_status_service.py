from sqlalchemy.orm import Session

from server.core.errors import ErrorCode, NotFoundError
from server.core.message_keys import MessageKey
from server.database.models.audit_log import AuditAction
from server.database.models.book import Book
from server.database.models.user import User
from server.database.schemas.user_book_status import UserBookStatusOut, UserBookStatusSet
from server.repositories import reading_status_repository
from server.services import audit_service


def _load_book(db: Session, book_id: int) -> Book:
    book = db.get(Book, book_id)
    if book is None:
        raise NotFoundError(MessageKey.BOOK_NOT_FOUND, params={"book_id": book_id}, code=ErrorCode.BOOK_NOT_FOUND)
    return book


def set_status(db: Session, book_id: int, form: UserBookStatusSet, user: User) -> UserBookStatusOut:
    params = {"username": user.username, "book_id": book_id, "status": [f"books.readingStatus.{form.status.value}"]}
    with audit_service.track(db, AuditAction.READING_STATUS_SET, actor=user, params=params) as entry:
        entry.set_entity("book", book_id)
        entry.params["title"] = _load_book(db, book_id).title
        reading_status_repository.set_status(db, user.id, book_id, form.status)
    db.expire_all()
    return UserBookStatusOut.model_validate(reading_status_repository.get_status(db, user.id, book_id))


def remove_status(db: Session, book_id: int, user: User) -> None:
    params = {"username": user.username, "book_id": book_id}
    with audit_service.track(db, AuditAction.READING_STATUS_REMOVE, actor=user, params=params) as entry:
        entry.set_entity("book", book_id)
        entry.params["title"] = _load_book(db, book_id).title
        reading_status_repository.remove_status(db, user.id, book_id)
