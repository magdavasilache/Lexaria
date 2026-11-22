from dataclasses import dataclass, field
from datetime import date, timedelta

from sqlalchemy.orm import Session

from server.core.errors import ConflictError, ErrorCode, NotFoundError
from server.core.message_keys import MessageKey, render_english
from server.core.responses import ApiWarning
from server.database.models.audit_log import AuditAction
from server.database.models.author import AUTHOR_NAME_MAX_LENGTH, Author
from server.database.models.book import (
    PAGES_MAX,
    SYNOPSIS_MAX_LENGTH,
    TITLE_MAX_LENGTH,
    Book,
    BookDescription,
)
from server.database.models.edition import PUBLISHER_MAX_LENGTH, Edition
from server.database.models.genres import Genre
from server.database.models.language import Language
from server.database.models.user import User
from server.database.schemas.base import PUBLISHED_AT_MAX_DAYS_AHEAD
from server.database.schemas.book import GenreRef
from server.database.schemas.isbn_import import IsbnImportCreate, IsbnImportResult, IsbnPreview
from server.repositories import book_repository, edition_repository
from server.services import audit_service, open_library
from server.services.images import IMAGE_MAX_BYTES, ImageFolder, delete_images, save_image_bytes
from server.services.open_library import MARC_LANGUAGES, OpenLibraryBook

SYNOPSIS_LANGUAGE = "en"


@dataclass(frozen=True)
class _Resolved:
    record: OpenLibraryBook
    author_name: str | None
    author: Author | None
    language: Language | None
    genres: list[Genre]
    matched_book: Book | None


@dataclass
class ImportOutcome:
    result: IsbnImportResult
    warnings: list[ApiWarning] = field(default_factory=list)


def _clip(value: str | None, max_length: int) -> str | None:
    return value[:max_length].strip() or None if value else None


def _plausible(value: date | None) -> date | None:
    latest = date.today() + timedelta(days=PUBLISHED_AT_MAX_DAYS_AHEAD)
    return value if value is not None and value <= latest else None


def _pages(value: int | None) -> int | None:
    return value if value is not None and value <= PAGES_MAX else None


def _record(isbn: str) -> OpenLibraryBook:
    record = open_library.lookup(isbn)
    if record is None:
        raise NotFoundError(
            MessageKey.IMPORT_ISBN_NOT_FOUND, params={"isbn": isbn}, code=ErrorCode.ISBN_NOT_FOUND, field="isbn"
        )
    return record


def _resolve(db: Session, record: OpenLibraryBook) -> _Resolved:
    author_name = record.authors[0] if record.authors else None
    author = book_repository.find_author_by_name(db, author_name) if author_name else None
    names = MARC_LANGUAGES.get(record.language_code or "", ("", ()))[1]
    title = _clip(record.title, TITLE_MAX_LENGTH) or record.isbn
    return _Resolved(
        record=record,
        author_name=author_name,
        author=author,
        language=book_repository.find_language_by_names(db, names),
        genres=book_repository.find_genres_by_names(db, record.subjects),
        matched_book=book_repository.find_book_by_title_and_author(db, title, author.id) if author else None,
    )


def preview(db: Session, isbn: str) -> IsbnPreview:
    existing_book_id = book_repository.find_book_id_by_isbn(db, isbn)
    resolved = _resolve(db, _record(isbn))
    record = resolved.record
    return IsbnPreview(
        isbn=isbn,
        title=_clip(record.title, TITLE_MAX_LENGTH) or isbn,
        author_name=resolved.author.full_name if resolved.author else resolved.author_name,
        author_id=resolved.author.id if resolved.author else None,
        language_name=resolved.language.name if resolved.language else None,
        language_id=resolved.language.id if resolved.language else None,
        pages=_pages(record.pages),
        publisher=_clip(record.publisher, PUBLISHER_MAX_LENGTH),
        published_at=_plausible(record.published_at),
        edition_format=record.edition_format,
        synopsis=_clip(record.description, SYNOPSIS_MAX_LENGTH),
        genres=[GenreRef.model_validate(genre) for genre in resolved.genres],
        has_cover=record.cover_id is not None,
        existing_book_id=existing_book_id,
        matched_book_id=resolved.matched_book.id if resolved.matched_book else None,
        matched_book_title=resolved.matched_book.title if resolved.matched_book else None,
    )


def _new_author(db: Session, name: str) -> Author:
    parts = name.split()
    first_name = " ".join(parts[:-1]) if len(parts) > 1 else name
    last_name = parts[-1] if len(parts) > 1 else None
    author = Author(
        first_name=_clip(first_name, AUTHOR_NAME_MAX_LENGTH) or name[:AUTHOR_NAME_MAX_LENGTH],
        last_name=_clip(last_name, AUTHOR_NAME_MAX_LENGTH),
    )
    db.add(author)
    db.flush()
    return author


def _new_book(db: Session, resolved: _Resolved, user: User) -> Book:
    record = resolved.record
    author = resolved.author or (_new_author(db, resolved.author_name) if resolved.author_name else None)
    synopsis = _clip(record.description, SYNOPSIS_MAX_LENGTH)
    book = Book(
        title=_clip(record.title, TITLE_MAX_LENGTH) or record.isbn,
        author_id=author.id if author else None,
        language_id=resolved.language.id if resolved.language else None,
        pages=_pages(record.pages),
        published_at=_plausible(record.first_published_at) or _plausible(record.published_at),
        created_by_id=user.id,
        genres=resolved.genres,
        descriptions=[BookDescription(language=SYNOPSIS_LANGUAGE, synopsis=synopsis)] if synopsis else [],
    )
    return book_repository.add_book(db, book)


def _wants_cover(record: OpenLibraryBook, book: Book, form: IsbnImportCreate) -> bool:
    return form.include_cover and record.cover_id is not None and not book.images


def _download_cover(cover_id: int) -> str | None:
    cover = open_library.fetch_cover(cover_id, IMAGE_MAX_BYTES)
    return save_image_bytes(cover.content, cover.extension, ImageFolder.BOOKS) if cover else None


def _cover_skipped() -> ApiWarning:
    return ApiWarning(
        code=ErrorCode.IMPORT_COVER_SKIPPED,
        key=MessageKey.IMPORT_COVER_SKIPPED.value,
        message=render_english(MessageKey.IMPORT_COVER_SKIPPED),
    )


def import_book(db: Session, form: IsbnImportCreate, user: User) -> ImportOutcome:
    saved: list[str] = []
    warnings: list[ApiWarning] = []
    params = {"username": user.username, "isbn": form.isbn}
    try:
        with audit_service.track(db, AuditAction.BOOK_IMPORT, actor=user, params=params) as entry:
            if edition_repository.isbn_taken(db, form.isbn):
                raise ConflictError(MessageKey.ISBN_EXISTS, code=ErrorCode.ISBN_EXISTS, field="isbn")
            resolved = _resolve(db, _record(form.isbn))
            record = resolved.record
            book = resolved.matched_book or _new_book(db, resolved, user)
            entry.params["title"] = book.title
            entry.set_entity("book", book.id)
            if _wants_cover(record, book, form):
                cover = _download_cover(record.cover_id)
                if cover:
                    saved.append(cover)
                    book.images = [cover]
                else:
                    warnings.append(_cover_skipped())
            edition = edition_repository.add_edition(
                db,
                Edition(
                    book_id=book.id,
                    format=form.format,
                    pages=form.pages,
                    language_id=resolved.language.id if resolved.language else None,
                    publisher=_clip(record.publisher, PUBLISHER_MAX_LENGTH),
                    published_at=_plausible(record.published_at),
                    isbn=form.isbn,
                    created_by_id=user.id,
                ),
            )
            entry.params["book_id"] = book.id
    except BaseException:
        delete_images(saved, ImageFolder.BOOKS)
        raise
    result = IsbnImportResult(
        book_id=book.id,
        edition_id=edition.id,
        book_created=resolved.matched_book is None,
        cover_imported=bool(saved),
    )
    return ImportOutcome(result, warnings)
