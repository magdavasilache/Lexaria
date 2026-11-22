from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from server.database.models.reading_challenge import ReadingChallenge


def get_for_year(db: Session, user_id: int, year: int) -> ReadingChallenge | None:
    return db.scalar(select(ReadingChallenge).where(ReadingChallenge.user_id == user_id, ReadingChallenge.year == year))


def years(db: Session, user_id: int) -> Sequence[int]:
    return db.scalars(select(ReadingChallenge.year).where(ReadingChallenge.user_id == user_id)).all()


def add(db: Session, challenge: ReadingChallenge) -> ReadingChallenge:
    db.add(challenge)
    db.flush()
    return challenge


def delete(db: Session, challenge: ReadingChallenge) -> None:
    db.delete(challenge)
    db.flush()
