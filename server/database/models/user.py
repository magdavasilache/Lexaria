from datetime import datetime
from enum import IntEnum

from sqlalchemy import CheckConstraint, DateTime, Index, Integer, String, func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base
from server.database.models.genres import user_genres
from server.database.models.likes import CommentLike, ReviewLike
from server.database.models.user_session import as_utc

USERNAME_MIN_LENGTH = 3
USERNAME_MAX_LENGTH = 30
USERNAME_PATTERN = r"^[A-Za-z0-9_.-]+$"
DISPLAY_NAME_MAX_LENGTH = 60
AVATAR_URL_MAX_LENGTH = 500
BIO_MAX_LENGTH = 500
READING_GOAL_MINUTES_MIN = 1
READING_GOAL_MINUTES_MAX = 1440
AVATAR_MAX_MB = 2
AVATAR_SIZE_PX = 512
BAN_REASON_MAX_LENGTH = 500
BAN_DURATION_DAYS_MAX = 3650


class UserRole(IntEnum):
    ADMIN = 1
    FREE = 2
    PREMIUM = 3


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(f"length(username) >= {USERNAME_MIN_LENGTH}", name="ck_users_username_min_length"),
        CheckConstraint(
            f"role IN ({', '.join(str(int(role)) for role in UserRole)})",
            name="ck_users_role_valid",
        ),
        CheckConstraint(
            f"daily_reading_goal_minutes BETWEEN {READING_GOAL_MINUTES_MIN} AND {READING_GOAL_MINUTES_MAX}",
            name="ck_users_daily_reading_goal_range",
        ),
        CheckConstraint("failed_login_attempts >= 0", name="ck_users_failed_login_attempts_non_negative"),
        CheckConstraint(
            "(banned_at IS NULL AND banned_until IS NULL AND ban_reason IS NULL)"
            " OR (banned_at IS NOT NULL AND ban_reason IS NOT NULL"
            " AND (banned_until IS NULL OR banned_until > banned_at))",
            name="ck_users_ban_consistent",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(USERNAME_MAX_LENGTH), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[int] = mapped_column(
        Integer, nullable=False, default=UserRole.FREE, server_default=str(int(UserRole.FREE))
    )
    display_name: Mapped[str | None] = mapped_column(String(DISPLAY_NAME_MAX_LENGTH))
    avatar_url: Mapped[str | None] = mapped_column(String(AVATAR_URL_MAX_LENGTH))
    bio: Mapped[str | None] = mapped_column(String(BIO_MAX_LENGTH))
    daily_reading_goal_minutes: Mapped[int | None] = mapped_column(Integer)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    banned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    banned_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ban_reason: Mapped[str | None] = mapped_column(String(BAN_REASON_MAX_LENGTH))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    created_books = relationship("Book", back_populates="created_by", passive_deletes=True)
    user_book_statuses = relationship("UserBookStatus", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    favorite_genres = relationship("Genre", secondary=user_genres)
    liked_reviews = relationship(ReviewLike, back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    liked_comments = relationship(CommentLike, back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    readings = relationship("Reading", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    challenges = relationship("ReadingChallenge", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)

    @hybrid_property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    @hybrid_property
    def is_premium(self) -> bool:
        return self.role == UserRole.PREMIUM

    def is_banned_at(self, now: datetime) -> bool:
        return self.banned_at is not None and (self.banned_until is None or as_utc(self.banned_until) > now)

    def is_locked_at(self, now: datetime) -> bool:
        return self.locked_until is not None and as_utc(self.locked_until) > now


Index("uq_users_username_lower", func.lower(User.username), unique=True)
