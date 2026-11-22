from sqlalchemy.orm import Session

from server.core.errors import ConflictError, ErrorCode, ForbiddenError, NotFoundError, ValidationAppError
from server.core.message_keys import MessageKey
from server.database.models.audit_log import AuditAction
from server.database.models.edition import Edition
from server.database.models.language import Language
from server.database.models.user import User
from server.database.schemas.edition import EditionAdminOut, EditionCreate, EditionListQuery, EditionOut, EditionUpdate
from server.repositories import book_repository, edition_repository
from server.services import audit_service, book_service


def _load_edition(db: Session, edition_id: int) -> Edition:
    edition = edition_repository.get_edition(db, edition_id)
    if edition is None:
        raise NotFoundError(
            MessageKey.EDITION_NOT_FOUND, params={"edition_id": edition_id}, code=ErrorCode.EDITION_NOT_FOUND
        )
    return edition


def load_for_book(db: Session, edition_id: int, book_id: int) -> Edition:
    edition = edition_repository.get_edition(db, edition_id)
    if edition is None:
        raise ValidationAppError(MessageKey.EDITION_NOT_FOUND, code=ErrorCode.EDITION_NOT_FOUND, field="edition_id")
    if edition.book_id != book_id:
        raise ValidationAppError(MessageKey.EDITION_NOT_ON_BOOK, code=ErrorCode.EDITION_NOT_ON_BOOK, field="edition_id")
    return edition


def _out(db: Session, edition_id: int) -> EditionOut:
    db.expire_all()
    return EditionOut.model_validate(_load_edition(db, edition_id))


def _check_references(db: Session, form: EditionCreate, *, exclude_id: int | None = None) -> None:
    if form.language_id is not None and book_repository.find_missing_ids(db, Language, [form.language_id]):
        raise ValidationAppError(
            MessageKey.LANGUAGE_NOT_FOUND, code=ErrorCode.LANGUAGE_NOT_FOUND, field="language_id"
        )
    if form.isbn is not None and edition_repository.isbn_taken(db, form.isbn, exclude_id=exclude_id):
        raise ConflictError(MessageKey.ISBN_EXISTS, code=ErrorCode.ISBN_EXISTS, field="isbn")


def _apply(edition: Edition, form: EditionCreate) -> None:
    edition.format = form.format.value
    edition.pages = form.pages
    edition.language_id = form.language_id
    edition.translator = form.translator
    edition.publisher = form.publisher
    edition.published_at = form.published_at
    edition.isbn = form.isbn


def list_editions(db: Session, book_id: int) -> list[EditionOut]:
    book_service.require_book(db, book_id)
    return [EditionOut.model_validate(edition) for edition in edition_repository.list_for_book(db, book_id)]


def list_all(db: Session, query: EditionListQuery) -> tuple[list[EditionAdminOut], int]:
    editions, total = edition_repository.list_all(db, query.offset, query.limit)
    return [
        EditionAdminOut(
            **EditionOut.model_validate(edition).model_dump(),
            book_title=edition.book.title,
            created_by_username=edition.created_by.username if edition.created_by else None,
        )
        for edition in editions
    ], total


def create_edition(db: Session, book_id: int, form: EditionCreate, user: User) -> EditionOut:
    params = {"username": user.username, "book_id": book_id}
    with audit_service.track(db, AuditAction.EDITION_CREATE, actor=user, params=params) as entry:
        entry.params["title"] = book_service.require_book(db, book_id).title
        _check_references(db, form)
        edition = Edition(book_id=book_id, created_by_id=user.id)
        _apply(edition, form)
        edition_repository.add_edition(db, edition)
        entry.set_entity("edition", edition.id)
        entry.params["edition_id"] = edition.id
    return _out(db, edition.id)


def update_edition(db: Session, edition_id: int, form: EditionUpdate, user: User) -> EditionOut:
    params = {"username": user.username, "edition_id": edition_id}
    with audit_service.track(db, AuditAction.EDITION_UPDATE, actor=user, params=params) as entry:
        entry.set_entity("edition", edition_id)
        edition = _load_edition(db, edition_id)
        entry.params.update({"book_id": edition.book_id, "title": edition.book.title})
        if edition.created_by_id != user.id and not user.is_admin:
            raise ForbiddenError(MessageKey.EDITION_NOT_CREATOR, code=ErrorCode.NOT_AUTHOR)
        _check_references(db, form, exclude_id=edition_id)
        _apply(edition, form)
        db.flush()
    return _out(db, edition_id)


def delete_edition(db: Session, edition_id: int, user: User) -> None:
    params = {"username": user.username, "edition_id": edition_id}
    with audit_service.track(db, AuditAction.EDITION_DELETE, actor=user, params=params) as entry:
        entry.set_entity("edition", edition_id)
        edition = _load_edition(db, edition_id)
        entry.params.update({"book_id": edition.book_id, "title": edition.book.title})
        edition_repository.delete_edition(db, edition)
