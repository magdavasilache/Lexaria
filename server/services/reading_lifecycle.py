from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from server.core.errors import ErrorCode, ValidationAppError
from server.core.message_keys import MessageKey
from server.database.models.edition import EDITION_PAGES_MAX, Edition
from server.database.models.reading import Reading, ReadingState
from server.database.models.reading_event import ReadingEvent, ReadingEventType
from server.database.models.reading_session import MAX_SESSION_HOURS, PERCENT_MAX, PERCENT_MIN
from server.database.models.user_book_status import ReadingStatus
from server.database.models.user_session import as_utc
from server.repositories import reading_repository, reading_status_repository

CENT = Decimal("0.01")


def _number(value: Decimal | int) -> int | float:
    return int(value) if value == int(value) else float(value)


def check_progress(
    edition: Edition | None,
    page: int | None,
    percent: Decimal | None,
    *,
    fields: tuple[str, str],
    min_page: int | None = None,
    min_percent: Decimal | None = None,
) -> None:
    page_field, percent_field = fields
    if edition is not None and page is not None and not edition.tracks_pages:
        raise ValidationAppError(MessageKey.PROGRESS_USE_PERCENT, field=page_field)
    if edition is not None and percent is not None and edition.tracks_pages:
        raise ValidationAppError(MessageKey.PROGRESS_USE_PAGE, field=percent_field)
    if page is not None:
        low, high = min_page or 0, edition.pages if edition is not None and edition.pages else EDITION_PAGES_MAX
        if not low <= page <= high:
            raise ValidationAppError(
                MessageKey.PAGE_OUT_OF_RANGE,
                params={"min": low, "max": high},
                code=ErrorCode.PROGRESS_OUT_OF_RANGE,
                field=page_field,
            )
    if percent is not None:
        low = min_percent if min_percent is not None else PERCENT_MIN
        if not low <= percent <= PERCENT_MAX:
            raise ValidationAppError(
                MessageKey.PERCENT_OUT_OF_RANGE,
                params={"min": _number(low), "max": _number(PERCENT_MAX)},
                code=ErrorCode.PROGRESS_OUT_OF_RANGE,
                field=percent_field,
            )


def _event(reading: Reading, event_type: ReadingEventType, at: datetime) -> ReadingEvent:
    return ReadingEvent(
        user_id=reading.user_id,
        book_id=reading.book_id,
        reading_id=reading.id,
        type=event_type.value,
        page=reading.current_page,
        percent=reading.current_percent,
        occurred_at=at,
    )


def record_shelved(db: Session, user_id: int, book_id: int, status: ReadingStatus, at: datetime) -> None:
    reading_repository.add_event(
        db,
        ReadingEvent(
            user_id=user_id, book_id=book_id, type=ReadingEventType.SHELVED.value, status=status.value, occurred_at=at
        ),
    )


def shelve(db: Session, user_id: int, book_id: int, status: ReadingStatus, at: datetime) -> None:
    previous = reading_status_repository.get_status(db, user_id, book_id)
    if previous is not None and previous.status == status.value:
        return
    reading_status_repository.set_status(db, user_id, book_id, status)
    record_shelved(db, user_id, book_id, status, at)
    apply_shelf(db, user_id, book_id, status, at)


def set_edition(db: Session, reading: Reading, edition: Edition | None, at: datetime) -> None:
    if reading.edition_id == (edition.id if edition else None):
        return
    reading.edition_id = edition.id if edition else None
    reading.edition = edition
    db.flush()
    reading_repository.add_event(db, _event(reading, ReadingEventType.EDITION_CHANGED, at))


def switch_edition(db: Session, reading: Reading, edition: Edition, at: datetime) -> None:
    if reading.edition_id == edition.id:
        return
    percent = reading.progress_percent
    if edition.tracks_pages:
        if percent is not None:
            reading.current_page = round(percent * edition.pages / 100)
        elif reading.current_page is not None:
            reading.current_page = min(reading.current_page, edition.pages)
        reading.current_percent = None
    else:
        reading.current_percent = Decimal(str(percent)).quantize(CENT) if percent is not None else None
        reading.current_page = None
    set_edition(db, reading, edition, at)


def close_running_session(db: Session, reading: Reading, at: datetime) -> None:
    session = reading_repository.get_running_session(db, reading.id)
    if session is None:
        return
    started_at = as_utc(session.started_at)
    end = min(as_utc(session.paused_at or at), started_at + timedelta(hours=MAX_SESSION_HOURS))
    session.duration_seconds = session.seconds_until(end)
    session.ended_at = end
    session.paused_at = None
    db.flush()


def start_reading(db: Session, user_id: int, book_id: int, at: datetime) -> Reading:
    reading = reading_repository.add_reading(db, Reading(user_id=user_id, book_id=book_id, started_at=at))
    reading_repository.add_event(db, _event(reading, ReadingEventType.STARTED, at))
    return reading


def finish_reading(db: Session, reading: Reading, at: datetime) -> None:
    close_running_session(db, reading, at)
    edition = reading.edition
    if edition is not None and edition.tracks_pages and edition.pages:
        reading.current_page, reading.current_percent = edition.pages, None
    else:
        reading.current_page, reading.current_percent = None, PERCENT_MAX
    _close(db, reading, ReadingState.FINISHED, ReadingEventType.FINISHED, at)


def abandon_reading(db: Session, reading: Reading, at: datetime) -> None:
    close_running_session(db, reading, at)
    _close(db, reading, ReadingState.ABANDONED, ReadingEventType.ABANDONED, at)


def drop_reading(db: Session, reading: Reading, at: datetime) -> None:
    if reading_repository.has_sessions(db, reading.id):
        abandon_reading(db, reading, at)
    else:
        reading_repository.delete_reading(db, reading)


def _close(db: Session, reading: Reading, state: ReadingState, event_type: ReadingEventType, at: datetime) -> None:
    reading.state = state.value
    reading.finished_at = max(at, as_utc(reading.started_at))
    db.flush()
    reading_repository.add_event(db, _event(reading, event_type, reading.finished_at))


def apply_shelf(db: Session, user_id: int, book_id: int, status: ReadingStatus | None, at: datetime) -> None:
    active = reading_repository.get_active_reading(db, user_id, book_id)
    if status == ReadingStatus.CURRENTLY_READING:
        if active is None:
            start_reading(db, user_id, book_id, at)
    elif active is None:
        return
    elif status == ReadingStatus.READ:
        finish_reading(db, active, at)
    elif status == ReadingStatus.DID_NOT_FINISH:
        abandon_reading(db, active, at)
    else:
        drop_reading(db, active, at)
