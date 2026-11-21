from sqlalchemy import func, select
from sqlalchemy.orm import Session

from server.database.models.user import User


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_user_by_username(db: Session, username: str) -> User | None:
    statement = select(User).where(func.lower(User.username) == username.lower())
    return db.scalars(statement).first()


def add_user(db: Session, user: User) -> User:
    db.add(user)
    db.flush()
    return user
