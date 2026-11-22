from typing import Annotated

from fastapi import APIRouter, Depends, Form, Path
from sqlalchemy.orm import Session

from server.core.dependencies import get_admin_user, get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.user import AvatarUpload, BanCreate, UserAdminRead, UserRead
from server.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])

UserId = Annotated[int, Path(ge=1)]


@router.get(
    "",
    response_model=ApiResponse[list[UserAdminRead]],
    summary="List every user with their ban and lock status (admin)",
    responses=error_responses(401, 403),
)
def list_users(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[list[UserAdminRead]]:
    return ok(user_service.list_users(db))


@router.put(
    "/me/avatar",
    response_model=ApiResponse[UserRead],
    summary="Upload or replace the current user's profile picture",
    responses=error_responses(401, 422),
)
def update_avatar(
    form: Annotated[AvatarUpload, Form()],
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[UserRead]:
    return ok(user_service.update_avatar(db, user, form))


@router.delete(
    "/me/avatar",
    response_model=ApiResponse[UserRead],
    summary="Remove the current user's profile picture",
    responses=error_responses(401),
)
def remove_avatar(
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[UserRead]:
    return ok(user_service.remove_avatar(db, user))


@router.post(
    "/{user_id}/ban",
    response_model=ApiResponse[UserAdminRead],
    summary="Ban a user for a number of days or permanently and end their sessions (admin)",
    responses=error_responses(401, 403, 404, 422),
)
def ban_user(
    user_id: UserId,
    form: BanCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[UserAdminRead]:
    return ok(user_service.ban_user(db, user_id, form, admin))


@router.delete(
    "/{user_id}/ban",
    response_model=ApiResponse[UserAdminRead],
    summary="Lift a user's ban (admin)",
    responses=error_responses(401, 403, 404),
)
def unban_user(
    user_id: UserId,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[UserAdminRead]:
    return ok(user_service.unban_user(db, user_id, admin))
