
from datetime import timedelta
from fastapi import status
from jose import JWTError
import jwt
from server.database.crud.helpers.auth_helpers import build_user, create_auth_response, get_user_by_username
from server.database.crud.helpers.create_access_token import ALGORITHM, SECRET_KEY, create_access_token
from server.database.crud.helpers.verify_password import verify_password
from server.database.models.user import User
from server.database.schemas.user import LoginForm, TokenPayload, TokenRefreshRequest, TokenResponse, UserCreate
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from server.utils.errors import raise_http_error
from server.utils.logger import logger

def create_user(db: Session, user_form: UserCreate):
    existing_user = get_user_by_username(db, user_form.username)
    if existing_user:
        raise_http_error(
            status.HTTP_409_CONFLICT,
            detail="The username must be unique! Please try again.",
            code="USERNAME_EXISTS",
            field="username",
            hint="Try another username, this one is already taken."
        )

    try:
        new_user = build_user(user_form)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return create_auth_response(new_user)

    except IntegrityError as e:
        db.rollback()
        logger.warning(f"Integrity error while creating user '{user_form.username}': {e}")
        raise_http_error(
            status.HTTP_409_CONFLICT,
            detail="Username already exists.",
            code="INTEGRITY_CONSTRAINT",
            field="username"
        )

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error during user creation for '{user_form.username}': {e}", exc_info=True)
        raise_http_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while creating user.",
            code="DB_ERROR",
            hint="Please try again later."
        )

    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error while creating user '{user_form.username}': {e}", exc_info=True)
        raise_http_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error during user creation.",
            code="UNEXPECTED_ERROR"
        )

def login_user(db: Session, login_form: LoginForm):
    user = get_user_by_username(db, login_form.username)
    if not user:
        raise_http_error(
            status.HTTP_404_NOT_FOUND,
            detail="No user found for the username provided!",
            code="USER_NOT_FOUND",
            field="username",
            hint="Check your spelling or register if you don’t have an account."
        )

    if not verify_password(login_form.password, user.hashed_password):
        raise_http_error(
            status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password!",
            code="INVALID_CREDENTIALS",
            field="password",
            hint="Please double-check your password and try again."
        )

    return create_auth_response(user)
  
def refresh_access_token(refresh_data: TokenRefreshRequest, db: Session) -> TokenResponse:
    try:
        payload = jwt.decode(refresh_data.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if not username:
            raise_http_error(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
                code="INVALID_REFRESH_TOKEN",
                hint="Please log in again to obtain a new session."
            )
    except JWTError:
        raise_http_error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
            code="JWT_DECODE_ERROR",
            hint="Your session may have expired. Please log in again."
        )

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise_http_error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            code="USER_NOT_FOUND",
            hint="Try logging in again or contact support."
        )

    try:
        new_access_token = create_access_token(TokenPayload(sub=username), timedelta(minutes=15))
        new_refresh_token = create_access_token(TokenPayload(sub=username), timedelta(days=7))
    except Exception as e:
        logger.error(f"Error generating new tokens for user {username}: {e}", exc_info=True)
        raise_http_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate new tokens.",
            code="TOKEN_CREATION_ERROR",
            hint="Please try again later."
        )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token
    )

def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()