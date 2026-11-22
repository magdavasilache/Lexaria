from sqlalchemy.orm import Session

from server.database.models.book import Book
from server.database.models.reader_signal import MOOD_MIN_SHARE, TOP_MOODS_SHOWN, Mood, Pace, SignalKind
from server.database.models.user import User
from server.database.models.user_book_status import ReadingStatus
from server.database.schemas.reader_signal import MoodShare, PaceShare, ReaderSignalsOut
from server.repositories import reader_signal_repository, reading_status_repository

VOTING_STATUSES = frozenset({ReadingStatus.CURRENTLY_READING, ReadingStatus.READ, ReadingStatus.DID_NOT_FINISH})


def _share(votes: int, total: int) -> float:
    return round(votes / total, 4) if total else 0.0


def can_vote(db: Session, user: User, book_id: int) -> bool:
    status = reading_status_repository.get_status(db, user.id, book_id)
    return status is not None and status.status in VOTING_STATUSES


def top_moods(book: Book) -> list[Mood]:
    moods = [
        signal
        for signal in book.signals
        if signal.kind == SignalKind.MOOD and signal.votes >= MOOD_MIN_SHARE * book.mood_voters
    ]
    moods.sort(key=lambda signal: (-signal.votes, signal.value))
    return [Mood(signal.value) for signal in moods[:TOP_MOODS_SHOWN]]


def signals_out(db: Session, book: Book, user: User) -> ReaderSignalsOut:
    signals = reader_signal_repository.signals_for(db, book.id)
    moods = sorted(
        (signal for signal in signals if signal.kind == SignalKind.MOOD), key=lambda signal: (-signal.votes, signal.value)
    )
    paces = {signal.value: signal.votes for signal in signals if signal.kind == SignalKind.PACE}
    pace_total = sum(paces.values())
    my_pace = reader_signal_repository.my_pace(db, user.id, book.id)
    return ReaderSignalsOut(
        moods=[
            MoodShare(mood=Mood(signal.value), votes=signal.votes, share=_share(signal.votes, book.mood_voters))
            for signal in moods
        ],
        paces=[PaceShare(pace=pace, votes=paces.get(pace, 0), share=_share(paces.get(pace, 0), pace_total)) for pace in Pace],
        pace=Pace(book.pace) if book.pace else None,
        mood_voters=book.mood_voters,
        my_moods=[Mood(mood) for mood in reader_signal_repository.my_moods(db, user.id, book.id)],
        my_pace=Pace(my_pace) if my_pace else None,
        can_vote=can_vote(db, user, book.id),
    )
