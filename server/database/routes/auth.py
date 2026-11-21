from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Response, status
from sqlalchemy.orm import Session

from server.core.config import settings
from server.core.dependencies import get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.user import AccessTokenResponse, AuthResponse, LoginForm, UserCreate, UserRead
from server.services import auth_service
from server.services.auth_service import RefreshCookie

router = APIRouter(prefix="/auth", tags=["Auth"])

RefreshTokenCookie = Annotated[
    str | None,
    Cookie(alias=settings.refresh_cookie_name, description="httpOnly refresh token set by login/register."),
]


def _set_refresh_cookie(response: Response, cookie: RefreshCookie) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=cookie.value,
        max_age=cookie.max_age,
        path=settings.refresh_cookie_path,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=settings.refresh_cookie_path,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )


@router.post(
    "/register",
    response_model=ApiResponse[AuthResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new account and start a session",
    responses=error_responses(409, 422),
)
def register(form: UserCreate, response: Response, db: Session = Depends(get_db)) -> ApiResponse[AuthResponse]:
    started = auth_service.register(db, form)
    _set_refresh_cookie(response, started.cookie)
    return ok(started.auth)


@router.post(
    "/login",
    response_model=ApiResponse[AuthResponse],
    summary="Log in and start a session",
    responses=error_responses(401, 422),
)
def login(form: LoginForm, response: Response, db: Session = Depends(get_db)) -> ApiResponse[AuthResponse]:
    started = auth_service.login(db, form)
    _set_refresh_cookie(response, started.cookie)
    return ok(started.auth)


@router.post(
    "/refresh",
    response_model=ApiResponse[AccessTokenResponse],
    summary="Exchange the refresh cookie for a new access token",
    responses=error_responses(401),
)
def refresh(
    response: Response,
    refresh_token: RefreshTokenCookie = None,
    db: Session = Depends(get_db),
) -> ApiResponse[AccessTokenResponse]:
    refreshed = auth_service.refresh(db, refresh_token)
    if refreshed.cookie is not None:
        _set_refresh_cookie(response, refreshed.cookie)
    return ok(refreshed.token)


@router.post(
    "/logout",
    response_model=ApiResponse[None],
    summary="End the current session",
)
def logout(
    response: Response,
    refresh_token: RefreshTokenCookie = None,
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    auth_service.logout(db, refresh_token)
    _clear_refresh_cookie(response)
    return ok(None)


@router.post(
    "/logout-all",
    response_model=ApiResponse[None],
    summary="End every session of the current user",
    responses=error_responses(401),
)
def logout_all(
    response: Response,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    auth_service.logout_all(db, user)
    _clear_refresh_cookie(response)
    return ok(None)


@router.get(
    "/me",
    response_model=ApiResponse[UserRead],
    summary="Get the current user",
    responses=error_responses(401),
)
def me(user: User = Depends(get_authenticated_user)) -> ApiResponse[UserRead]:
    return ok(UserRead.model_validate(user))
