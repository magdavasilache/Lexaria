from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.core.dependencies import get_admin_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.schemas.audit_log import AuditActionRead, AuditLogFilters, AuditLogRead
from server.services import audit_service

router = APIRouter(prefix="/admin/audit-logs", tags=["Audit log"], dependencies=[Depends(get_admin_user)])


@router.get(
    "",
    response_model=ApiResponse[list[AuditLogRead]],
    summary="List audit log entries, newest first",
    responses=error_responses(401, 403, 422),
)
def list_audit_logs(
    filters: Annotated[AuditLogFilters, Query()],
    db: Session = Depends(get_db),
) -> ApiResponse[list[AuditLogRead]]:
    logs, total = audit_service.list_logs(db, filters)
    return ok(logs, meta={"total": total, "offset": filters.offset, "limit": filters.limit})


@router.get(
    "/actions",
    response_model=ApiResponse[list[AuditActionRead]],
    summary="List the actions that can appear in the audit log",
    responses=error_responses(401, 403),
)
def list_audit_actions() -> ApiResponse[list[AuditActionRead]]:
    return ok(audit_service.list_actions())
