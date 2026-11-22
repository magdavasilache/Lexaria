from typing import Annotated

from fastapi import APIRouter, Depends, Path, status
from sqlalchemy.orm import Session

from server.core.dependencies import get_admin_user, get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.award import AwardIn, AwardOut
from server.services import catalog_service

router = APIRouter(prefix="/awards", tags=["Awards"], dependencies=[Depends(get_authenticated_user)])

AwardId = Annotated[int, Path(ge=1)]


@router.get(
    "",
    response_model=ApiResponse[list[AwardOut]],
    summary="List awards with how many books use each",
    responses=error_responses(401),
)
def list_awards(db: Session = Depends(get_db)) -> ApiResponse[list[AwardOut]]:
    return ok(catalog_service.list_awards(db))


@router.post(
    "",
    response_model=ApiResponse[AwardOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add a award (admin)",
    responses=error_responses(401, 403, 409, 422),
)
def create_award(
    form: AwardIn,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[AwardOut]:
    return ok(catalog_service.create_award(db, form, user))


@router.put(
    "/{award_id}",
    response_model=ApiResponse[AwardOut],
    summary="Rename or correct a award (admin)",
    responses=error_responses(401, 403, 404, 409, 422),
)
def update_award(
    award_id: AwardId,
    form: AwardIn,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[AwardOut]:
    return ok(catalog_service.update_award(db, award_id, form, user))


@router.delete(
    "/{award_id}",
    response_model=ApiResponse[None],
    summary="Delete an award and remove it from every book (admin)",
    responses=error_responses(401, 403, 404, 422),
)
def delete_award(
    award_id: AwardId,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    catalog_service.delete_award(db, award_id, user)
    return ok(None)
