from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base

TOKEN_HASH_LENGTH = 64
SESSION_IP_ADDRESS_MAX_LENGTH = 45
SESSION_USER_AGENT_MAX_LENGTH = 255


def as_utc(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


class UserSession(Base):
    __tablename__ = "user_sessions"
    __table_args__ = (
        Index("ix_user_sessions_user_id", "user_id"),
        Index("ix_user_sessions_expires_at", "expires_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(TOKEN_HASH_LENGTH), nullable=False)
    previous_token_hash: Mapped[str | None] = mapped_column(String(TOKEN_HASH_LENGTH))
    remember: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_used_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    rotated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    idle_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ip_address: Mapped[str | None] = mapped_column(String(SESSION_IP_ADDRESS_MAX_LENGTH))
    user_agent: Mapped[str | None] = mapped_column(String(SESSION_USER_AGENT_MAX_LENGTH))

    user = relationship("User", back_populates="sessions")

    def is_expired(self, now: datetime) -> bool:
        return now >= as_utc(self.idle_expires_at) or now >= as_utc(self.expires_at)

    def is_active(self, now: datetime) -> bool:
        return self.revoked_at is None and not self.is_expired(now)
