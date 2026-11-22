from sqlalchemy.orm import Session

from server.core.errors import ErrorCode, ForbiddenError
from server.core.message_keys import MessageKey
from server.database.models.audit_log import AuditAction
from server.database.models.user import User
from server.database.schemas.reader_signal import ReaderSignalsOut, ReaderVoteUpdate
from server.repositories import reader_signal_repository
from server.services import audit_service, book_service
from server.services.reader_signal_views import can_vote, signals_out


def get_signals(db: Session, book_id: int, user: User) -> ReaderSignalsOut:
    return signals_out(db, book_service.require_book(db, book_id), user)


def set_vote(db: Session, book_id: int, form: ReaderVoteUpdate, user: User) -> ReaderSignalsOut:
    params = {"username": user.username, "book_id": book_id}
    with audit_service.track(db, AuditAction.READER_VOTE_SET, actor=user, params=params) as entry:
        entry.set_entity("book", book_id)
        entry.params["title"] = book_service.require_book(db, book_id).title
        if not can_vote(db, user, book_id):
            raise ForbiddenError(MessageKey.READER_VOTE_NOT_ALLOWED, code=ErrorCode.READER_VOTE_NOT_ALLOWED)
        reader_signal_repository.replace_vote(db, user.id, book_id, form.moods, form.pace)
        reader_signal_repository.refresh(db, [book_id])
    db.expire_all()
    return get_signals(db, book_id, user)


def remove_vote(db: Session, book_id: int, user: User) -> ReaderSignalsOut:
    params = {"username": user.username, "book_id": book_id}
    with audit_service.track(db, AuditAction.READER_VOTE_REMOVE, actor=user, params=params) as entry:
        entry.set_entity("book", book_id)
        entry.params["title"] = book_service.require_book(db, book_id).title
        reader_signal_repository.delete_vote(db, user.id, book_id)
        reader_signal_repository.refresh(db, [book_id])
    db.expire_all()
    return get_signals(db, book_id, user)
