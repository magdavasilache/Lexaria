from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from server.core.errors import AppError, ErrorCode
from server.core.message_keys import MessageKey, MessageParam, render_english
from server.core.responses import ApiErrorItem, fail
from server.core.validation_messages import message_for
from server.utils.logger import logger

_STATUS_CODES: dict[int, ErrorCode] = {
    status.HTTP_400_BAD_REQUEST: ErrorCode.BAD_REQUEST,
    status.HTTP_401_UNAUTHORIZED: ErrorCode.UNAUTHORIZED,
    status.HTTP_403_FORBIDDEN: ErrorCode.FORBIDDEN,
    status.HTTP_404_NOT_FOUND: ErrorCode.NOT_FOUND,
    status.HTTP_405_METHOD_NOT_ALLOWED: ErrorCode.METHOD_NOT_ALLOWED,
    status.HTTP_409_CONFLICT: ErrorCode.CONFLICT,
    status.HTTP_422_UNPROCESSABLE_ENTITY: ErrorCode.VALIDATION_ERROR,
}

_STATUS_KEYS: dict[int, MessageKey] = {
    status.HTTP_400_BAD_REQUEST: MessageKey.BAD_REQUEST,
    status.HTTP_401_UNAUTHORIZED: MessageKey.LOGIN_AGAIN,
    status.HTTP_403_FORBIDDEN: MessageKey.FORBIDDEN,
    status.HTTP_404_NOT_FOUND: MessageKey.NOT_FOUND,
    status.HTTP_405_METHOD_NOT_ALLOWED: MessageKey.METHOD_NOT_ALLOWED,
    status.HTTP_409_CONFLICT: MessageKey.CONFLICT,
}

_LOCATION_PARTS = {"body", "query", "path", "header", "cookie"}


def error_item(
    code: str,
    key: MessageKey,
    *,
    params: dict[str, MessageParam] | None = None,
    field: str | None = None,
    hint_key: MessageKey | None = None,
) -> ApiErrorItem:
    params = params or {}
    return ApiErrorItem(
        code=code,
        key=key,
        params=params,
        message=render_english(key, params),
        field=field,
        hint_key=hint_key,
        hint=render_english(hint_key) if hint_key else None,
    )


def request_id_of(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def error_response(
    request: Request,
    status_code: int,
    errors: list[ApiErrorItem],
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    body = fail(errors, meta={"request_id": request_id_of(request)})
    return JSONResponse(status_code=status_code, content=body.model_dump(mode="json"), headers=headers)


def unexpected_error_response(request: Request) -> JSONResponse:
    return error_response(
        request,
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        [error_item(ErrorCode.UNEXPECTED_ERROR, MessageKey.UNEXPECTED, hint_key=MessageKey.TRY_LATER)],
    )


async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
    headers = {"WWW-Authenticate": "Bearer"} if exc.status_code == status.HTTP_401_UNAUTHORIZED else None
    return error_response(
        request,
        exc.status_code,
        [error_item(exc.code, exc.key, params=exc.params, field=exc.field, hint_key=exc.hint_key)],
        headers,
    )


async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    fallback_code = _STATUS_CODES.get(exc.status_code, ErrorCode.UNEXPECTED_ERROR)
    key = _STATUS_KEYS.get(exc.status_code, MessageKey.REQUEST_FAILED)
    detail: Any = exc.detail
    if isinstance(detail, dict):
        item = error_item(detail.get("code") or fallback_code, key, field=detail.get("field"))
    else:
        item = error_item(fallback_code, key)
    if exc.status_code >= 500:
        logger.error("HTTP %s on %s %s: %s", exc.status_code, request.method, request.url.path, detail)
    return error_response(request, exc.status_code, [item], getattr(exc, "headers", None))


def _field_from_location(location: tuple[Any, ...]) -> str | None:
    parts = [str(part) for part in location if part not in _LOCATION_PARTS]
    return ".".join(parts) or None


async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = []
    for error in exc.errors():
        key, params = message_for(error)
        field = _field_from_location(tuple(error.get("loc", ())))
        errors.append(error_item(ErrorCode.VALIDATION_ERROR, key, params=params, field=field))
    return error_response(request, status.HTTP_422_UNPROCESSABLE_ENTITY, errors)


async def handle_integrity_error(request: Request, exc: IntegrityError) -> JSONResponse:
    logger.warning("Integrity error on %s %s: %s", request.method, request.url.path, exc.orig)
    return error_response(
        request,
        status.HTTP_409_CONFLICT,
        [error_item(ErrorCode.INTEGRITY_CONSTRAINT, MessageKey.CONFLICT)],
    )


async def handle_database_error(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.error("Database error on %s %s", request.method, request.url.path, exc_info=exc)
    return error_response(
        request,
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        [error_item(ErrorCode.DB_ERROR, MessageKey.DATABASE, hint_key=MessageKey.TRY_LATER)],
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, handle_app_error)
    app.add_exception_handler(StarletteHTTPException, handle_http_exception)
    app.add_exception_handler(RequestValidationError, handle_validation_error)
    app.add_exception_handler(IntegrityError, handle_integrity_error)
    app.add_exception_handler(SQLAlchemyError, handle_database_error)
