import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import bcrypt
import jwt

from server.core.config import settings
from server.core.errors import AuthError, ErrorCode
from server.core.message_keys import MessageKey

_DUMMY_HASH = bcrypt.hashpw(b"lexaria-timing-equalizer", bcrypt.gensalt()).decode("utf-8")
_REFRESH_SECRET_BYTES = 32


@dataclass(frozen=True)
class AccessClaims:
    user_id: int
    session_id: int


@dataclass(frozen=True)
class RefreshToken:
    session_id: int
    token_hash: str


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        return False


def burn_password_check(password: str) -> None:
    verify_password(password, _DUMMY_HASH)


def invalid_token_error() -> AuthError:
    return AuthError(MessageKey.INVALID_TOKEN, code=ErrorCode.INVALID_TOKEN, hint_key=MessageKey.LOGIN_AGAIN)


def session_expired_error() -> AuthError:
    return AuthError(MessageKey.SESSION_EXPIRED, code=ErrorCode.TOKEN_EXPIRED, hint_key=MessageKey.LOGIN_AGAIN)


def access_token_ttl() -> timedelta:
    return timedelta(minutes=settings.access_token_ttl_minutes)


def create_access_token(user_id: int, session_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "sid": str(session_id),
        "iat": now,
        "exp": now + access_token_ttl(),
        "jti": uuid4().hex,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> AccessClaims:
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            options={"require": ["sub", "sid", "exp", "iat"]},
        )
    except jwt.ExpiredSignatureError:
        raise session_expired_error() from None
    except jwt.InvalidTokenError:
        raise invalid_token_error() from None

    try:
        return AccessClaims(user_id=int(payload["sub"]), session_id=int(payload["sid"]))
    except (TypeError, ValueError):
        raise invalid_token_error() from None


def hash_refresh_secret(secret: str) -> str:
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()


def tokens_match(expected_hash: str | None, actual_hash: str) -> bool:
    return expected_hash is not None and hmac.compare_digest(expected_hash, actual_hash)


def new_refresh_token(session_id: int) -> tuple[str, str]:
    secret = secrets.token_urlsafe(_REFRESH_SECRET_BYTES)
    return f"{session_id}.{secret}", hash_refresh_secret(secret)


def new_refresh_secret_hash() -> str:
    return hash_refresh_secret(secrets.token_urlsafe(_REFRESH_SECRET_BYTES))


def parse_refresh_token(token: str) -> RefreshToken:
    session_part, _, secret = token.partition(".")
    if not session_part.isdigit() or not secret:
        raise invalid_token_error()
    return RefreshToken(session_id=int(session_part), token_hash=hash_refresh_secret(secret))
