from collections import Counter, defaultdict
from collections.abc import Iterable, Sequence

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from server.database.models.book import Book
from server.database.models.genres import BookTag
from server.database.models.reader_signal import (
    TAG_MOODS,
    TAG_PACES,
    BookMoodVote,
    BookPaceVote,
    BookSignal,
    Mood,
    Pace,
    SignalKind,
)
from server.database.models.review import Review

PACE_ORDER = {pace.value: index for index, pace in enumerate(Pace)}

Signals = dict[int, dict[int, set[str]]]


def my_moods(db: Session, user_id: int, book_id: int) -> list[str]:
    return list(
        db.scalars(
            select(BookMoodVote.mood)
            .where(BookMoodVote.user_id == user_id, BookMoodVote.book_id == book_id)
            .order_by(BookMoodVote.mood)
        )
    )


def my_pace(db: Session, user_id: int, book_id: int) -> str | None:
    vote = db.get(BookPaceVote, (user_id, book_id))
    return vote.pace if vote else None


def signals_for(db: Session, book_id: int) -> Sequence[BookSignal]:
    return db.scalars(select(BookSignal).where(BookSignal.book_id == book_id)).all()


def replace_vote(db: Session, user_id: int, book_id: int, moods: Iterable[Mood], pace: Pace | None) -> None:
    delete_vote(db, user_id, book_id)
    db.add_all(BookMoodVote(user_id=user_id, book_id=book_id, mood=mood.value) for mood in moods)
    if pace is not None:
        db.add(BookPaceVote(user_id=user_id, book_id=book_id, pace=pace.value))
    db.flush()


def delete_vote(db: Session, user_id: int, book_id: int) -> bool:
    removed = 0
    for model in (BookMoodVote, BookPaceVote):
        result = db.execute(delete(model).where(model.user_id == user_id, model.book_id == book_id))
        removed += result.rowcount or 0
    db.flush()
    return removed > 0


def _explicit(db: Session, ids: set[int]) -> tuple[Signals, Signals]:
    moods: Signals = defaultdict(lambda: defaultdict(set))
    paces: Signals = defaultdict(lambda: defaultdict(set))
    for book_id, user_id, mood in db.execute(
        select(BookMoodVote.book_id, BookMoodVote.user_id, BookMoodVote.mood).where(BookMoodVote.book_id.in_(ids))
    ):
        moods[book_id][user_id].add(mood)
    for book_id, user_id, pace in db.execute(
        select(BookPaceVote.book_id, BookPaceVote.user_id, BookPaceVote.pace).where(BookPaceVote.book_id.in_(ids))
    ):
        paces[book_id][user_id].add(pace)
    return moods, paces


def _from_reviews(db: Session, ids: set[int]) -> tuple[Signals, Signals]:
    moods: Signals = defaultdict(lambda: defaultdict(set))
    paces: Signals = defaultdict(lambda: defaultdict(set))
    rows = db.execute(
        select(BookTag.book_id, Review.user_id, BookTag.tag)
        .join(Review, Review.id == BookTag.review_id)
        .where(BookTag.book_id.in_(ids), BookTag.tag.in_([*TAG_MOODS, *TAG_PACES]))
    )
    for book_id, user_id, tag in rows:
        if tag in TAG_MOODS:
            moods[book_id][user_id].add(TAG_MOODS[tag].value)
        if tag in TAG_PACES:
            paces[book_id][user_id].add(TAG_PACES[tag].value)
    return moods, paces


def _merge(explicit: dict[int, set[str]], derived: dict[int, set[str]]) -> dict[int, set[str]]:
    return {**derived, **explicit}


def _count(by_user: dict[int, set[str]]) -> Counter[str]:
    return Counter(value for values in by_user.values() for value in values)


def refresh(db: Session, book_ids: Iterable[int]) -> None:
    ids = set(book_ids)
    if not ids:
        return
    db.flush()
    explicit_moods, explicit_paces = _explicit(db, ids)
    derived_moods, derived_paces = _from_reviews(db, ids)
    db.execute(delete(BookSignal).where(BookSignal.book_id.in_(ids)))
    for book in db.scalars(select(Book).where(Book.id.in_(ids))):
        moods = _merge(explicit_moods.get(book.id, {}), derived_moods.get(book.id, {}))
        paces = _merge(explicit_paces.get(book.id, {}), derived_paces.get(book.id, {}))
        mood_counts = _count(moods)
        pace_counts = _count(paces)
        db.add_all(
            [
                *(BookSignal(book_id=book.id, kind=SignalKind.MOOD.value, value=mood, votes=votes)
                  for mood, votes in mood_counts.items()),
                *(BookSignal(book_id=book.id, kind=SignalKind.PACE.value, value=pace, votes=votes)
                  for pace, votes in pace_counts.items()),
            ]
        )
        book.mood_voters = sum(1 for values in moods.values() if values)
        book.pace = (
            min(pace_counts, key=lambda pace: (-pace_counts[pace], PACE_ORDER[pace])) if pace_counts else None
        )
    db.flush()
