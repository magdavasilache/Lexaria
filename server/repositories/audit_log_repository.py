from datetime import datetime

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from server.database.models.audit_log import AuditAction, AuditLog, AuditOutcome


def add_audit_log(db: Session, entry: AuditLog) -> AuditLog:
    db.add(entry)
    db.flush()
    return entry


def list_audit_logs(
    db: Session,
    *,
    user_id: int | None,
    action: AuditAction | None,
    outcome: AuditOutcome | None,
    date_from: datetime | None,
    date_to: datetime | None,
    offset: int,
    limit: int,
) -> tuple[list[AuditLog], int]:
    statement: Select[tuple[AuditLog]] = select(AuditLog)
    if user_id is not None:
        statement = statement.where(AuditLog.user_id == user_id)
    if action is not None:
        statement = statement.where(AuditLog.action == action)
    if outcome is not None:
        statement = statement.where(AuditLog.outcome == outcome)
    if date_from is not None:
        statement = statement.where(AuditLog.created_at >= date_from)
    if date_to is not None:
        statement = statement.where(AuditLog.created_at <= date_to)

    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    rows = db.scalars(
        statement.order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).offset(offset).limit(limit)
    ).all()
    return list(rows), total
