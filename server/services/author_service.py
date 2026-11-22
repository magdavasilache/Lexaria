from sqlalchemy.orm import Session

from server.core.errors import ErrorCode
from server.core.message_keys import MessageKey
from server.database.models.audit_log import AuditAction
from server.database.models.author import Author
from server.database.models.user import User
from server.database.schemas.author import AuthorIn, AuthorOut, AuthorUpdate
from server.repositories import catalog_repository
from server.services import audit_service
from server.services.catalog_service import COUNTRY, CatalogKind, check_reference, require
from server.services.images import ImageFolder, delete_images, image_url, save_image

AUTHOR = CatalogKind(
    Author, "author", MessageKey.AUTHOR_NOT_FOUND, ErrorCode.AUTHOR_NOT_FOUND, None, None,
    AuditAction.AUTHOR_CREATE, AuditAction.AUTHOR_UPDATE, AuditAction.AUTHOR_DELETE,
)


def _author(author: Author, books: int) -> AuthorOut:
    return AuthorOut(
        id=author.id,
        first_name=author.first_name,
        last_name=author.last_name,
        full_name=author.full_name,
        birthdate=author.birthdate,
        country_id=author.country_id,
        country_name=author.country_name,
        about=author.about,
        image_url=image_url(ImageFolder.AUTHORS, author.image) if author.image else None,
        books_count=books,
        created_at=author.created_at,
        updated_at=author.updated_at,
    )


def _author_out(db: Session, author_id: int) -> AuthorOut:
    db.expire_all()
    return _author(*catalog_repository.list_authors(db, author_id)[0])


def _full_name(form: AuthorIn) -> str:
    return " ".join(part for part in (form.first_name, form.last_name) if part)


def _apply(db: Session, author: Author, form: AuthorIn) -> None:
    check_reference(db, COUNTRY, form.country_id, "country_id")
    author.first_name = form.first_name
    author.last_name = form.last_name
    author.birthdate = form.birthdate
    author.country_id = form.country_id
    author.about = form.about


def list_authors(db: Session) -> list[AuthorOut]:
    return [_author(*row) for row in catalog_repository.list_authors(db)]


def create_author(db: Session, form: AuthorIn, user: User) -> AuthorOut:
    saved: str | None = None
    params = {"username": user.username, "name": _full_name(form)}
    try:
        with audit_service.track(db, AUTHOR.create, actor=user, params=params) as entry:
            author = Author()
            _apply(db, author, form)
            if form.image is not None:
                saved = save_image(form.image, ImageFolder.AUTHORS, "image")
                author.image = saved
            catalog_repository.add(db, author)
            entry.set_entity(AUTHOR.entity, author.id)
    except BaseException:
        delete_images([saved], ImageFolder.AUTHORS)
        raise
    return _author_out(db, author.id)


def update_author(db: Session, author_id: int, form: AuthorUpdate, user: User) -> AuthorOut:
    saved: str | None = None
    replaced: str | None = None
    params = {"username": user.username, AUTHOR.id_param: author_id}
    try:
        with audit_service.track(db, AUTHOR.update, actor=user, params=params) as entry:
            entry.set_entity(AUTHOR.entity, author_id)
            author = require(db, AUTHOR, author_id)
            _apply(db, author, form)
            if form.image is not None:
                saved = save_image(form.image, ImageFolder.AUTHORS, "image")
            if saved is not None or form.remove_image:
                replaced, author.image = author.image, saved
            entry.params["name"] = author.full_name
            db.flush()
    except BaseException:
        delete_images([saved], ImageFolder.AUTHORS)
        raise
    delete_images([replaced], ImageFolder.AUTHORS)
    return _author_out(db, author_id)


def delete_author(db: Session, author_id: int, user: User) -> None:
    params = {"username": user.username, AUTHOR.id_param: author_id}
    with audit_service.track(db, AUTHOR.delete, actor=user, params=params) as entry:
        entry.set_entity(AUTHOR.entity, author_id)
        author = require(db, AUTHOR, author_id)
        entry.params["name"] = author.full_name
        image = author.image
        catalog_repository.delete(db, author)
    delete_images([image], ImageFolder.AUTHORS)
