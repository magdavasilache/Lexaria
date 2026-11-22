from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from server.database.models.audit_log import AuditAction
from server.database.models.user import User
from server.database.schemas.reading import ReadingGoalOut, ReadingGoalSet, ReadingTodayOut, ReadingTodayQuery
from server.repositories import reading_repository
from server.services import audit_service


def set_goal(db: Session, form: ReadingGoalSet, user: User) -> ReadingGoalOut:
    with audit_service.track(db, AuditAction.READING_GOAL_SET, actor=user, params={"username": user.username}) as entry:
        entry.set_entity("user", user.id)
        user.daily_reading_goal_minutes = form.daily_reading_goal_minutes
        db.flush()
    return ReadingGoalOut.model_validate(user)


def get_today(db: Session, query: ReadingTodayQuery, user: User) -> ReadingTodayOut:
    local_now = datetime.now(ZoneInfo(query.tz))
    midnight = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    return ReadingTodayOut(
        day=local_now.date(),
        today_seconds=reading_repository.completed_seconds_since(db, user.id, midnight.astimezone(timezone.utc)),
        daily_reading_goal_minutes=user.daily_reading_goal_minutes,
    )
