from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, func, select
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from server.database.database import Base
from server.database.models.likes import CommentLike

COMMENT_CONTENT_MAX_LENGTH = 2000


class Comment(Base):
    __tablename__ = "comments"
    __table_args__ = (Index("ix_comments_review_id", "review_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    review_id: Mapped[int] = mapped_column(ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(String(COMMENT_CONTENT_MAX_LENGTH), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    likes_count: Mapped[int] = column_property(
        select(func.count()).where(CommentLike.comment_id == id).correlate_except(CommentLike).scalar_subquery()
    )

    likes = relationship("CommentLike", back_populates="comment", cascade="all, delete-orphan", passive_deletes=True)
    review = relationship("Review", back_populates="comments")
    user = relationship("User", back_populates="comments")
