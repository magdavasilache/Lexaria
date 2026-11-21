from collections.abc import Iterable, Sequence
from decimal import Decimal

from sqlalchemy import ColumnElement, case, func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from server.database.models.book import RATING_MAX, Book
from server.database.models.genres import Genre
from server.database.models.review import Review
from server.database.models.user_book_status import UserBookStatus
from server.database.schemas.book import BookListQuery, BookSort

_RATING_STEP = Decimal("0.01")


def _conditions(query: BookListQuery) -> list[ColumnElement[bool]]:
    conditions: list[ColumnElement[bool]] = []
    if query.q:
        conditions.append(Book.title.icontains(query.q, autoescape=True))
    if query.genre_ids:
        conditions.append(Book.genres.any(Genre.id.in_(query.genre_ids)))
    if query.author_ids:
        conditions.append(Book.author_id.in_(query.author_ids))
    if query.language_ids:
        conditions.append(Book.language_id.in_(query.language_ids))
    if query.min_rating is not None:
        conditions.append(Book.average_rating >= query.min_rating)
    return conditions


def _ordering(sort: BookSort) -> tuple:
    if sort == BookSort.RATING:
        return Book.average_rating.desc().nulls_last(), Book.ratings_count.desc(), Book.id
    if sort == BookSort.NEWEST:
        return Book.created_at.desc(), Book.id.desc()
    return func.lower(Book.title), Book.id


def list_books(db: Session, query: BookListQuery) -> tuple[Sequence[Book], int]:
    conditions = _conditions(query)
    total = db.scalar(select(func.count()).select_from(Book).where(*conditions)) or 0
    statement = (
        select(Book)
        .options(joinedload(Book.author), joinedload(Book.language), selectinload(Book.genres))
        .where(*conditions)
        .order_by(*_ordering(query.sort))
        .offset(query.offset)
        .limit(query.limit)
    )
    return db.scalars(statement).all(), total


def get_book(db: Session, book_id: int) -> Book | None:
    statement = (
        select(Book)
        .options(
            joinedload(Book.author),
            joinedload(Book.language),
            joinedload(Book.country),
            selectinload(Book.genres),
            selectinload(Book.awards),
        )
        .where(Book.id == book_id)
    )
    return db.scalars(statement).first()


def get_user_status(db: Session, user_id: int, book_id: int) -> UserBookStatus | None:
    return db.get(UserBookStatus, (user_id, book_id))


def rating_histogram(db: Session, book_id: int) -> dict[int, int]:
    bucket = case(
        *((Review.rating >= stars, stars) for stars in range(RATING_MAX, 1, -1)),
        else_=1,
    )
    rows = db.execute(
        select(bucket, func.count())
        .where(Review.book_id == book_id, Review.rating.is_not(None))
        .group_by(bucket)
    ).all()
    return {int(stars): count for stars, count in rows}


def find_missing_ids(db: Session, model: type, ids: Iterable[int]) -> list[int]:
    wanted = set(ids)
    if not wanted:
        return []
    found = set(db.scalars(select(model.id).where(model.id.in_(wanted))))
    return sorted(wanted - found)


def get_many(db: Session, model: type, ids: Sequence[int]) -> list:
    if not ids:
        return []
    by_id = {item.id: item for item in db.scalars(select(model).where(model.id.in_(ids)))}
    return [by_id[item_id] for item_id in ids if item_id in by_id]


def find_by_titles(db: Session, titles: Iterable[str]) -> dict[str, Book]:
    lowered = {title.lower() for title in titles}
    if not lowered:
        return {}
    books = db.scalars(select(Book).where(func.lower(Book.title).in_(lowered)).order_by(Book.id))
    found: dict[str, Book] = {}
    for book in books:
        found.setdefault(book.title.lower(), book)
    return found


def refresh_ratings(db: Session, book_ids: Iterable[int]) -> None:
    ids = set(book_ids)
    if not ids:
        return
    db.flush()
    stats = {
        book_id: (average, count)
        for book_id, average, count in db.execute(
            select(Review.book_id, func.avg(Review.rating), func.count(Review.rating))
            .where(Review.book_id.in_(ids), Review.rating.is_not(None))
            .group_by(Review.book_id)
        )
    }
    for book in db.scalars(select(Book).where(Book.id.in_(ids))):
        average, count = stats.get(book.id, (None, 0))
        book.average_rating = Decimal(str(average)).quantize(_RATING_STEP) if count else None
        book.ratings_count = count
    db.flush()


def add_book(db: Session, book: Book) -> Book:
    db.add(book)
    db.flush()
    return book


def delete_book(db: Session, book: Book) -> None:
    db.delete(book)
    db.flush()
