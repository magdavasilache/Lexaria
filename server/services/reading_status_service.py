from datetime import datetime, timezone

from sqlalchemy.orm import Session

from server.database.models.audit_log import AuditAction
from server.database.models.user import User
from server.database.schemas.user_book_status import UserBookStatusOut, UserBookStatusSet
from server.repositories import reading_status_repository
from server.services import audit_service, book_service, reading_lifecycle


def set_status(db: Session, book_id: int, form: UserBookStatusSet, user: User) -> UserBookStatusOut:
    params = {"username": user.username, "book_id": book_id, "status": [f"books.readingStatus.{form.status.value}"]}
    with audit_service.track(db, AuditAction.READING_STATUS_SET, actor=user, params=params) as entry:
        entry.set_entity("book", book_id)
        entry.params["title"] = book_service.require_book(db, book_id).title
        reading_lifecycle.shelve(db, user.id, book_id, form.status, datetime.now(timezone.utc))
    db.expire_all()
    return UserBookStatusOut.model_validate(reading_status_repository.get_status(db, user.id, book_id))


def remove_status(db: Session, book_id: int, user: User) -> None:
    params = {"username": user.username, "book_id": book_id}
    with audit_service.track(db, AuditAction.READING_STATUS_REMOVE, actor=user, params=params) as entry:
        entry.set_entity("book", book_id)
        entry.params["title"] = book_service.require_book(db, book_id).title
        reading_status_repository.remove_status(db, user.id, book_id)
        reading_lifecycle.apply_shelf(db, user.id, book_id, None, datetime.now(timezone.utc))
