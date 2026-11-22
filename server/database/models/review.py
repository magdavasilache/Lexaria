from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
    select,
    text,
)
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from server.database.database import Base
from server.database.models.comment import Comment
from server.database.models.likes import ReviewLike

REVIEW_CONTENT_MAX_LENGTH = 20000
REVIEW_RATING_MIN = Decimal("0.5")
REVIEW_RATING_MAX = Decimal("5")
REVIEW_RATING_STEP = Decimal("0.5")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("user_id", "book_id", name="uq_reviews_user_book"),
        CheckConstraint(
            f"rating >= {REVIEW_RATING_MIN} AND rating <= {REVIEW_RATING_MAX}", name="ck_reviews_rating_range"
        ),
        CheckConstraint(
            f"CAST(rating / {REVIEW_RATING_STEP} AS INTEGER) = rating / {REVIEW_RATING_STEP}",
            name="ck_reviews_rating_step",
        ),
        CheckConstraint("rating IS NOT NULL OR content IS NOT NULL", name="ck_reviews_not_empty"),
        CheckConstraint(
            "start_date IS NULL OR end_date IS NULL OR end_date >= start_date", name="ck_reviews_date_order"
        ),
        Index("ix_reviews_book_id", "book_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2))
    content: Mapped[str | None] = mapped_column(String(REVIEW_CONTENT_MAX_LENGTH))
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    has_spoilers: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    likes_count: Mapped[int] = column_property(
        select(func.count()).where(ReviewLike.review_id == id).correlate_except(ReviewLike).scalar_subquery()
    )

    likes = relationship("ReviewLike", back_populates="review", cascade="all, delete-orphan", passive_deletes=True)
    comments = relationship(
        "Comment",
        back_populates="review",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by=(Comment.created_at, Comment.id),
    )
    book = relationship("Book", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
