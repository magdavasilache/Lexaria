from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from server.core.errors import ConflictError, ErrorCode, NotFoundError, ValidationAppError
from server.core.message_keys import MessageKey
from server.database.models.audit_log import AuditAction
from server.database.models.reading import Reading, ReadingState
from server.database.models.reading_event import ReadingEvent, ReadingEventType
from server.database.models.reading_session import MAX_SESSION_HOURS, ReadingSession
from server.database.models.user import User
from server.database.models.user_book_status import ReadingStatus
from server.database.models.user_session import as_utc
from server.database.schemas.reading import ActiveSessionOut, ReadingOut, SessionEnd, SessionOut, SessionStart
from server.repositories import reading_repository
from server.services import audit_service, book_service, edition_service, reading_lifecycle
from server.services.images import ImageFolder, image_url


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _load_session(db: Session, session_id: int, user: User) -> ReadingSession:
    session = reading_repository.get_session(db, session_id)
    if session is None or session.user_id != user.id:
        raise NotFoundError(
            MessageKey.SESSION_NOT_FOUND, params={"session_id": session_id}, code=ErrorCode.SESSION_NOT_FOUND
        )
    return session


def _require_running(session: ReadingSession) -> None:
    if not session.is_active:
        raise ConflictError(MessageKey.SESSION_NOT_ACTIVE, code=ErrorCode.SESSION_NOT_ACTIVE)


def _active_out(db: Session, session_id: int) -> ActiveSessionOut:
    db.expire_all()
    session = reading_repository.get_session(db, session_id)
    book = session.reading.book
    return ActiveSessionOut(
        **SessionOut.model_validate(session).model_dump(),
        book_id=book.id,
        book_title=book.title,
        cover_url=image_url(ImageFolder.BOOKS, book.images[0]) if book.images else None,
        reading=ReadingOut.model_validate(session.reading),
    )


def _reading_out(db: Session, reading_id: int) -> ReadingOut:
    db.expire_all()
    return ReadingOut.model_validate(reading_repository.get_reading(db, reading_id))


def _session_params(user: User, session_id: int) -> dict:
    return {"username": user.username, "session_id": session_id}


def _describe(entry: audit_service.AuditEntry, session: ReadingSession) -> None:
    entry.set_entity("reading_session", session.id)
    entry.params.update({"book_id": session.reading.book_id, "title": session.reading.book.title})


def get_active(db: Session, user: User) -> ActiveSessionOut | None:
    session = reading_repository.get_user_running_session(db, user.id)
    return _active_out(db, session.id) if session else None


def _ensure_reading(db: Session, user: User, book_id: int, at: datetime) -> Reading:
    reading_lifecycle.shelve(db, user.id, book_id, ReadingStatus.CURRENTLY_READING, at)
    reading = reading_repository.get_active_reading(db, user.id, book_id)
    if reading is None:
        reading = reading_lifecycle.start_reading(db, user.id, book_id, at)
    return reading


def start_session(db: Session, book_id: int, form: SessionStart, user: User) -> ActiveSessionOut:
    params = {"username": user.username, "book_id": book_id}
    with audit_service.track(db, AuditAction.READING_SESSION_START, actor=user, params=params) as entry:
        entry.params["title"] = book_service.require_book(db, book_id).title
        if reading_repository.get_user_running_session(db, user.id) is not None:
            raise ConflictError(
                MessageKey.SESSION_ALREADY_ACTIVE,
                code=ErrorCode.SESSION_ALREADY_ACTIVE,
                hint_key=MessageKey.SESSION_ALREADY_ACTIVE_HINT,
            )
        edition = edition_service.load_for_book(db, form.edition_id, book_id) if form.edition_id is not None else None
        now = _now()
        reading = _ensure_reading(db, user, book_id, now)
        if edition is not None:
            reading_lifecycle.switch_edition(db, reading, edition, now)
        start_page, start_percent = form.start_page, form.start_percent
        if start_page is None and start_percent is None:
            start_page, start_percent = reading.current_page, reading.current_percent
        reading_lifecycle.check_progress(
            reading.edition, start_page, start_percent, fields=("start_page", "start_percent")
        )
        session = reading_repository.add_session(
            db,
            ReadingSession(
                reading_id=reading.id,
                user_id=user.id,
                started_at=now,
                start_page=start_page,
                start_percent=start_percent,
            ),
        )
        entry.set_entity("reading_session", session.id)
        entry.params["session_id"] = session.id
    return _active_out(db, session.id)


def pause_session(db: Session, session_id: int, user: User) -> ActiveSessionOut:
    with audit_service.track(
        db, AuditAction.READING_SESSION_PAUSE, actor=user, params=_session_params(user, session_id)
    ) as entry:
        session = _load_session(db, session_id, user)
        _describe(entry, session)
        _require_running(session)
        if session.is_paused:
            raise ConflictError(MessageKey.SESSION_ALREADY_PAUSED, code=ErrorCode.SESSION_ALREADY_PAUSED)
        session.paused_at = _now()
        db.flush()
    return _active_out(db, session_id)


def resume_session(db: Session, session_id: int, user: User) -> ActiveSessionOut:
    with audit_service.track(
        db, AuditAction.READING_SESSION_RESUME, actor=user, params=_session_params(user, session_id)
    ) as entry:
        session = _load_session(db, session_id, user)
        _describe(entry, session)
        _require_running(session)
        if not session.is_paused:
            raise ConflictError(MessageKey.SESSION_NOT_PAUSED, code=ErrorCode.SESSION_NOT_PAUSED)
        session.paused_seconds += max(0, int((_now() - as_utc(session.paused_at)).total_seconds()))
        session.paused_at = None
        db.flush()
    return _active_out(db, session_id)


def _end_time(session: ReadingSession, ended_at: datetime | None, now: datetime) -> datetime:
    started_at = as_utc(session.started_at)
    if ended_at is None:
        return min(now, started_at + timedelta(hours=MAX_SESSION_HOURS))
    if ended_at < started_at:
        raise ValidationAppError(MessageKey.ENDED_BEFORE_START, field="ended_at")
    return ended_at


def end_session(db: Session, session_id: int, form: SessionEnd, user: User) -> ReadingOut:
    with audit_service.track(
        db, AuditAction.READING_SESSION_END, actor=user, params=_session_params(user, session_id)
    ) as entry:
        session = _load_session(db, session_id, user)
        _describe(entry, session)
        _require_running(session)
        reading = session.reading
        reading_lifecycle.check_progress(
            reading.edition,
            form.end_page,
            form.end_percent,
            fields=("end_page", "end_percent"),
            min_page=session.start_page,
            min_percent=session.start_percent,
        )
        ended_at = _end_time(session, form.ended_at, _now())
        counted_until = min(ended_at, as_utc(session.paused_at)) if session.paused_at else ended_at
        session.duration_seconds = session.seconds_until(counted_until)
        session.ended_at = ended_at
        session.paused_at = None
        session.end_page, session.end_percent = form.end_page, form.end_percent
        if form.end_page is not None:
            reading.current_page, reading.current_percent = form.end_page, None
        elif form.end_percent is not None:
            reading.current_page, reading.current_percent = None, form.end_percent
        db.flush()
        if form.note:
            reading_repository.add_event(
                db,
                ReadingEvent(
                    user_id=user.id,
                    book_id=reading.book_id,
                    reading_id=reading.id,
                    session_id=session.id,
                    type=ReadingEventType.NOTE.value,
                    content=form.note,
                    page=form.end_page,
                    percent=form.end_percent,
                    occurred_at=ended_at,
                ),
            )
        if form.mark_finished:
            reading_lifecycle.shelve(db, user.id, reading.book_id, ReadingStatus.READ, ended_at)
            if reading.state == ReadingState.ACTIVE.value:
                reading_lifecycle.finish_reading(db, reading, ended_at)
    return _reading_out(db, reading.id)


def discard_session(db: Session, session_id: int, user: User) -> None:
    with audit_service.track(
        db, AuditAction.READING_SESSION_DISCARD, actor=user, params=_session_params(user, session_id)
    ) as entry:
        session = _load_session(db, session_id, user)
        _describe(entry, session)
        reading_repository.delete_session(db, session)
