from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from server.core.errors import ErrorCode, NotFoundError, ValidationAppError
from server.core.message_keys import MessageKey
from server.database.models.audit_log import AuditAction
from server.database.models.reading_challenge import ReadingChallenge
from server.database.models.user import User
from server.database.schemas.stats import ChallengeOut, ChallengeSet
from server.repositories import challenge_repository
from server.services import audit_service

EARLIEST_ZONE = ZoneInfo("Etc/GMT-14")
YEARS_AHEAD = 1


def latest_allowed_year() -> int:
    return datetime.now(EARLIEST_ZONE).year + YEARS_AHEAD


def set_challenge(db: Session, year: int, form: ChallengeSet, user: User) -> ChallengeOut:
    with audit_service.track(
        db, AuditAction.CHALLENGE_SET, actor=user, params={"username": user.username, "year": year}
    ) as entry:
        if year > latest_allowed_year():
            raise ValidationAppError(
                MessageKey.CHALLENGE_YEAR_TOO_FAR,
                params={"max": latest_allowed_year()},
                code=ErrorCode.CHALLENGE_YEAR_TOO_FAR,
                field="year",
            )
        challenge = challenge_repository.get_for_year(db, user.id, year)
        if challenge is None:
            challenge = challenge_repository.add(db, ReadingChallenge(user_id=user.id, year=year, **form.model_dump()))
        else:
            for name, value in form.model_dump().items():
                setattr(challenge, name, value)
            db.flush()
        entry.set_entity("reading_challenge", challenge.id)
    return ChallengeOut.model_validate(challenge)


def delete_challenge(db: Session, year: int, user: User) -> None:
    with audit_service.track(
        db, AuditAction.CHALLENGE_DELETE, actor=user, params={"username": user.username, "year": year}
    ) as entry:
        challenge = challenge_repository.get_for_year(db, user.id, year)
        if challenge is None:
            raise NotFoundError(
                MessageKey.CHALLENGE_NOT_FOUND, params={"year": year}, code=ErrorCode.CHALLENGE_NOT_FOUND
            )
        entry.set_entity("reading_challenge", challenge.id)
        challenge_repository.delete(db, challenge)
