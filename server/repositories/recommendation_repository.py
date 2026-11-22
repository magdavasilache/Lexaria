from collections.abc import Iterable, Sequence
from decimal import Decimal

from sqlalchemy import func, select, union
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session, joinedload, selectinload

from server.database.models.book import Book
from server.database.models.book_embedding import BookEmbedding
from server.database.models.genres import user_genres
from server.database.models.reader_signal import BookMoodVote
from server.database.models.reading import Reading, ReadingState
from server.database.models.review import Review
from server.database.models.user_book_status import ReadingStatus, UserBookStatus


def catalog(db: Session) -> Sequence[Book]:
    return db.scalars(
        select(Book)
        .options(
            joinedload(Book.author),
            joinedload(Book.language),
            selectinload(Book.genres),
            selectinload(Book.descriptions),
            selectinload(Book.signals),
        )
        .order_by(Book.id)
    ).all()


def embeddings(db: Session) -> dict[int, BookEmbedding]:
    return {row.book_id: row for row in db.scalars(select(BookEmbedding))}


def save_embeddings(db: Session, rows: Iterable[BookEmbedding]) -> None:
    values = [
        {
            "book_id": row.book_id,
            "model": row.model,
            "text_hash": row.text_hash,
            "dimensions": row.dimensions,
            "vector": row.vector,
        }
        for row in rows
    ]
    if not values:
        return
    statement = insert(BookEmbedding).values(values)
    db.execute(
        statement.on_conflict_do_update(
            index_elements=[BookEmbedding.book_id],
            set_={
                "model": statement.excluded.model,
                "text_hash": statement.excluded.text_hash,
                "dimensions": statement.excluded.dimensions,
                "vector": statement.excluded.vector,
                "updated_at": func.now(),
            },
        )
    )


def ratings(db: Session, user_id: int) -> dict[int, Decimal]:
    return dict(
        db.execute(
            select(Review.book_id, Review.rating).where(Review.user_id == user_id, Review.rating.is_not(None))
        ).all()
    )


def finished_book_ids(db: Session, user_id: int) -> set[int]:
    finished = select(Reading.book_id).where(Reading.user_id == user_id, Reading.state == ReadingState.FINISHED.value)
    read = select(UserBookStatus.book_id).where(
        UserBookStatus.user_id == user_id, UserBookStatus.status == ReadingStatus.READ.value
    )
    return set(db.scalars(union(finished, read)))


def seen_book_ids(db: Session, user_id: int) -> set[int]:
    return set(
        db.scalars(
            union(
                select(UserBookStatus.book_id).where(UserBookStatus.user_id == user_id),
                select(Reading.book_id).where(Reading.user_id == user_id),
                select(Review.book_id).where(Review.user_id == user_id),
            )
        )
    )


def favourite_genre_ids(db: Session, user_id: int) -> set[int]:
    return set(db.scalars(select(user_genres.c.genre_id).where(user_genres.c.user_id == user_id)))


def mood_votes(db: Session, user_id: int) -> dict[int, set[str]]:
    votes: dict[int, set[str]] = {}
    for book_id, mood in db.execute(
        select(BookMoodVote.book_id, BookMoodVote.mood).where(BookMoodVote.user_id == user_id)
    ):
        votes.setdefault(book_id, set()).add(mood)
    return votes
