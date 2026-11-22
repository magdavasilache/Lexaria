from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from server.core.errors import AuthError, ErrorCode, ForbiddenError
from server.core.message_keys import MessageKey
from server.database.database import get_db
from server.database.models.audit_log import AuditAction, AuditOutcome
from server.database.models.chatbot import DEFAULT_RESPONSE_LANGUAGE, ResponseLanguage
from server.database.models.user import User
from server.services import audit_service, auth_service

bearer_scheme = HTTPBearer(auto_error=False)


def get_authenticated_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise AuthError(
            MessageKey.NOT_AUTHENTICATED,
            code=ErrorCode.NOT_AUTHENTICATED,
            hint_key=MessageKey.LOGIN_AND_RETRY,
        )
    return auth_service.authenticate(db, credentials.credentials)


def get_admin_user(
    request: Request,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> User:
    if not user.is_admin:
        entry = audit_service.AuditEntry(params={"username": user.username, "path": request.url.path})
        entry.set_actor(user)
        error = ForbiddenError(MessageKey.FORBIDDEN)
        audit_service.record(db, AuditAction.ACCESS_DENIED, outcome=AuditOutcome.FAILURE, entry=entry, error=error)
        db.commit()
        raise error
    return user


def get_request_language(request: Request) -> ResponseLanguage:
    for part in request.headers.get("accept-language", "").split(","):
        code = part.split(";")[0].strip().lower().split("-")[0]
        if code in ResponseLanguage:
            return ResponseLanguage(code)
    return DEFAULT_RESPONSE_LANGUAGE
