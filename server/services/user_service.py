from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from server.core.errors import ErrorCode, ForbiddenError, NotFoundError
from server.core.message_keys import MessageKey
from server.database.models.audit_log import AuditAction
from server.database.models.user import AVATAR_MAX_MB, User
from server.database.schemas.user import AvatarUpload, BanCreate, UserAdminRead, UserRead
from server.repositories.session_repository import revoke_user_sessions
from server.repositories.user_repository import get_user_by_id, list_users as list_user_rows
from server.services import audit_service
from server.services.images import MB, ImageFolder, delete_images, image_name, image_url, save_image

USER_ENTITY = "user"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _admin_read(user: User, now: datetime) -> UserAdminRead:
    return UserAdminRead(
        **UserRead.model_validate(user).model_dump(),
        banned_at=user.banned_at,
        banned_until=user.banned_until,
        ban_reason=user.ban_reason,
        locked_until=user.locked_until,
        is_banned=user.is_banned_at(now),
        is_locked=user.is_locked_at(now),
    )


def _require_user(db: Session, user_id: int) -> User:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise NotFoundError(MessageKey.USER_NOT_FOUND, code=ErrorCode.USER_NOT_FOUND)
    return user


def list_users(db: Session) -> list[UserAdminRead]:
    now = _now()
    return [_admin_read(user, now) for user in list_user_rows(db)]


def ban_user(db: Session, user_id: int, form: BanCreate, admin: User) -> UserAdminRead:
    params = {"username": admin.username, "user_id": user_id}
    with audit_service.track(db, AuditAction.USER_BAN, actor=admin, params=params) as entry:
        entry.set_entity(USER_ENTITY, user_id)
        target = _require_user(db, user_id)
        entry.params["target"] = target.username
        if target.id == admin.id:
            raise ForbiddenError(MessageKey.CANNOT_BAN_SELF, code=ErrorCode.CANNOT_BAN_USER)
        if target.is_admin:
            raise ForbiddenError(MessageKey.CANNOT_BAN_ADMIN, code=ErrorCode.CANNOT_BAN_USER)
        now = _now()
        target.banned_at = now
        target.banned_until = now + timedelta(days=form.duration_days) if form.duration_days else None
        target.ban_reason = form.reason
        revoke_user_sessions(db, target.id, now)
    return _admin_read(target, _now())


def unban_user(db: Session, user_id: int, admin: User) -> UserAdminRead:
    params = {"username": admin.username, "user_id": user_id}
    with audit_service.track(db, AuditAction.USER_UNBAN, actor=admin, params=params) as entry:
        entry.set_entity(USER_ENTITY, user_id)
        target = _require_user(db, user_id)
        entry.params["target"] = target.username
        target.banned_at = None
        target.banned_until = None
        target.ban_reason = None
    return _admin_read(target, _now())


def update_avatar(db: Session, user: User, form: AvatarUpload) -> UserRead:
    saved: str | None = None
    replaced: str | None = None
    try:
        with audit_service.track(db, AuditAction.USER_AVATAR_UPDATE, actor=user, params={"username": user.username}) as entry:
            entry.set_entity(USER_ENTITY, user.id)
            saved = save_image(form.image, ImageFolder.USERS, "image", max_bytes=AVATAR_MAX_MB * MB, verify_content=True)
            replaced = image_name(ImageFolder.USERS, user.avatar_url)
            user.avatar_url = image_url(ImageFolder.USERS, saved)
    except BaseException:
        delete_images([saved], ImageFolder.USERS)
        raise
    delete_images([replaced], ImageFolder.USERS)
    return UserRead.model_validate(user)


def remove_avatar(db: Session, user: User) -> UserRead:
    with audit_service.track(db, AuditAction.USER_AVATAR_REMOVE, actor=user, params={"username": user.username}) as entry:
        entry.set_entity(USER_ENTITY, user.id)
        removed = image_name(ImageFolder.USERS, user.avatar_url)
        user.avatar_url = None
    delete_images([removed], ImageFolder.USERS)
    return UserRead.model_validate(user)
