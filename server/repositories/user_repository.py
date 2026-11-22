from datetime import datetime

from sqlalchemy import func, select, update
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


def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.desc(), User.id.desc())))


def set_login_failures(db: Session, user_id: int, attempts: int, locked_until: datetime | None) -> None:
    db.execute(
        update(User)
        .where(User.id == user_id)
        .values(failed_login_attempts=attempts, locked_until=locked_until)
        .execution_options(synchronize_session=False)
    )
