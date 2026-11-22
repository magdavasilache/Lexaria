from datetime import datetime, timezone

from sqlalchemy.orm import Session

from server.core.errors import ErrorCode, NotFoundError, ValidationAppError
from server.core.message_keys import MessageKey
from server.database.models.audit_log import AuditAction
from server.database.models.reading import Reading, ReadingState
from server.database.models.reading_event import ReadingEvent, ReadingEventType
from server.database.models.user import User
from server.database.schemas.reading import (
    JourneyEventEntry,
    JourneyOut,
    JourneyReading,
    JourneySessionEntry,
    NoteCreate,
    NoteUpdate,
    ReadingEventOut,
    ReadingOut,
    ReadingUpdate,
    SessionOut,
)
from server.repositories import reading_repository
from server.services import audit_service, book_service, edition_service, reading_lifecycle

NOTE_FIELDS = ("page", "percent")
CLOSING_EVENTS = (ReadingEventType.FINISHED.value, ReadingEventType.ABANDONED.value)


def _load_reading(db: Session, reading_id: int, user: User) -> Reading:
    reading = reading_repository.get_reading(db, reading_id)
    if reading is None or reading.user_id != user.id:
        raise NotFoundError(
            MessageKey.READING_NOT_FOUND, params={"reading_id": reading_id}, code=ErrorCode.READING_NOT_FOUND
        )
    return reading


def _load_note(db: Session, note_id: int, user: User) -> ReadingEvent:
    note = reading_repository.get_note(db, note_id)
    if note is None or note.user_id != user.id:
        raise NotFoundError(MessageKey.NOTE_NOT_FOUND, params={"note_id": note_id}, code=ErrorCode.NOTE_NOT_FOUND)
    return note


def _describe(entry: audit_service.AuditEntry, reading: Reading) -> None:
    entry.params.update({"book_id": reading.book_id, "title": reading.book.title})


def _reading_out(db: Session, reading_id: int) -> ReadingOut:
    db.expire_all()
    return ReadingOut.model_validate(reading_repository.get_reading(db, reading_id))


def _note_out(db: Session, note_id: int) -> ReadingEventOut:
    db.expire_all()
    return ReadingEventOut.model_validate(reading_repository.get_note(db, note_id))


def update_reading(db: Session, reading_id: int, form: ReadingUpdate, user: User) -> ReadingOut:
    params = {"username": user.username, "reading_id": reading_id}
    with audit_service.track(db, AuditAction.READING_UPDATE, actor=user, params=params) as entry:
        entry.set_entity("reading", reading_id)
        reading = _load_reading(db, reading_id, user)
        _describe(entry, reading)
        is_active = reading.state == ReadingState.ACTIVE.value
        if is_active and form.finished_at is not None:
            raise ValidationAppError(MessageKey.FINISHED_WHILE_ACTIVE, field="finished_at")
        if not is_active and form.finished_at is None:
            raise ValidationAppError(MessageKey.REQUIRED, field="finished_at")
        edition = (
            edition_service.load_for_book(db, form.edition_id, reading.book_id) if form.edition_id is not None else None
        )
        reading_lifecycle.check_progress(
            edition, form.current_page, form.current_percent, fields=("current_page", "current_percent")
        )
        reading.started_at = form.started_at
        reading.finished_at = form.finished_at
        reading.current_page = form.current_page
        reading.current_percent = form.current_percent
        for event in reading.events:
            if event.type == ReadingEventType.STARTED.value:
                event.occurred_at = form.started_at
            elif event.type in CLOSING_EVENTS and form.finished_at is not None:
                event.occurred_at = form.finished_at
        reading_lifecycle.set_edition(db, reading, edition, datetime.now(timezone.utc))
        db.flush()
    return _reading_out(db, reading_id)


def delete_reading(db: Session, reading_id: int, user: User) -> None:
    params = {"username": user.username, "reading_id": reading_id}
    with audit_service.track(db, AuditAction.READING_DELETE, actor=user, params=params) as entry:
        entry.set_entity("reading", reading_id)
        reading = _load_reading(db, reading_id, user)
        _describe(entry, reading)
        reading_repository.delete_reading(db, reading)


def create_note(db: Session, reading_id: int, form: NoteCreate, user: User) -> ReadingEventOut:
    params = {"username": user.username, "reading_id": reading_id}
    with audit_service.track(db, AuditAction.READING_NOTE_CREATE, actor=user, params=params) as entry:
        reading = _load_reading(db, reading_id, user)
        _describe(entry, reading)
        if form.session_id is not None and form.session_id not in {session.id for session in reading.sessions}:
            raise ValidationAppError(
                MessageKey.SESSION_NOT_FOUND, code=ErrorCode.SESSION_NOT_FOUND, field="session_id"
            )
        reading_lifecycle.check_progress(reading.edition, form.page, form.percent, fields=NOTE_FIELDS)
        note = reading_repository.add_event(
            db,
            ReadingEvent(
                user_id=user.id,
                book_id=reading.book_id,
                reading_id=reading.id,
                session_id=form.session_id,
                type=ReadingEventType.NOTE.value,
                content=form.content,
                page=form.page,
                percent=form.percent,
                occurred_at=datetime.now(timezone.utc),
            ),
        )
        entry.set_entity("reading_note", note.id)
        entry.params["note_id"] = note.id
    return _note_out(db, note.id)


def update_note(db: Session, note_id: int, form: NoteUpdate, user: User) -> ReadingEventOut:
    params = {"username": user.username, "note_id": note_id}
    with audit_service.track(db, AuditAction.READING_NOTE_UPDATE, actor=user, params=params) as entry:
        entry.set_entity("reading_note", note_id)
        note = _load_note(db, note_id, user)
        _describe(entry, note.reading)
        reading_lifecycle.check_progress(note.reading.edition, form.page, form.percent, fields=NOTE_FIELDS)
        note.content, note.page, note.percent = form.content, form.page, form.percent
        db.flush()
    return _note_out(db, note_id)


def delete_note(db: Session, note_id: int, user: User) -> None:
    params = {"username": user.username, "note_id": note_id}
    with audit_service.track(db, AuditAction.READING_NOTE_DELETE, actor=user, params=params) as entry:
        entry.set_entity("reading_note", note_id)
        note = _load_note(db, note_id, user)
        _describe(entry, note.reading)
        reading_repository.delete_event(db, note)


def _journey_reading(reading: Reading) -> JourneyReading:
    entries: list[JourneyEventEntry | JourneySessionEntry] = [
        JourneyEventEntry(at=event.occurred_at, event=ReadingEventOut.model_validate(event)) for event in reading.events
    ]
    entries += [
        JourneySessionEntry(at=session.started_at, session=SessionOut.model_validate(session))
        for session in reading.sessions
    ]
    entries.sort(key=lambda entry: entry.at)
    paged = [
        session
        for session in reading.sessions
        if session.duration_seconds is not None and session.start_page is not None and session.end_page is not None
    ]
    pages_read = sum(session.end_page - session.start_page for session in paged) if paged else None
    paged_seconds = sum(session.duration_seconds for session in paged)
    return JourneyReading(
        reading=ReadingOut.model_validate(reading),
        entries=entries,
        pages_read=pages_read,
        pages_per_hour=round(pages_read * 3600 / paged_seconds, 1) if pages_read is not None and paged_seconds else None,
    )


def get_journey(db: Session, book_id: int, user: User) -> JourneyOut:
    book_service.require_book(db, book_id)
    return JourneyOut(
        book_id=book_id,
        shelf_history=[
            ReadingEventOut.model_validate(event)
            for event in reading_repository.shelf_history(db, user.id, book_id)
        ],
        readings=[_journey_reading(reading) for reading in reading_repository.list_for_book(db, user.id, book_id)],
    )
