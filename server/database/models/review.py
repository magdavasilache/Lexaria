from datetime import datetime
from sqlalchemy import CheckConstraint, Column, Date, DateTime, ForeignKey, Integer, Numeric, String
from server.database.database import Base
from sqlalchemy.orm import relationship


class Review(Base):
    __tablename__ = 'reviews'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    rating = Column(Numeric(3, 2), nullable=True)
    review_content = Column(String, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    likes = relationship("ReviewLike", back_populates="review")
    comments = relationship("Comment", back_populates="review")
    book = relationship("Book", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

    __table_args__ = (
        CheckConstraint('rating >= 0 AND rating <= 5', name='check_rating_range'),
    )
    