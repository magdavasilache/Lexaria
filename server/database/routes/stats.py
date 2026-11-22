from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from server.core.dependencies import get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.reading_challenge import CHALLENGE_YEAR_MAX, CHALLENGE_YEAR_MIN
from server.database.models.user import User
from server.database.schemas.stats import ChallengeOut, ChallengeSet, StatsOut, StatsQuery
from server.services import challenge_service, stats_service

router = APIRouter(tags=["Stats"], dependencies=[Depends(get_authenticated_user)])

Year = Annotated[int, Path(ge=CHALLENGE_YEAR_MIN, le=CHALLENGE_YEAR_MAX)]


@router.get(
    "/stats",
    response_model=ApiResponse[StatsOut],
    summary="Your reading stats for a year in your time zone, with streaks and challenge progress",
    responses=error_responses(401, 422),
)
def get_stats(
    query: Annotated[StatsQuery, Query()],
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[StatsOut]:
    return ok(stats_service.get_stats(db, query, user))


@router.put(
    "/challenges/{year}",
    response_model=ApiResponse[ChallengeOut],
    summary="Set or replace your reading challenge for a year",
    responses=error_responses(401, 422),
)
def set_challenge(
    year: Year,
    form: ChallengeSet,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ChallengeOut]:
    return ok(challenge_service.set_challenge(db, year, form, user))


@router.delete(
    "/challenges/{year}",
    response_model=ApiResponse[None],
    summary="Delete your reading challenge for a year",
    responses=error_responses(401, 404, 422),
)
def delete_challenge(
    year: Year,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    challenge_service.delete_challenge(db, year, user)
    return ok(None)
