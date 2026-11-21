from datetime import datetime
from enum import StrEnum

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base


class ReadingStatus(StrEnum):
    WANT_TO_READ = "want_to_read"
    CURRENTLY_READING = "currently_reading"
    READ = "read"
    DID_NOT_FINISH = "did_not_finish"


READING_STATUS_MAX_LENGTH = 20


class UserBookStatus(Base):
    __tablename__ = "user_book_status"
    __table_args__ = (
        CheckConstraint(
            f"status IN ({', '.join(repr(status.value) for status in ReadingStatus)})",
            name="ck_user_book_status_status_valid",
        ),
        Index("ix_user_book_status_user_id_status", "user_id", "status"),
    )

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    status: Mapped[str] = mapped_column(String(READING_STATUS_MAX_LENGTH), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="user_book_statuses")
    book = relationship("Book", back_populates="user_book_statuses")
