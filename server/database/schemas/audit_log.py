from datetime import datetime
from typing import Annotated

from pydantic import Field, ValidationInfo, field_validator

from server.core.message_keys import MessageKey, MessageParam, key_error
from server.database.models.audit_log import (
    AUDIT_ACTION_MAX_LENGTH,
    AUDIT_KEY_MAX_LENGTH,
    AUDIT_PATH_MAX_LENGTH,
    ENTITY_TYPE_MAX_LENGTH,
    ERROR_CODE_MAX_LENGTH,
    HTTP_METHOD_MAX_LENGTH,
    IP_ADDRESS_MAX_LENGTH,
    REQUEST_ID_MAX_LENGTH,
    USER_AGENT_MAX_LENGTH,
    AuditAction,
    AuditOutcome,
)
from server.database.models.user import USERNAME_MAX_LENGTH
from server.database.schemas.base import InputSchema, OutputSchema

AUDIT_PAGE_SIZE_DEFAULT = 25
AUDIT_PAGE_SIZE_MAX = 100


class AuditLogFilters(InputSchema):
    user_id: Annotated[int | None, Field(ge=1)] = None
    action: AuditAction | None = None
    outcome: AuditOutcome | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    offset: Annotated[int, Field(ge=0)] = 0
    limit: Annotated[int, Field(ge=1, le=AUDIT_PAGE_SIZE_MAX)] = AUDIT_PAGE_SIZE_DEFAULT

    @field_validator("date_to")
    @classmethod
    def date_range_is_ordered(cls, value: datetime | None, info: ValidationInfo) -> datetime | None:
        date_from = info.data.get("date_from")
        if value is not None and date_from is not None and value < date_from:
            raise key_error(MessageKey.DATE_RANGE)
        return value


class AuditActionRead(OutputSchema):
    id: AuditAction
    key: str
    message: str


class AuditLogRead(OutputSchema):
    id: int
    created_at: datetime
    user_id: int | None
    username: Annotated[str | None, Field(max_length=USERNAME_MAX_LENGTH)]
    method: Annotated[str | None, Field(max_length=HTTP_METHOD_MAX_LENGTH)]
    path: Annotated[str | None, Field(max_length=AUDIT_PATH_MAX_LENGTH)]
    action: Annotated[str, Field(max_length=AUDIT_ACTION_MAX_LENGTH)]
    action_key: str | None
    action_message: str | None
    description_key: Annotated[str, Field(max_length=AUDIT_KEY_MAX_LENGTH)]
    params: dict[str, MessageParam]
    description: str
    outcome: AuditOutcome
    error_code: Annotated[str | None, Field(max_length=ERROR_CODE_MAX_LENGTH)]
    entity_type: Annotated[str | None, Field(max_length=ENTITY_TYPE_MAX_LENGTH)]
    entity_id: int | None
    request_id: Annotated[str | None, Field(max_length=REQUEST_ID_MAX_LENGTH)]
    ip_address: Annotated[str | None, Field(max_length=IP_ADDRESS_MAX_LENGTH)]
    user_agent: Annotated[str | None, Field(max_length=USER_AGENT_MAX_LENGTH)]
