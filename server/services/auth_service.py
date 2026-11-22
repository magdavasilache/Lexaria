import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from server.core.config import settings
from server.core.errors import AppError, AuthError, ConflictError, ErrorCode, ForbiddenError, TooManyRequestsError
from server.core.message_keys import MessageKey
from server.core.request_context import current_request_context
from server.core.security import (
    access_token_ttl,
    burn_password_check,
    create_access_token,
    decode_access_token,
    hash_password,
    invalid_token_error,
    new_refresh_secret_hash,
    new_refresh_token,
    parse_refresh_token,
    session_expired_error,
    tokens_match,
    verify_password,
)
from server.database.models.audit_log import AuditAction, AuditOutcome
from server.database.models.user import User
from server.database.models.user_session import SESSION_USER_AGENT_MAX_LENGTH, UserSession, as_utc
from server.database.schemas.user import AccessTokenResponse, AuthResponse, LoginForm, UserCreate, UserRead
from server.repositories.session_repository import add_session, delete_stale_sessions, get_session, revoke_user_sessions
from server.repositories.user_repository import add_user, get_user_by_username, set_login_failures
from server.services import audit_service


@dataclass(frozen=True)
class RefreshCookie:
    value: str
    max_age: int | None


@dataclass(frozen=True)
class SessionStart:
    auth: AuthResponse
    cookie: RefreshCookie


@dataclass(frozen=True)
class SessionRefresh:
    token: AccessTokenResponse
    cookie: RefreshCookie | None


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _idle_ttl() -> timedelta:
    return timedelta(days=settings.session_idle_ttl_days)


def _absolute_ttl() -> timedelta:
    return timedelta(days=settings.session_absolute_ttl_days)


def _idle_deadline(session: UserSession, now: datetime) -> datetime:
    return min(now + _idle_ttl(), as_utc(session.expires_at))


def _access_token(session: UserSession) -> AccessTokenResponse:
    return AccessTokenResponse(
        access_token=create_access_token(session.user_id, session.id),
        expires_in=int(access_token_ttl().total_seconds()),
    )


def _cookie(session: UserSession, token: str, now: datetime) -> RefreshCookie:
    if not session.remember:
        return RefreshCookie(token, None)
    remaining = as_utc(session.idle_expires_at) - now
    return RefreshCookie(token, max(int(remaining.total_seconds()), 0))


def _open_session(db: Session, user: User, remember: bool) -> tuple[UserSession, str]:
    now = _now()
    delete_stale_sessions(db, user.id, now)
    context = current_request_context()
    user_agent = context.user_agent if context else None
    session = UserSession(
        user_id=user.id,
        token_hash=new_refresh_secret_hash(),
        remember=remember,
        created_at=now,
        last_used_at=now,
        rotated_at=now,
        expires_at=now + _absolute_ttl(),
        idle_expires_at=min(now + _idle_ttl(), now + _absolute_ttl()),
        ip_address=context.ip_address if context else None,
        user_agent=user_agent[:SESSION_USER_AGENT_MAX_LENGTH] if user_agent else None,
    )
    add_session(db, session)
    token, token_hash = new_refresh_token(session.id)
    session.token_hash = token_hash
    db.flush()
    return session, token


def _start(user: User, session: UserSession, token: str) -> SessionStart:
    return SessionStart(
        auth=AuthResponse(user=UserRead.model_validate(user), token=_access_token(session)),
        cookie=_cookie(session, token, _now()),
    )


def _invalid_credentials() -> AuthError:
    return AuthError(
        MessageKey.INVALID_CREDENTIALS,
        code=ErrorCode.INVALID_CREDENTIALS,
        hint_key=MessageKey.INVALID_CREDENTIALS_HINT,
    )


def _lock_minutes(locked_until: datetime, now: datetime) -> int:
    return max(math.ceil((as_utc(locked_until) - now).total_seconds() / 60), 1)


def _locked(locked_until: datetime, now: datetime) -> TooManyRequestsError:
    return TooManyRequestsError(
        MessageKey.ACCOUNT_LOCKED,
        params={"minutes": _lock_minutes(locked_until, now)},
        code=ErrorCode.ACCOUNT_LOCKED,
    )


def _failed_login(db: Session, entry: audit_service.AuditEntry, user: User, now: datetime) -> AppError:
    attempts = user.failed_login_attempts + 1
    user_id = user.id
    if attempts >= settings.login_max_attempts:
        locked_until = now + timedelta(minutes=settings.login_lock_minutes)
        entry.on_failure(lambda: set_login_failures(db, user_id, 0, locked_until))
        return _locked(locked_until, now)
    entry.on_failure(lambda: set_login_failures(db, user_id, attempts, None))
    return _invalid_credentials()


def format_ban_until(value: datetime) -> str:
    return as_utc(value).strftime("%Y-%m-%d %H:%M UTC")


def _banned(user: User) -> ForbiddenError:
    reason = user.ban_reason or ""
    if user.banned_until is None:
        return ForbiddenError(MessageKey.ACCOUNT_BANNED, params={"reason": reason}, code=ErrorCode.ACCOUNT_BANNED)
    return ForbiddenError(
        MessageKey.ACCOUNT_SUSPENDED,
        params={"reason": reason, "until": format_ban_until(user.banned_until)},
        code=ErrorCode.ACCOUNT_BANNED,
    )


def _not_authenticated() -> AuthError:
    return AuthError(MessageKey.NOT_AUTHENTICATED, code=ErrorCode.NOT_AUTHENTICATED, hint_key=MessageKey.LOGIN_AGAIN)


def register(db: Session, form: UserCreate) -> SessionStart:
    with audit_service.track(db, AuditAction.USER_REGISTER, params={"username": form.username}) as entry:
        user = User(username=form.username, hashed_password=hash_password(form.password))
        try:
            add_user(db, user)
        except IntegrityError:
            raise ConflictError(
                MessageKey.USERNAME_EXISTS,
                code=ErrorCode.USERNAME_EXISTS,
                field="username",
                hint_key=MessageKey.USERNAME_EXISTS_HINT,
            ) from None
        entry.set_actor(user)
        entry.set_entity("user", user.id)
        session, token = _open_session(db, user, remember=True)
    db.refresh(user)
    return _start(user, session, token)


def login(db: Session, form: LoginForm) -> SessionStart:
    with audit_service.track(db, AuditAction.USER_LOGIN, params={"username": form.username}) as entry:
        user = get_user_by_username(db, form.username)
        if user is None:
            burn_password_check(form.password)
            raise _invalid_credentials()
        now = _now()
        if user.is_locked_at(now):
            raise _locked(user.locked_until, now)
        if not verify_password(form.password, user.hashed_password):
            raise _failed_login(db, entry, user, now)
        entry.set_actor(user)
        if user.is_banned_at(now):
            raise _banned(user)
        user.failed_login_attempts = 0
        user.locked_until = None
        session, token = _open_session(db, user, remember=form.remember_me)
    return _start(user, session, token)


def _revoke_reused_session(db: Session, session: UserSession, now: datetime) -> None:
    session.revoked_at = now
    entry = audit_service.AuditEntry(params={"username": session.user.username})
    entry.set_actor(session.user)
    entry.set_entity("user_session", session.id)
    audit_service.record(db, AuditAction.SESSION_REUSE_DETECTED, outcome=AuditOutcome.SUCCESS, entry=entry)
    db.commit()


def _within_grace(session: UserSession, token_hash: str, now: datetime) -> bool:
    grace = timedelta(seconds=settings.refresh_grace_seconds)
    return tokens_match(session.previous_token_hash, token_hash) and now - as_utc(session.rotated_at) <= grace


def refresh(db: Session, refresh_token: str | None) -> SessionRefresh:
    with audit_service.track(db, AuditAction.TOKEN_REFRESH) as entry:
        if not refresh_token:
            raise _not_authenticated()
        presented = parse_refresh_token(refresh_token)
        session = get_session(db, presented.session_id)
        if session is None or session.user is None or session.revoked_at is not None:
            raise invalid_token_error()
        entry.set_actor(session.user)
        entry.params["username"] = session.user.username
        now = _now()
        if session.is_expired(now):
            raise session_expired_error()

        new_token: str | None = None
        if tokens_match(session.token_hash, presented.token_hash):
            new_token, new_hash = new_refresh_token(session.id)
            session.previous_token_hash = session.token_hash
            session.token_hash = new_hash
            session.rotated_at = now
        elif not _within_grace(session, presented.token_hash, now):
            _revoke_reused_session(db, session, now)
            raise invalid_token_error()

        session.last_used_at = now
        session.idle_expires_at = _idle_deadline(session, now)
        result = SessionRefresh(
            token=_access_token(session),
            cookie=_cookie(session, new_token, now) if new_token else None,
        )
    return result


def logout(db: Session, refresh_token: str | None) -> None:
    if not refresh_token:
        return
    try:
        presented = parse_refresh_token(refresh_token)
    except AuthError:
        return
    session = get_session(db, presented.session_id)
    if session is None or session.user is None or session.revoked_at is not None:
        return
    if not (
        tokens_match(session.token_hash, presented.token_hash)
        or tokens_match(session.previous_token_hash, presented.token_hash)
    ):
        return
    with audit_service.track(db, AuditAction.USER_LOGOUT, actor=session.user, params={"username": session.user.username}):
        session.revoked_at = _now()


def logout_all(db: Session, user: User) -> None:
    with audit_service.track(db, AuditAction.USER_LOGOUT_ALL, actor=user, params={"username": user.username}):
        revoke_user_sessions(db, user.id, _now())


def authenticate(db: Session, access_token: str) -> User:
    claims = decode_access_token(access_token)
    session = get_session(db, claims.session_id)
    if session is None or session.user_id != claims.user_id or session.revoked_at is not None:
        raise invalid_token_error()
    if session.is_expired(_now()):
        raise session_expired_error()
    if session.user is None:
        raise AuthError(MessageKey.ACCOUNT_GONE, code=ErrorCode.USER_NOT_FOUND, hint_key=MessageKey.LOGIN_AGAIN)
    return session.user
