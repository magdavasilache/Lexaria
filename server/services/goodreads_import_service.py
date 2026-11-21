import json
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from sqlalchemy import func, insert, select
from sqlalchemy.orm import Session
from starlette.datastructures import UploadFile

from server.core.errors import ErrorCode, ValidationAppError
from server.core.message_keys import MessageKey, render_english
from server.core.responses import ApiWarning
from server.database.models.audit_log import AuditAction
from server.database.models.book import RATING_MAX, RATING_MIN, TITLE_MAX_LENGTH, Book
from server.database.models.genres import Genre, user_genres
from server.database.models.review import Review
from server.database.models.user import User
from server.database.models.user_book_status import UserBookStatus
from server.database.schemas.goodreads_import import (
    IMPORT_FILE_MAX_BYTES,
    GoodreadsImportForm,
    GoodreadsImportSummary,
)
from server.repositories import book_repository
from server.services import audit_service

GENRE_NAME_MAX_LENGTH = 100
GOODREADS_STATUSES = {
    "to-read": "want_to_read",
    "currently-reading": "currently_reading",
    "read": "read",
}
GOODREADS_DATE_FORMATS = ("%Y-%m-%d %H:%M:%S %Z", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d")
NOT_PROVIDED = "(not provided)"


@dataclass(frozen=True)
class ImportRow:
    number: int
    title: str
    status: str
    rating: Decimal | None
    review: str | None
    started: date


@dataclass
class ImportResult:
    summary: GoodreadsImportSummary
    warnings: list[ApiWarning] = field(default_factory=list)


class RowError(Exception):
    def __init__(self, key: MessageKey) -> None:
        self.key = key


def _read_json(upload: UploadFile, field_name: str) -> Any:
    filename = upload.filename or field_name
    if Path(filename).suffix.lower() != ".json":
        raise ValidationAppError(
            MessageKey.IMPORT_FILE_TYPE, params={"filename": filename}, code=ErrorCode.IMPORT_INVALID_FILE, field=field_name
        )
    content = upload.file.read(IMPORT_FILE_MAX_BYTES + 1)
    if len(content) > IMPORT_FILE_MAX_BYTES:
        raise ValidationAppError(
            MessageKey.IMPORT_FILE_TOO_LARGE,
            params={"filename": filename, "max_mb": IMPORT_FILE_MAX_BYTES // (1024 * 1024)},
            code=ErrorCode.IMPORT_INVALID_FILE,
            field=field_name,
        )
    try:
        return json.loads(content)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValidationAppError(
            MessageKey.IMPORT_INVALID_JSON, params={"filename": filename}, code=ErrorCode.IMPORT_INVALID_FILE, field=field_name
        ) from None


def _unexpected_structure(upload: UploadFile, field_name: str) -> ValidationAppError:
    return ValidationAppError(
        MessageKey.IMPORT_UNEXPECTED_STRUCTURE,
        params={"filename": upload.filename or field_name},
        code=ErrorCode.IMPORT_INVALID_FILE,
        field=field_name,
    )


def _genre_names(data: Any, upload: UploadFile) -> list[str]:
    if not isinstance(data, list) or not data or not isinstance(data[0], dict):
        raise _unexpected_structure(upload, "favorite_genres")
    raw = data[0].get("genres") or ""
    if not isinstance(raw, str):
        raise _unexpected_structure(upload, "favorite_genres")
    names = (name.strip()[:GENRE_NAME_MAX_LENGTH] for name in raw.split(","))
    return list(dict.fromkeys(name for name in names if name))


def _parse_date(value: Any) -> date:
    if value in (None, ""):
        return date.today()
    if isinstance(value, str):
        for pattern in GOODREADS_DATE_FORMATS:
            try:
                return datetime.strptime(value.strip(), pattern).date()
            except ValueError:
                continue
    raise RowError(MessageKey.IMPORT_ROW_INVALID_DATE)


def _parse_rating(value: Any) -> Decimal | None:
    if value in (None, "", 0, "0"):
        return None
    try:
        rating = Decimal(str(value))
    except InvalidOperation:
        raise RowError(MessageKey.IMPORT_ROW_INVALID_RATING) from None
    if not RATING_MIN < rating <= RATING_MAX:
        raise RowError(MessageKey.IMPORT_ROW_INVALID_RATING)
    return rating


def _parse_row(number: int, raw: Any) -> ImportRow:
    if not isinstance(raw, dict):
        raise RowError(MessageKey.IMPORT_ROW_MISSING_TITLE)
    title = raw.get("book")
    if not isinstance(title, str) or not title.strip():
        raise RowError(MessageKey.IMPORT_ROW_MISSING_TITLE)
    status = GOODREADS_STATUSES.get(str(raw.get("read_status") or "").strip().lower())
    if status is None:
        raise RowError(MessageKey.IMPORT_ROW_INVALID_STATUS)
    review = raw.get("review")
    review_text = review.strip() if isinstance(review, str) and review.strip() != NOT_PROVIDED else None
    return ImportRow(
        number=number,
        title=title.strip()[:TITLE_MAX_LENGTH],
        status=status,
        rating=_parse_rating(raw.get("rating")) if status == "read" else None,
        review=review_text or None,
        started=_parse_date(raw.get("created_at")),
    )


def _skipped(number: int, key: MessageKey) -> ApiWarning:
    params = {"row": number, "reason": [key.value]}
    return ApiWarning(
        code=ErrorCode.IMPORT_ROW_SKIPPED,
        key=MessageKey.IMPORT_ROW_SKIPPED.value,
        params=params,
        message=render_english(MessageKey.IMPORT_ROW_SKIPPED, params),
    )


def _parse_rows(data: Any, upload: UploadFile) -> tuple[list[ImportRow], list[ApiWarning]]:
    if not isinstance(data, list):
        raise _unexpected_structure(upload, "reviews")
    rows: list[ImportRow] = []
    warnings: list[ApiWarning] = []
    for number, raw in enumerate(data[1:], start=2):
        try:
            rows.append(_parse_row(number, raw))
        except RowError as error:
            warnings.append(_skipped(number, error.key))
    return rows, warnings


def _import_genres(db: Session, names: list[str], user: User) -> int:
    if not names:
        return 0
    lowered = [name.lower() for name in names]
    existing = {genre.name.lower(): genre for genre in db.scalars(select(Genre).where(func.lower(Genre.name).in_(lowered)))}
    missing = [Genre(name=name) for name in names if name.lower() not in existing]
    db.add_all(missing)
    db.flush()
    genre_ids = {genre.id for genre in [*existing.values(), *missing]}
    linked = set(
        db.scalars(select(user_genres.c.genre_id).where(user_genres.c.user_id == user.id, user_genres.c.genre_id.in_(genre_ids)))
    )
    new_links = [{"user_id": user.id, "genre_id": genre_id} for genre_id in sorted(genre_ids - linked)]
    if new_links:
        db.execute(insert(user_genres), new_links)
    return len(new_links)


def _books_for(db: Session, rows: list[ImportRow], user: User) -> tuple[dict[str, Book], int]:
    books = book_repository.find_by_titles(db, (row.title for row in rows))
    created = 0
    for row in rows:
        key = row.title.lower()
        if key not in books:
            books[key] = book_repository.add_book(db, Book(title=row.title, created_by_id=user.id))
            created += 1
    return books, created


def _import_rows(db: Session, rows: list[ImportRow], books: dict[str, Book], user: User) -> tuple[int, int]:
    book_ids = {book.id for book in books.values()}
    statuses = {
        status.book_id: status
        for status in db.scalars(
            select(UserBookStatus).where(UserBookStatus.user_id == user.id, UserBookStatus.book_id.in_(book_ids))
        )
    }
    reviewed = set(db.scalars(select(Review.book_id).where(Review.user_id == user.id, Review.book_id.in_(book_ids))))
    saved_statuses = 0
    ratings = 0
    rated_books: set[int] = set()
    for row in rows:
        book = books[row.title.lower()]
        status = statuses.get(book.id)
        if status is None:
            status = UserBookStatus(user_id=user.id, book_id=book.id, status=row.status)
            db.add(status)
            statuses[book.id] = status
        else:
            status.status = row.status
        saved_statuses += 1
        if row.status == "read" and book.id not in reviewed and (row.rating is not None or row.review):
            db.add(
                Review(
                    user_id=user.id,
                    book_id=book.id,
                    rating=row.rating,
                    review_content=row.review,
                    start_date=row.started,
                )
            )
            reviewed.add(book.id)
            if row.rating is not None:
                ratings += 1
                rated_books.add(book.id)
    book_repository.refresh_ratings(db, rated_books)
    return saved_statuses, ratings


def import_goodreads(db: Session, form: GoodreadsImportForm, user: User) -> ImportResult:
    with audit_service.track(db, AuditAction.GOODREADS_IMPORT, actor=user, params={"username": user.username}) as entry:
        genre_names = _genre_names(_read_json(form.favorite_genres, "favorite_genres"), form.favorite_genres)
        rows, warnings = _parse_rows(_read_json(form.reviews, "reviews"), form.reviews)
        genres_added = _import_genres(db, genre_names, user)
        books, books_created = _books_for(db, rows, user)
        statuses_saved, ratings_added = _import_rows(db, rows, books, user)
        entry.params.update({"books": books_created, "statuses": statuses_saved, "reviews": ratings_added})
    return ImportResult(
        summary=GoodreadsImportSummary(
            books_created=books_created,
            genres_added=genres_added,
            statuses_saved=statuses_saved,
            ratings_added=ratings_added,
            rows_skipped=len(warnings),
        ),
        warnings=warnings,
    )
