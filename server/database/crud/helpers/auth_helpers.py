from datetime import timedelta
from sqlalchemy.orm import Session

from server.database.crud.helpers.create_access_token import create_access_token
from server.database.crud.helpers.hash_password import hash_password
from server.database.models.user import User
from server.database.schemas.user import AuthResponse, ResponseUser, TokenPayload, TokenResponse, UserCreate

def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()

def build_user(user_form: UserCreate) -> User:
    return User(
        username=user_form.username,
        hashed_password=hash_password(user_form.password)
    )

def generate_tokens(username: str) -> TokenResponse:
    payload = TokenPayload(sub=username)
    return TokenResponse(
        access_token=create_access_token(payload, timedelta(minutes=15)),
        refresh_token=create_access_token(payload, timedelta(days=7)),
    )

def create_auth_response(user: User) -> AuthResponse:
    return AuthResponse(
        user=ResponseUser(id=user.id, username=user.username),
        token=generate_tokens(user.username)
    )