from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Any

from sqlalchemy import ColumnElement, func
from sqlalchemy.orm import Session

from server.core.errors import ConflictError, ErrorCode, NotFoundError, ValidationAppError
from server.core.message_keys import MessageKey
from server.database.models.audit_log import AuditAction
from server.database.models.award import Award
from server.database.models.country import Country
from server.database.models.genres import Genre
from server.database.models.language import Language
from server.database.models.user import User
from server.database.schemas.award import AwardIn, AwardOut
from server.database.schemas.country import CountryIn, CountryOut
from server.database.schemas.genre import GenreIn, GenreOut
from server.database.schemas.language import LanguageIn, LanguageOut
from server.repositories import catalog_repository
from server.services import audit_service


@dataclass(frozen=True)
class CatalogKind:
    model: type
    entity: str
    not_found: MessageKey
    not_found_code: ErrorCode
    exists: MessageKey | None
    exists_code: ErrorCode | None
    create: AuditAction
    update: AuditAction
    delete: AuditAction

    @property
    def id_param(self) -> str:
        return f"{self.entity}_id"

    def missing(self, entity_id: int) -> NotFoundError:
        return NotFoundError(self.not_found, params={self.id_param: entity_id}, code=self.not_found_code)


LANGUAGE = CatalogKind(
    Language, "language", MessageKey.LANGUAGE_NOT_FOUND, ErrorCode.LANGUAGE_NOT_FOUND,
    MessageKey.LANGUAGE_EXISTS, ErrorCode.LANGUAGE_EXISTS,
    AuditAction.LANGUAGE_CREATE, AuditAction.LANGUAGE_UPDATE, AuditAction.LANGUAGE_DELETE,
)
COUNTRY = CatalogKind(
    Country, "country", MessageKey.COUNTRY_NOT_FOUND, ErrorCode.COUNTRY_NOT_FOUND,
    MessageKey.COUNTRY_EXISTS, ErrorCode.COUNTRY_EXISTS,
    AuditAction.COUNTRY_CREATE, AuditAction.COUNTRY_UPDATE, AuditAction.COUNTRY_DELETE,
)
GENRE = CatalogKind(
    Genre, "genre", MessageKey.GENRE_NOT_FOUND, ErrorCode.GENRE_NOT_FOUND,
    MessageKey.GENRE_EXISTS, ErrorCode.GENRE_EXISTS,
    AuditAction.GENRE_CREATE, AuditAction.GENRE_UPDATE, AuditAction.GENRE_DELETE,
)
AWARD = CatalogKind(
    Award, "award", MessageKey.AWARD_NOT_FOUND, ErrorCode.AWARD_NOT_FOUND,
    MessageKey.AWARD_EXISTS, ErrorCode.AWARD_EXISTS,
    AuditAction.AWARD_CREATE, AuditAction.AWARD_UPDATE, AuditAction.AWARD_DELETE,
)

Apply = Callable[[Session, Any, int | None], None]
Present = Callable[[Session, int], Any]


def require(db: Session, kind: CatalogKind, entity_id: int) -> Any:
    entity = catalog_repository.get(db, kind.model, entity_id)
    if entity is None:
        raise kind.missing(entity_id)
    return entity


def check_reference(db: Session, kind: CatalogKind, entity_id: int | None, field: str) -> None:
    if entity_id is not None and not catalog_repository.exists_by_id(db, kind.model, entity_id):
        raise ValidationAppError(kind.not_found, code=kind.not_found_code, field=field)


def _unique_name(
    db: Session, kind: CatalogKind, name: str, exclude_id: int | None, also: Sequence[ColumnElement[bool]] = ()
) -> None:
    if catalog_repository.name_taken(db, kind.model, name, exclude_id=exclude_id, also=also):
        raise ConflictError(kind.exists, params={"name": name}, code=kind.exists_code, field="name")


def create(db: Session, kind: CatalogKind, name: str, user: User, apply: Apply, present: Present) -> Any:
    params = {"username": user.username, "name": name}
    with audit_service.track(db, kind.create, actor=user, params=params) as entry:
        entity = kind.model()
        apply(db, entity, None)
        catalog_repository.add(db, entity)
        entry.set_entity(kind.entity, entity.id)
    return present(db, entity.id)


def update(db: Session, kind: CatalogKind, entity_id: int, name: str, user: User, apply: Apply, present: Present) -> Any:
    params = {"username": user.username, kind.id_param: entity_id}
    with audit_service.track(db, kind.update, actor=user, params=params) as entry:
        entry.set_entity(kind.entity, entity_id)
        entity = require(db, kind, entity_id)
        apply(db, entity, entity_id)
        entry.params["name"] = name
        db.flush()
    db.expire_all()
    return present(db, entity_id)


def delete(db: Session, kind: CatalogKind, entity_id: int, user: User, name_of: Callable[[Any], str]) -> Any:
    params = {"username": user.username, kind.id_param: entity_id}
    with audit_service.track(db, kind.delete, actor=user, params=params) as entry:
        entry.set_entity(kind.entity, entity_id)
        entity = require(db, kind, entity_id)
        entry.params["name"] = name_of(entity)
        catalog_repository.delete(db, entity)
    return entity


def _language_out(db: Session, language_id: int) -> LanguageOut:
    language, books = catalog_repository.list_languages(db, language_id)[0]
    return LanguageOut(id=language.id, name=language.name, books_count=books)


def list_languages(db: Session) -> list[LanguageOut]:
    return [LanguageOut(id=language.id, name=language.name, books_count=books) for language, books in catalog_repository.list_languages(db)]


def _apply_language(form: LanguageIn) -> Apply:
    def apply(db: Session, language: Language, exclude_id: int | None) -> None:
        _unique_name(db, LANGUAGE, form.name, exclude_id)
        language.name = form.name

    return apply


def create_language(db: Session, form: LanguageIn, user: User) -> LanguageOut:
    return create(db, LANGUAGE, form.name, user, _apply_language(form), _language_out)


def update_language(db: Session, language_id: int, form: LanguageIn, user: User) -> LanguageOut:
    return update(db, LANGUAGE, language_id, form.name, user, _apply_language(form), _language_out)


def delete_language(db: Session, language_id: int, user: User) -> None:
    delete(db, LANGUAGE, language_id, user, lambda language: language.name)


def _country(country: Country, books: int, authors: int) -> CountryOut:
    return CountryOut(
        id=country.id,
        name=country.name,
        language_id=country.language_id,
        language_name=country.language_name,
        books_count=books,
        authors_count=authors,
    )


def _country_out(db: Session, country_id: int) -> CountryOut:
    return _country(*catalog_repository.list_countries(db, country_id)[0])


def list_countries(db: Session) -> list[CountryOut]:
    return [_country(*row) for row in catalog_repository.list_countries(db)]


def _apply_country(form: CountryIn) -> Apply:
    def apply(db: Session, country: Country, exclude_id: int | None) -> None:
        _unique_name(db, COUNTRY, form.name, exclude_id)
        check_reference(db, LANGUAGE, form.language_id, "language_id")
        country.name = form.name
        country.language_id = form.language_id

    return apply


def create_country(db: Session, form: CountryIn, user: User) -> CountryOut:
    return create(db, COUNTRY, form.name, user, _apply_country(form), _country_out)


def update_country(db: Session, country_id: int, form: CountryIn, user: User) -> CountryOut:
    return update(db, COUNTRY, country_id, form.name, user, _apply_country(form), _country_out)


def delete_country(db: Session, country_id: int, user: User) -> None:
    delete(db, COUNTRY, country_id, user, lambda country: country.name)


def _genre_out(db: Session, genre_id: int) -> GenreOut:
    genre, books = catalog_repository.list_genres(db, genre_id)[0]
    return GenreOut(id=genre.id, name=genre.name, books_count=books)


def list_genres(db: Session) -> list[GenreOut]:
    return [GenreOut(id=genre.id, name=genre.name, books_count=books) for genre, books in catalog_repository.list_genres(db)]


def _apply_genre(form: GenreIn) -> Apply:
    def apply(db: Session, genre: Genre, exclude_id: int | None) -> None:
        _unique_name(db, GENRE, form.name, exclude_id)
        genre.name = form.name

    return apply


def create_genre(db: Session, form: GenreIn, user: User) -> GenreOut:
    return create(db, GENRE, form.name, user, _apply_genre(form), _genre_out)


def update_genre(db: Session, genre_id: int, form: GenreIn, user: User) -> GenreOut:
    return update(db, GENRE, genre_id, form.name, user, _apply_genre(form), _genre_out)


def delete_genre(db: Session, genre_id: int, user: User) -> None:
    delete(db, GENRE, genre_id, user, lambda genre: genre.name)


def _award(award: Award, books: int) -> AwardOut:
    return AwardOut(
        id=award.id,
        name=award.name,
        year=award.year,
        description=award.description,
        books_count=books,
        created_at=award.created_at,
        updated_at=award.updated_at,
    )


def _award_out(db: Session, award_id: int) -> AwardOut:
    return _award(*catalog_repository.list_awards(db, award_id)[0])


def list_awards(db: Session) -> list[AwardOut]:
    return [_award(*row) for row in catalog_repository.list_awards(db)]


def _apply_award(form: AwardIn) -> Apply:
    def apply(db: Session, award: Award, exclude_id: int | None) -> None:
        same_year = func.coalesce(Award.year, 0) == (form.year or 0)
        _unique_name(db, AWARD, form.name, exclude_id, also=[same_year])
        award.name = form.name
        award.year = form.year
        award.description = form.description

    return apply


def create_award(db: Session, form: AwardIn, user: User) -> AwardOut:
    return create(db, AWARD, form.name, user, _apply_award(form), _award_out)


def update_award(db: Session, award_id: int, form: AwardIn, user: User) -> AwardOut:
    return update(db, AWARD, award_id, form.name, user, _apply_award(form), _award_out)


def delete_award(db: Session, award_id: int, user: User) -> None:
    delete(db, AWARD, award_id, user, lambda award: award.name)
