from collections.abc import Iterable, Sequence
from decimal import Decimal

from sqlalchemy import ColumnElement, case, exists, func, literal, literal_column, or_, select, text
from sqlalchemy.orm import Session, joinedload, selectinload

from server.database.models.author import Author
from server.database.models.book import RATING_MAX, Book, BookDescription
from server.database.models.content_warning import BookContentWarning
from server.database.models.edition import Edition
from server.database.models.genres import BookTag, Genre
from server.database.models.language import Language
from server.database.models.reader_signal import MOOD_MIN_SHARE, BookSignal, Mood, SignalKind
from server.database.models.review import Review
from server.database.schemas.book import BookListQuery, BookSort
from server.database.schemas.edition import normalize_isbn

_RATING_STEP = Decimal("0.01")
SEARCH_SIMILARITY_THRESHOLD = 0.45
_AUTHOR_WEIGHT = 0.9
_SYNOPSIS_WEIGHT = 0.4
_TEXT_SEARCH_CONFIG = literal_column("'simple'::regconfig")


def search_key(expression: ColumnElement) -> ColumnElement[str]:
    return func.f_unaccent(func.lower(expression))


def _like_pattern(value: str) -> ColumnElement[str]:
    escaped = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return literal("%") + search_key(literal(escaped)) + literal("%")


class _Search:
    def __init__(self, q: str) -> None:
        needle = search_key(literal(q))
        pattern = _like_pattern(q)
        title = search_key(Book.title)
        author = search_key(Author.full_name)
        synopsis = func.to_tsvector(_TEXT_SEARCH_CONFIG, func.f_unaccent(BookDescription.synopsis))
        words = func.websearch_to_tsquery(_TEXT_SEARCH_CONFIG, needle)
        isbn = normalize_isbn(q)

        author_ids = select(Author.id).where(or_(author.like(pattern), needle.op("<%")(author)))
        in_synopsis = exists().where(BookDescription.book_id == Book.id, synopsis.op("@@")(words))
        has_isbn = exists().where(Edition.book_id == Book.id, Edition.isbn == isbn) if isbn else None

        matches = [title.like(pattern), needle.op("<%")(title), Book.author_id.in_(author_ids), in_synopsis]
        author_score = (
            select(func.word_similarity(needle, author)).where(Author.id == Book.author_id).scalar_subquery()
        )
        scores = [
            func.word_similarity(needle, title),
            func.coalesce(author_score, 0) * _AUTHOR_WEIGHT,
            case((in_synopsis, _SYNOPSIS_WEIGHT), else_=0),
        ]
        if has_isbn is not None:
            matches.append(has_isbn)
            scores.append(case((has_isbn, 1), else_=0))
        self.condition: ColumnElement[bool] = or_(*matches)
        self.score: ColumnElement[float] = func.greatest(*scores)


def _conditions(query: BookListQuery, search: _Search | None) -> list[ColumnElement[bool]]:
    conditions: list[ColumnElement[bool]] = []
    if search is not None:
        conditions.append(search.condition)
    if query.genre_ids:
        conditions.append(Book.genres.any(Genre.id.in_(query.genre_ids)))
    if query.author_ids:
        conditions.append(Book.author_id.in_(query.author_ids))
    if query.language_ids:
        conditions.append(Book.language_id.in_(query.language_ids))
    if query.min_rating is not None:
        conditions.append(Book.average_rating >= query.min_rating)
    conditions.extend(_has_mood(mood) for mood in query.moods)
    if query.avoid_warnings:
        avoided = [warning.value for warning in query.avoid_warnings]
        conditions.append(
            ~exists().where(BookContentWarning.book_id == Book.id, BookContentWarning.warning.in_(avoided))
        )
    if query.paces:
        conditions.append(Book.pace.in_([pace.value for pace in query.paces]))
    if query.min_pages is not None:
        conditions.append(Book.pages >= query.min_pages)
    if query.max_pages is not None:
        conditions.append(Book.pages <= query.max_pages)
    return conditions


def _has_mood(mood: Mood) -> ColumnElement[bool]:
    return exists().where(
        BookSignal.book_id == Book.id,
        BookSignal.kind == SignalKind.MOOD.value,
        BookSignal.value == mood.value,
        BookSignal.votes >= Book.mood_voters * MOOD_MIN_SHARE,
    )


def _ordering(sort: BookSort, search: _Search | None) -> tuple:
    if sort == BookSort.RELEVANCE and search is not None:
        return search.score.desc(), Book.ratings_count.desc(), Book.id
    if sort == BookSort.RATING:
        return Book.average_rating.desc().nulls_last(), Book.ratings_count.desc(), Book.id
    if sort == BookSort.NEWEST:
        return Book.created_at.desc(), Book.id.desc()
    return func.lower(Book.title), Book.id


def list_books(db: Session, query: BookListQuery) -> tuple[Sequence[Book], int]:
    search = _Search(query.q) if query.q else None
    if search is not None:
        db.execute(text(f"SET LOCAL pg_trgm.word_similarity_threshold = {SEARCH_SIMILARITY_THRESHOLD}"))
    conditions = _conditions(query, search)
    total = db.scalar(select(func.count()).select_from(Book).where(*conditions)) or 0
    statement = (
        select(Book)
        .options(
            joinedload(Book.author),
            joinedload(Book.language),
            selectinload(Book.genres),
            selectinload(Book.descriptions),
            selectinload(Book.signals),
        )
        .where(*conditions)
        .order_by(*_ordering(query.sort, search))
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
            selectinload(Book.descriptions),
        )
        .where(Book.id == book_id)
    )
    return db.scalars(statement).first()


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


def reader_tags(db: Session, book_id: int, limit: int) -> list[tuple[str, int]]:
    mentions = func.count(func.distinct(BookTag.review_id))
    rows = db.execute(
        select(BookTag.tag, mentions)
        .where(BookTag.book_id == book_id, BookTag.review_id.is_not(None))
        .group_by(BookTag.tag)
        .order_by(mentions.desc(), BookTag.tag)
        .limit(limit)
    ).all()
    return [(tag, count) for tag, count in rows]


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


def find_author_by_name(db: Session, name: str) -> Author | None:
    return db.scalars(
        select(Author).where(search_key(Author.full_name) == search_key(literal(name))).order_by(Author.id)
    ).first()


def find_language_by_names(db: Session, names: Iterable[str]) -> Language | None:
    lowered = [name.lower() for name in names]
    if not lowered:
        return None
    return db.scalars(select(Language).where(func.lower(Language.name).in_(lowered)).order_by(Language.id)).first()


def find_genres_by_names(db: Session, names: Iterable[str]) -> list[Genre]:
    lowered = {name.lower() for name in names}
    if not lowered:
        return []
    return list(db.scalars(select(Genre).where(func.lower(Genre.name).in_(lowered)).order_by(Genre.name)))


def find_book_by_title_and_author(db: Session, title: str, author_id: int) -> Book | None:
    return db.scalars(
        select(Book)
        .where(Book.author_id == author_id, search_key(Book.title) == search_key(literal(title)))
        .order_by(Book.id)
    ).first()


def find_book_id_by_isbn(db: Session, isbn: str) -> int | None:
    return db.scalar(select(Edition.book_id).where(Edition.isbn == isbn))
