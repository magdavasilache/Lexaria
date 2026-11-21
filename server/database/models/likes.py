from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base


class ReviewLike(Base):
    __tablename__ = "review_likes"
    __table_args__ = (Index("ix_review_likes_review_id", "review_id"),)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    review_id: Mapped[int] = mapped_column(ForeignKey("reviews.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", back_populates="liked_reviews")
    review = relationship("Review", back_populates="likes")


class CommentLike(Base):
    __tablename__ = "comment_likes"
    __table_args__ = (Index("ix_comment_likes_comment_id", "comment_id"),)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    comment_id: Mapped[int] = mapped_column(ForeignKey("comments.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", back_populates="liked_comments")
    comment = relationship("Comment", back_populates="likes")
