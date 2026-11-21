import re
from datetime import datetime
from typing import Annotated

from pydantic import Field, field_validator

from server.core.message_keys import MessageKey, key_error

from server.database.models.user import (
    AVATAR_URL_MAX_LENGTH,
    BIO_MAX_LENGTH,
    DISPLAY_NAME_MAX_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
    USERNAME_PATTERN,
    UserRole,
)
from server.database.schemas.base import InputSchema, OutputSchema, RawStr

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_BYTES = 72
LOGIN_PASSWORD_MAX_LENGTH = 128

PASSWORD_REQUIREMENTS: tuple[tuple[str, MessageKey], ...] = (
    (r"[A-Z]", MessageKey.PASSWORD_UPPERCASE),
    (r"[a-z]", MessageKey.PASSWORD_LOWERCASE),
    (r"[0-9]", MessageKey.PASSWORD_NUMBER),
    (r"[^A-Za-z0-9]", MessageKey.PASSWORD_SPECIAL),
)

Username = Annotated[
    str,
    Field(
        min_length=USERNAME_MIN_LENGTH,
        max_length=USERNAME_MAX_LENGTH,
        description=f"{USERNAME_MIN_LENGTH}-{USERNAME_MAX_LENGTH} characters: letters, numbers, dots, dashes and underscores.",
        json_schema_extra={"pattern": USERNAME_PATTERN},
        examples=["book_lover"],
    ),
]


class UserCreate(InputSchema):
    username: Username
    password: Annotated[
        RawStr,
        Field(
            min_length=PASSWORD_MIN_LENGTH,
            description=(
                f"At least {PASSWORD_MIN_LENGTH} characters and at most {PASSWORD_MAX_BYTES} bytes, "
                "with an uppercase letter, a lowercase letter, a number and a special character."
            ),
        ),
    ]

    @field_validator("username")
    @classmethod
    def username_characters(cls, value: str) -> str:
        if not re.fullmatch(USERNAME_PATTERN, value):
            raise key_error(MessageKey.USERNAME_PATTERN)
        return value

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if len(value.encode("utf-8")) > PASSWORD_MAX_BYTES:
            raise key_error(MessageKey.PASSWORD_MAX_BYTES, max_bytes=PASSWORD_MAX_BYTES)
        missing = [key.value for pattern, key in PASSWORD_REQUIREMENTS if not re.search(pattern, value)]
        if missing:
            raise key_error(MessageKey.PASSWORD_MISSING, missing=missing)
        return value


class LoginForm(InputSchema):
    username: Annotated[str, Field(min_length=1, max_length=USERNAME_MAX_LENGTH)]
    password: Annotated[RawStr, Field(min_length=1, max_length=LOGIN_PASSWORD_MAX_LENGTH)]
    remember_me: Annotated[
        bool,
        Field(description="Keep the session after the browser closes (up to the session limits)."),
    ] = False


class AccessTokenResponse(OutputSchema):
    access_token: str
    token_type: str = "bearer"
    expires_in: Annotated[int, Field(description="Seconds until the access token expires.")]


class UserRead(OutputSchema):
    id: int
    username: Annotated[str, Field(max_length=USERNAME_MAX_LENGTH)]
    role: UserRole
    display_name: Annotated[str | None, Field(max_length=DISPLAY_NAME_MAX_LENGTH)]
    avatar_url: Annotated[str | None, Field(max_length=AVATAR_URL_MAX_LENGTH)]
    bio: Annotated[str | None, Field(max_length=BIO_MAX_LENGTH)]
    created_at: datetime


class AuthResponse(OutputSchema):
    user: UserRead
    token: AccessTokenResponse


class UserOut(OutputSchema):
    username: Annotated[str, Field(max_length=USERNAME_MAX_LENGTH)]
