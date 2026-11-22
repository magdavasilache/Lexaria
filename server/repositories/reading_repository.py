from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session, selectinload

from server.database.models.edition import Edition
from server.database.models.reading import Reading, ReadingState
from server.database.models.reading_event import ReadingEvent, ReadingEventType
from server.database.models.reading_session import ReadingSession


def _reading_options():
    return (selectinload(Reading.edition).selectinload(Edition.language), selectinload(Reading.book))


def _session_options():
    return (
        selectinload(ReadingSession.reading).selectinload(Reading.edition).selectinload(Edition.language),
        selectinload(ReadingSession.reading).selectinload(Reading.book),
    )


def get_active_reading(db: Session, user_id: int, book_id: int) -> Reading | None:
    return db.scalar(
        select(Reading)
        .options(*_reading_options())
        .where(
            Reading.user_id == user_id,
            Reading.book_id == book_id,
            Reading.state == ReadingState.ACTIVE.value,
        )
    )


def get_reading(db: Session, reading_id: int) -> Reading | None:
    return db.scalar(select(Reading).options(*_reading_options()).where(Reading.id == reading_id))


def list_for_book(db: Session, user_id: int, book_id: int) -> Sequence[Reading]:
    return db.scalars(
        select(Reading)
        .options(*_reading_options(), selectinload(Reading.sessions), selectinload(Reading.events))
        .where(Reading.user_id == user_id, Reading.book_id == book_id)
        .order_by(Reading.started_at.desc(), Reading.id.desc())
    ).all()


def add_reading(db: Session, reading: Reading) -> Reading:
    db.add(reading)
    db.flush()
    return reading


def delete_reading(db: Session, reading: Reading) -> None:
    db.delete(reading)
    db.flush()


def get_session(db: Session, session_id: int) -> ReadingSession | None:
    return db.scalar(select(ReadingSession).options(*_session_options()).where(ReadingSession.id == session_id))


def get_running_session(db: Session, reading_id: int) -> ReadingSession | None:
    return db.scalar(
        select(ReadingSession).where(ReadingSession.reading_id == reading_id, ReadingSession.ended_at.is_(None))
    )


def get_user_running_session(db: Session, user_id: int) -> ReadingSession | None:
    return db.scalar(
        select(ReadingSession)
        .options(*_session_options())
        .where(ReadingSession.user_id == user_id, ReadingSession.ended_at.is_(None))
    )


def has_sessions(db: Session, reading_id: int) -> bool:
    return bool(db.scalar(select(exists().where(ReadingSession.reading_id == reading_id))))


def add_session(db: Session, session: ReadingSession) -> ReadingSession:
    db.add(session)
    db.flush()
    return session


def delete_session(db: Session, session: ReadingSession) -> None:
    db.delete(session)
    db.flush()


def add_event(db: Session, event: ReadingEvent) -> ReadingEvent:
    db.add(event)
    db.flush()
    return event


def get_note(db: Session, note_id: int) -> ReadingEvent | None:
    return db.scalar(
        select(ReadingEvent)
        .options(
            selectinload(ReadingEvent.reading).selectinload(Reading.edition),
            selectinload(ReadingEvent.reading).selectinload(Reading.book),
        )
        .where(ReadingEvent.id == note_id, ReadingEvent.type == ReadingEventType.NOTE.value)
    )


def delete_event(db: Session, event: ReadingEvent) -> None:
    db.delete(event)
    db.flush()


def shelf_history(db: Session, user_id: int, book_id: int) -> Sequence[ReadingEvent]:
    return db.scalars(
        select(ReadingEvent)
        .where(
            ReadingEvent.user_id == user_id,
            ReadingEvent.book_id == book_id,
            ReadingEvent.reading_id.is_(None),
        )
        .order_by(ReadingEvent.occurred_at, ReadingEvent.id)
    ).all()


def completed_seconds_since(db: Session, user_id: int, since: datetime) -> int:
    return int(
        db.scalar(
            select(func.coalesce(func.sum(ReadingSession.duration_seconds), 0)).where(
                ReadingSession.user_id == user_id,
                ReadingSession.ended_at.is_not(None),
                ReadingSession.started_at >= since,
            )
        )
    )
