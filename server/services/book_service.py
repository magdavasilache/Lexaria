from collections.abc import Sequence

from sqlalchemy.orm import Session

from server.core.errors import ErrorCode, NotFoundError, ValidationAppError
from server.core.message_keys import MessageKey
from server.database.models.audit_log import AuditAction
from server.database.models.author import Author
from server.database.models.award import Award
from server.database.models.book import BOOK_IMAGES_MAX, RATING_MAX, Book
from server.database.models.country import Country
from server.database.models.genres import Genre
from server.database.models.language import Language
from server.database.models.user import User
from server.database.schemas.book import (
    AwardRef,
    BookCreate,
    BookDetail,
    BookListItem,
    BookListQuery,
    BookUpdate,
    RatingBucket,
)
from server.database.schemas.genre import GenreOut
from server.database.schemas.user_book_status import UserBookStatusOut
from server.repositories import book_repository
from server.services import audit_service
from server.services.book_images import delete_book_images, image_url, save_book_images

_REFERENCES: tuple[tuple[str, type, MessageKey, ErrorCode], ...] = (
    ("author_id", Author, MessageKey.AUTHOR_NOT_FOUND, ErrorCode.AUTHOR_NOT_FOUND),
    ("language_id", Language, MessageKey.LANGUAGE_NOT_FOUND, ErrorCode.LANGUAGE_NOT_FOUND),
    ("country_id", Country, MessageKey.COUNTRY_NOT_FOUND, ErrorCode.COUNTRY_NOT_FOUND),
)


def _author_name(book: Book) -> str | None:
    if book.author is None:
        return None
    return " ".join(part for part in (book.author.first_name, book.author.last_name) if part)


def _rating(book: Book) -> float | None:
    return float(book.average_rating) if book.average_rating is not None else None


def _list_item(book: Book) -> BookListItem:
    return BookListItem(
        id=book.id,
        title=book.title,
        author_name=_author_name(book),
        language_name=book.language.name if book.language else None,
        cover_url=image_url(book.images[0]) if book.images else None,
        pages=book.pages,
        synopsis=book.synopsis,
        genres=[GenreOut.model_validate(genre) for genre in book.genres],
        average_rating=_rating(book),
        ratings_count=book.ratings_count,
    )


def _detail(db: Session, book: Book, user: User) -> BookDetail:
    histogram = book_repository.rating_histogram(db, book.id)
    status = book_repository.get_user_status(db, user.id, book.id)
    return BookDetail(
        id=book.id,
        title=book.title,
        author_id=book.author_id,
        author_name=_author_name(book),
        language_id=book.language_id,
        language_name=book.language.name if book.language else None,
        country_id=book.country_id,
        country_name=book.country.name if book.country else None,
        images=list(book.images),
        image_urls=[image_url(name) for name in book.images],
        pages=book.pages,
        published_at=book.published_at,
        synopsis=book.synopsis,
        settings=list(book.settings),
        characters=list(book.characters),
        is_series=book.is_series,
        genres=[GenreOut.model_validate(genre) for genre in book.genres],
        awards=[AwardRef.model_validate(award) for award in book.awards],
        average_rating=_rating(book),
        ratings_count=book.ratings_count,
        rating_histogram=[
            RatingBucket(stars=stars, count=histogram.get(stars, 0)) for stars in range(RATING_MAX, 0, -1)
        ],
        user_book_status=UserBookStatusOut.model_validate(status) if status else None,
        created_at=book.created_at,
        updated_at=book.updated_at,
    )


def _book_not_found(book_id: int) -> NotFoundError:
    return NotFoundError(MessageKey.BOOK_NOT_FOUND, params={"book_id": book_id}, code=ErrorCode.BOOK_NOT_FOUND)


def _load(db: Session, book_id: int) -> Book:
    book = book_repository.get_book(db, book_id)
    if book is None:
        raise _book_not_found(book_id)
    return book


def _check_references(db: Session, form: BookCreate) -> None:
    for field, model, key, code in _REFERENCES:
        value = getattr(form, field)
        if value is not None and book_repository.find_missing_ids(db, model, [value]):
            raise ValidationAppError(key, code=code, field=field)


def _load_many(db: Session, model: type, ids: Sequence[int], key: MessageKey, code: ErrorCode, field: str) -> list:
    items = book_repository.get_many(db, model, ids)
    if len(items) != len(ids):
        missing = sorted(set(ids) - {item.id for item in items})
        raise ValidationAppError(key, params={"ids": ", ".join(map(str, missing))}, code=code, field=field)
    return items


def _apply(db: Session, book: Book, form: BookCreate) -> None:
    _check_references(db, form)
    book.title = form.title
    book.author_id = form.author_id
    book.language_id = form.language_id
    book.country_id = form.country_id
    book.pages = form.pages
    book.published_at = form.published_at
    book.synopsis = form.synopsis
    book.is_series = form.is_series
    book.settings = list(form.settings)
    book.characters = list(form.characters)
    book.genres = _load_many(
        db, Genre, form.genre_ids, MessageKey.GENRES_NOT_FOUND, ErrorCode.GENRE_NOT_FOUND, "genre_ids"
    )
    book.awards = _load_many(
        db, Award, form.award_ids, MessageKey.AWARDS_NOT_FOUND, ErrorCode.AWARD_NOT_FOUND, "award_ids"
    )


def list_books(db: Session, query: BookListQuery) -> tuple[list[BookListItem], int]:
    books, total = book_repository.list_books(db, query)
    return [_list_item(book) for book in books], total


def get_book(db: Session, book_id: int, user: User) -> BookDetail:
    return _detail(db, _load(db, book_id), user)


def create_book(db: Session, form: BookCreate, user: User) -> BookDetail:
    saved: list[str] = []
    params = {"username": user.username, "title": form.title}
    try:
        with audit_service.track(db, AuditAction.BOOK_CREATE, actor=user, params=params) as entry:
            book = Book(created_by_id=user.id)
            _apply(db, book, form)
            saved = save_book_images(form.images)
            book.images = saved
            book_repository.add_book(db, book)
            entry.set_entity("book", book.id)
    except BaseException:
        delete_book_images(saved)
        raise
    return get_book(db, book.id, user)


def _check_images(book: Book, form: BookUpdate) -> None:
    for name in form.kept_images:
        if name not in book.images:
            raise ValidationAppError(
                MessageKey.IMAGE_NOT_ON_BOOK,
                params={"filename": name},
                code=ErrorCode.IMAGE_NOT_ON_BOOK,
                field="kept_images",
            )
    if len(form.kept_images) + len(form.images) > BOOK_IMAGES_MAX:
        raise ValidationAppError(
            MessageKey.TOO_MANY_IMAGES,
            params={"max": BOOK_IMAGES_MAX},
            code=ErrorCode.TOO_MANY_IMAGES,
            field="images",
        )


def update_book(db: Session, book_id: int, form: BookUpdate, user: User) -> BookDetail:
    saved: list[str] = []
    removed: list[str] = []
    params = {"username": user.username, "book_id": book_id}
    try:
        with audit_service.track(db, AuditAction.BOOK_UPDATE, actor=user, params=params) as entry:
            entry.set_entity("book", book_id)
            book = _load(db, book_id)
            _check_images(book, form)
            _apply(db, book, form)
            entry.params["title"] = book.title
            saved = save_book_images(form.images)
            removed = [name for name in book.images if name not in form.kept_images]
            book.images = [*form.kept_images, *saved]
            db.flush()
    except BaseException:
        delete_book_images(saved)
        raise
    delete_book_images(removed)
    db.expire_all()
    return get_book(db, book_id, user)


def delete_book(db: Session, book_id: int, user: User) -> None:
    params = {"username": user.username, "book_id": book_id}
    with audit_service.track(db, AuditAction.BOOK_DELETE, actor=user, params=params) as entry:
        entry.set_entity("book", book_id)
        book = _load(db, book_id)
        entry.params["title"] = book.title
        images = list(book.images)
        book_repository.delete_book(db, book)
    delete_book_images(images)
