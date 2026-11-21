from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from server.core.errors import AppError
from server.core.message_keys import MessageKey, MessageParam, render_english
from server.core.request_context import current_request_context
from server.database.models.audit_log import AuditAction, AuditLog, AuditOutcome
from server.database.models.user import User
from server.database.schemas.audit_log import AuditActionRead, AuditLogFilters, AuditLogRead
from server.repositories.audit_log_repository import add_audit_log, list_audit_logs
from server.services.audit_actions import AUDIT_ACTIONS


@dataclass
class AuditEntry:
    user_id: int | None = None
    username: str | None = None
    params: dict[str, MessageParam] = field(default_factory=dict)
    entity_type: str | None = None
    entity_id: int | None = None

    def set_actor(self, user: User) -> None:
        self.user_id = user.id
        self.username = user.username

    def set_entity(self, entity_type: str, entity_id: int) -> None:
        self.entity_type = entity_type
        self.entity_id = entity_id


def record(
    db: Session,
    action: AuditAction,
    *,
    outcome: AuditOutcome,
    entry: AuditEntry | None = None,
    error: AppError | None = None,
) -> AuditLog:
    entry = entry or AuditEntry()
    params = dict(entry.params)
    if error is not None:
        params["reason"] = [error.key.value]
    context = current_request_context()
    return add_audit_log(
        db,
        AuditLog(
            user_id=entry.user_id,
            username=entry.username,
            method=context.method if context else None,
            path=context.path if context else None,
            action=action.value,
            description_key=AUDIT_ACTIONS[action].description(outcome).value,
            params=params,
            outcome=outcome.value,
            error_code=error.code.value if error else None,
            entity_type=entry.entity_type,
            entity_id=entry.entity_id,
            request_id=context.request_id if context else None,
            ip_address=context.ip_address if context else None,
            user_agent=context.user_agent if context else None,
        ),
    )


@contextmanager
def track(
    db: Session,
    action: AuditAction,
    *,
    actor: User | None = None,
    params: dict[str, MessageParam] | None = None,
) -> Iterator[AuditEntry]:
    entry = AuditEntry(params=dict(params or {}))
    if actor is not None:
        entry.set_actor(actor)
    try:
        yield entry
    except AppError as error:
        db.rollback()
        record(db, action, outcome=AuditOutcome.FAILURE, entry=entry, error=error)
        db.commit()
        raise
    except Exception:
        db.rollback()
        raise
    record(db, action, outcome=AuditOutcome.SUCCESS, entry=entry)
    db.commit()


def _to_read(log: AuditLog) -> AuditLogRead:
    spec = AUDIT_ACTIONS.get(AuditAction(log.action)) if log.action in AuditAction else None
    description_key = MessageKey(log.description_key) if log.description_key in MessageKey else None
    return AuditLogRead(
        id=log.id,
        created_at=log.created_at,
        user_id=log.user_id,
        username=log.username,
        method=log.method,
        path=log.path,
        action=log.action,
        action_key=spec.label.value if spec else None,
        action_message=render_english(spec.label) if spec else None,
        description_key=log.description_key,
        params=log.params,
        description=render_english(description_key, log.params) if description_key else log.description_key,
        outcome=log.outcome,
        error_code=log.error_code,
        entity_type=log.entity_type,
        entity_id=log.entity_id,
        request_id=log.request_id,
        ip_address=log.ip_address,
        user_agent=log.user_agent,
    )


def list_logs(db: Session, filters: AuditLogFilters) -> tuple[list[AuditLogRead], int]:
    logs, total = list_audit_logs(
        db,
        user_id=filters.user_id,
        action=filters.action,
        outcome=filters.outcome,
        date_from=filters.date_from,
        date_to=filters.date_to,
        offset=filters.offset,
        limit=filters.limit,
    )
    return [_to_read(log) for log in logs], total


def list_actions() -> list[AuditActionRead]:
    return [
        AuditActionRead(id=action, key=spec.label.value, message=render_english(spec.label))
        for action, spec in AUDIT_ACTIONS.items()
    ]
