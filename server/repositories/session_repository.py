from datetime import datetime

from sqlalchemy import delete, or_, update
from sqlalchemy.orm import Session

from server.database.models.user_session import UserSession


def add_session(db: Session, session: UserSession) -> UserSession:
    db.add(session)
    db.flush()
    return session


def get_session(db: Session, session_id: int) -> UserSession | None:
    return db.get(UserSession, session_id)


def revoke_user_sessions(db: Session, user_id: int, now: datetime) -> None:
    db.execute(
        update(UserSession)
        .where(UserSession.user_id == user_id, UserSession.revoked_at.is_(None))
        .values(revoked_at=now)
    )
    db.flush()


def delete_stale_sessions(db: Session, user_id: int, now: datetime) -> None:
    db.execute(
        delete(UserSession).where(
            UserSession.user_id == user_id,
            or_(
                UserSession.revoked_at.is_not(None),
                UserSession.expires_at <= now,
                UserSession.idle_expires_at <= now,
            ),
        )
    )
    db.flush()
