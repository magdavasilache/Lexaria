from collections.abc import Sequence
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Row, exists, func, select
from sqlalchemy.orm import Session, selectinload

from server.database.models.book import Book
from server.database.models.reader_signal import BookMoodVote, BookPaceVote
from server.database.models.reading import Reading, ReadingState
from server.database.models.reading_session import ReadingSession
from server.database.models.review import Review
from server.database.models.user_book_status import ReadingStatus, UserBookStatus


def finished_readings(db: Session, user_id: int, start: datetime, end: datetime) -> Sequence[Reading]:
    return db.scalars(
        select(Reading)
        .options(
            selectinload(Reading.edition),
            selectinload(Reading.book).selectinload(Book.genres),
            selectinload(Reading.book).selectinload(Book.signals),
        )
        .where(
            Reading.user_id == user_id,
            Reading.state == ReadingState.FINISHED.value,
            Reading.finished_at >= start,
            Reading.finished_at < end,
        )
    ).all()


def ended_sessions(db: Session, user_id: int, start: datetime, end: datetime) -> Sequence[ReadingSession]:
    return db.scalars(
        select(ReadingSession)
        .options(selectinload(ReadingSession.reading).selectinload(Reading.edition))
        .where(
            ReadingSession.user_id == user_id,
            ReadingSession.ended_at.is_not(None),
            ReadingSession.started_at >= start,
            ReadingSession.started_at < end,
        )
    ).all()


def session_days(db: Session, user_id: int) -> Sequence[Row[tuple[datetime, int]]]:
    return db.execute(
        select(ReadingSession.started_at, ReadingSession.duration_seconds).where(
            ReadingSession.user_id == user_id, ReadingSession.ended_at.is_not(None)
        )
    ).all()


def own_ratings(db: Session, user_id: int, book_ids: set[int]) -> Sequence[Decimal]:
    if not book_ids:
        return []
    return db.scalars(
        select(Review.rating).where(
            Review.user_id == user_id, Review.book_id.in_(book_ids), Review.rating.is_not(None)
        )
    ).all()


def all_time_books(db: Session, user_id: int) -> int:
    finished = db.scalar(
        select(func.count()).where(Reading.user_id == user_id, Reading.state == ReadingState.FINISHED.value)
    )
    shelf_only = db.scalar(
        select(func.count())
        .select_from(UserBookStatus)
        .where(
            UserBookStatus.user_id == user_id,
            UserBookStatus.status == ReadingStatus.READ.value,
            ~exists().where(
                Reading.user_id == user_id,
                Reading.book_id == UserBookStatus.book_id,
                Reading.state == ReadingState.FINISHED.value,
            ),
        )
    )
    return int(finished or 0) + int(shelf_only or 0)


def first_activity(db: Session, user_id: int) -> datetime | None:
    starts = [
        db.scalar(select(func.min(Reading.started_at)).where(Reading.user_id == user_id)),
        db.scalar(select(func.min(ReadingSession.started_at)).where(ReadingSession.user_id == user_id)),
    ]
    present = [moment for moment in starts if moment is not None]
    return min(present) if present else None


def own_votes(db: Session, user_id: int, book_ids: set[int]) -> tuple[dict[int, set[str]], dict[int, str]]:
    if not book_ids:
        return {}, {}
    moods: dict[int, set[str]] = {}
    for book_id, mood in db.execute(
        select(BookMoodVote.book_id, BookMoodVote.mood).where(
            BookMoodVote.user_id == user_id, BookMoodVote.book_id.in_(book_ids)
        )
    ):
        moods.setdefault(book_id, set()).add(mood)
    paces = dict(
        db.execute(
            select(BookPaceVote.book_id, BookPaceVote.pace).where(
                BookPaceVote.user_id == user_id, BookPaceVote.book_id.in_(book_ids)
            )
        ).all()
    )
    return moods, paces
