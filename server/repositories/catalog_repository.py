from collections.abc import Sequence
from typing import Any

from sqlalchemy import ColumnElement, Row, exists, func, select
from sqlalchemy.orm import Session, joinedload

from server.database.models.author import Author
from server.database.models.award import Award, book_award
from server.database.models.book import Book
from server.database.models.country import Country
from server.database.models.genres import Genre, book_genres
from server.database.models.language import Language


def _count(*conditions: ColumnElement[bool], table: Any = Book):
    return select(func.count()).select_from(table).where(*conditions).scalar_subquery()


def _only(column, entity_id: int | None) -> list[ColumnElement[bool]]:
    return [] if entity_id is None else [column == entity_id]


def list_languages(db: Session, entity_id: int | None = None) -> Sequence[Row[tuple[Language, int]]]:
    return db.execute(
        select(Language, _count(Book.language_id == Language.id))
        .where(*_only(Language.id, entity_id))
        .order_by(func.lower(Language.name), Language.id)
    ).all()


def list_countries(db: Session, entity_id: int | None = None) -> Sequence[Row[tuple[Country, int, int]]]:
    return db.execute(
        select(Country, _count(Book.country_id == Country.id), _count(Author.country_id == Country.id, table=Author))
        .options(joinedload(Country.language))
        .where(*_only(Country.id, entity_id))
        .order_by(func.lower(Country.name), Country.id)
    ).all()


def list_genres(db: Session, entity_id: int | None = None) -> Sequence[Row[tuple[Genre, int]]]:
    return db.execute(
        select(Genre, _count(book_genres.c.genre_id == Genre.id, table=book_genres))
        .where(*_only(Genre.id, entity_id))
        .order_by(func.lower(Genre.name), Genre.id)
    ).all()


def list_awards(db: Session, entity_id: int | None = None) -> Sequence[Row[tuple[Award, int]]]:
    return db.execute(
        select(Award, _count(book_award.c.award_id == Award.id, table=book_award))
        .where(*_only(Award.id, entity_id))
        .order_by(func.lower(Award.name), Award.year.desc().nulls_last(), Award.id)
    ).all()


def list_authors(db: Session, entity_id: int | None = None) -> Sequence[Row[tuple[Author, int]]]:
    return db.execute(
        select(Author, _count(Book.author_id == Author.id))
        .options(joinedload(Author.country))
        .where(*_only(Author.id, entity_id))
        .order_by(func.lower(func.coalesce(Author.last_name, Author.first_name)), func.lower(Author.first_name), Author.id)
    ).all()


def get(db: Session, model: type, entity_id: int):
    return db.get(model, entity_id)


def exists_by_id(db: Session, model: type, entity_id: int) -> bool:
    return bool(db.scalar(select(exists().where(model.id == entity_id))))


def name_taken(
    db: Session,
    model: type,
    name: str,
    *,
    exclude_id: int | None = None,
    also: Sequence[ColumnElement[bool]] = (),
) -> bool:
    query = exists().where(func.lower(model.name) == name.lower(), *also)
    if exclude_id is not None:
        query = query.where(model.id != exclude_id)
    return bool(db.scalar(select(query)))


def add(db: Session, entity: Any) -> Any:
    db.add(entity)
    db.flush()
    return entity


def delete(db: Session, entity: Any) -> None:
    db.delete(entity)
    db.flush()
