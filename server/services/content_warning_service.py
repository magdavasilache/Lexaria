from sqlalchemy.orm import Session

from server.core.errors import ErrorCode, ForbiddenError
from server.core.message_keys import MessageKey
from server.database.models.audit_log import AuditAction
from server.database.models.user import User
from server.database.schemas.content_warning import ContentWarningsOut, ContentWarningsUpdate
from server.repositories import content_warning_repository
from server.services import audit_service, book_service
from server.services.content_warning_views import warnings_out
from server.services.reader_signal_views import can_vote


def get_warnings(db: Session, book_id: int, user: User) -> ContentWarningsOut:
    book_service.require_book(db, book_id)
    return warnings_out(db, book_id, user)


def set_report(db: Session, book_id: int, form: ContentWarningsUpdate, user: User) -> ContentWarningsOut:
    params = {"username": user.username, "book_id": book_id}
    with audit_service.track(db, AuditAction.CONTENT_WARNINGS_SET, actor=user, params=params) as entry:
        entry.set_entity("book", book_id)
        entry.params["title"] = book_service.require_book(db, book_id).title
        if not can_vote(db, user, book_id):
            raise ForbiddenError(MessageKey.CONTENT_WARNING_NOT_ALLOWED, code=ErrorCode.CONTENT_WARNING_NOT_ALLOWED)
        content_warning_repository.replace(db, user.id, book_id, form.warnings)
    return warnings_out(db, book_id, user)


def remove_report(db: Session, book_id: int, user: User) -> ContentWarningsOut:
    params = {"username": user.username, "book_id": book_id}
    with audit_service.track(db, AuditAction.CONTENT_WARNINGS_REMOVE, actor=user, params=params) as entry:
        entry.set_entity("book", book_id)
        entry.params["title"] = book_service.require_book(db, book_id).title
        content_warning_repository.remove(db, user.id, book_id)
    return warnings_out(db, book_id, user)
