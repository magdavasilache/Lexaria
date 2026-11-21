from enum import StrEnum

from fastapi import status

from server.core.message_keys import MessageKey, MessageParam, render_english


class ErrorCode(StrEnum):
    BAD_REQUEST = "BAD_REQUEST"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_AUTHENTICATED = "NOT_AUTHENTICATED"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED"
    CONFLICT = "CONFLICT"
    INTEGRITY_CONSTRAINT = "INTEGRITY_CONSTRAINT"
    DB_ERROR = "DB_ERROR"
    UNEXPECTED_ERROR = "UNEXPECTED_ERROR"
    USERNAME_EXISTS = "USERNAME_EXISTS"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    INVALID_TOKEN = "INVALID_TOKEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    BOOK_NOT_FOUND = "BOOK_NOT_FOUND"
    AUTHOR_NOT_FOUND = "AUTHOR_NOT_FOUND"
    LANGUAGE_NOT_FOUND = "LANGUAGE_NOT_FOUND"
    COUNTRY_NOT_FOUND = "COUNTRY_NOT_FOUND"
    GENRE_NOT_FOUND = "GENRE_NOT_FOUND"
    AWARD_NOT_FOUND = "AWARD_NOT_FOUND"
    TOO_MANY_IMAGES = "TOO_MANY_IMAGES"
    IMAGE_NOT_ON_BOOK = "IMAGE_NOT_ON_BOOK"
    IMPORT_INVALID_FILE = "IMPORT_INVALID_FILE"
    IMPORT_ROW_SKIPPED = "IMPORT_ROW_SKIPPED"


class AppError(Exception):
    status_code: int = status.HTTP_400_BAD_REQUEST
    code: ErrorCode = ErrorCode.BAD_REQUEST

    def __init__(
        self,
        key: MessageKey,
        *,
        params: dict[str, MessageParam] | None = None,
        code: ErrorCode | None = None,
        field: str | None = None,
        hint_key: MessageKey | None = None,
        status_code: int | None = None,
    ) -> None:
        self.key = key
        self.params = params or {}
        self.message = render_english(key, self.params)
        super().__init__(self.message)
        self.field = field
        self.hint_key = hint_key
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code


class ValidationAppError(AppError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    code = ErrorCode.VALIDATION_ERROR


class AuthError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = ErrorCode.UNAUTHORIZED


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    code = ErrorCode.FORBIDDEN


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = ErrorCode.NOT_FOUND


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = ErrorCode.CONFLICT
