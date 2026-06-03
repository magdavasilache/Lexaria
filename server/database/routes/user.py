from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from server.database.crud.user import create_user, login_user, refresh_access_token
from server.database.database import get_db
from server.database.schemas.responses import ErrorResponse
from server.database.schemas.user import AuthResponse, LoginForm, TokenRefreshRequest, TokenResponse, UserCreate, UserErrorResponse

router = APIRouter(prefix='/user', tags=["User"])

@router.post(
    "/create-user",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user",
    tags=["User"],
    responses={
        409: {"model": ErrorResponse, "description": "Username already exists"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
def create_user_route(user_form: UserCreate, db: Session = Depends(get_db)):
    return create_user(user_form=user_form, db=db)

@router.post(
    "/login-user",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Login user and return tokens",
    tags=["User"],
    responses={
        401: {"model": ErrorResponse, "description": "Invalid password"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
)
def login_user_route(user_form: LoginForm, db: Session = Depends(get_db)):
    return login_user(db=db, login_form=user_form)

@router.post("/refresh-token", response_model=TokenResponse, responses={401: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
def refresh_token_route(token_request: TokenRefreshRequest, db: Session = Depends(get_db)):
    return refresh_access_token(db=db, token_request=token_request)