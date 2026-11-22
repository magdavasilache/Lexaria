from collections.abc import Sequence

from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session, selectinload

from server.database.models.book import Book
from server.database.models.edition import Edition


def list_for_book(db: Session, book_id: int) -> Sequence[Edition]:
    return db.scalars(
        select(Edition)
        .options(selectinload(Edition.language))
        .where(Edition.book_id == book_id)
        .order_by(Edition.published_at.desc().nulls_last(), Edition.id)
    ).all()


def get_edition(db: Session, edition_id: int) -> Edition | None:
    return db.scalar(
        select(Edition)
        .options(selectinload(Edition.language), selectinload(Edition.book))
        .where(Edition.id == edition_id)
    )


def isbn_taken(db: Session, isbn: str, *, exclude_id: int | None = None) -> bool:
    query = exists().where(Edition.isbn == isbn)
    if exclude_id is not None:
        query = query.where(Edition.id != exclude_id)
    return bool(db.scalar(select(query)))


def add_edition(db: Session, edition: Edition) -> Edition:
    db.add(edition)
    db.flush()
    return edition


def delete_edition(db: Session, edition: Edition) -> None:
    db.delete(edition)
    db.flush()


def list_all(db: Session, offset: int, limit: int) -> tuple[Sequence[Edition], int]:
    total = db.scalar(select(func.count()).select_from(Edition)) or 0
    editions = db.scalars(
        select(Edition)
        .join(Edition.book)
        .options(selectinload(Edition.language), selectinload(Edition.book), selectinload(Edition.created_by))
        .order_by(Book.title, Edition.id)
        .offset(offset)
        .limit(limit)
    ).all()
    return editions, total
