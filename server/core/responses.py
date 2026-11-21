from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

from server.core.message_keys import MessageParam

T = TypeVar("T")


class ApiErrorItem(BaseModel):
    code: str
    key: str
    params: dict[str, MessageParam] = Field(default_factory=dict)
    message: str
    field: str | None = None
    hint_key: str | None = None
    hint: str | None = None


class ApiWarning(BaseModel):
    code: str
    key: str
    params: dict[str, MessageParam] = Field(default_factory=dict)
    message: str


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    errors: list[ApiErrorItem] = Field(default_factory=list)
    warnings: list[ApiWarning] = Field(default_factory=list)
    meta: dict[str, Any] | None = None


def ok(data: T, *, warnings: list[ApiWarning] | None = None, meta: dict[str, Any] | None = None) -> ApiResponse[T]:
    return ApiResponse[T](success=True, data=data, warnings=warnings or [], meta=meta)


def fail(errors: list[ApiErrorItem], *, meta: dict[str, Any] | None = None) -> ApiResponse[None]:
    return ApiResponse[None](success=False, errors=errors, meta=meta)


def error_responses(*status_codes: int) -> dict[int | str, dict[str, Any]]:
    return {code: {"model": ApiResponse[None]} for code in (*status_codes, 500)}
