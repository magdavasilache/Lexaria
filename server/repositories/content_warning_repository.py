from collections.abc import Iterable, Sequence

from sqlalchemy import Row, delete, func, select
from sqlalchemy.orm import Session

from server.database.models.content_warning import BookContentWarning
from server.database.schemas.content_warning import ContentWarningReport


def counts(db: Session, book_id: int) -> Sequence[Row[tuple[str, str, int]]]:
    return db.execute(
        select(BookContentWarning.warning, BookContentWarning.severity, func.count())
        .where(BookContentWarning.book_id == book_id)
        .group_by(BookContentWarning.warning, BookContentWarning.severity)
    ).all()


def reporters(db: Session, book_id: int) -> int:
    return db.scalar(
        select(func.count(func.distinct(BookContentWarning.user_id))).where(BookContentWarning.book_id == book_id)
    ) or 0


def mine(db: Session, user_id: int, book_id: int) -> Sequence[BookContentWarning]:
    return db.scalars(
        select(BookContentWarning)
        .where(BookContentWarning.user_id == user_id, BookContentWarning.book_id == book_id)
        .order_by(BookContentWarning.warning)
    ).all()


def replace(db: Session, user_id: int, book_id: int, reports: Iterable[ContentWarningReport]) -> None:
    remove(db, user_id, book_id)
    db.add_all(
        BookContentWarning(user_id=user_id, book_id=book_id, warning=report.warning.value, severity=report.severity.value)
        for report in reports
    )
    db.flush()


def remove(db: Session, user_id: int, book_id: int) -> None:
    db.execute(
        delete(BookContentWarning).where(BookContentWarning.user_id == user_id, BookContentWarning.book_id == book_id)
    )
    db.flush()
