from datetime import datetime
from sqlalchemy.orm import relationship

from sqlalchemy import Column, DateTime, ForeignKey
from server.database.models import comment, review
from server.database.database import Base


class ReviewLike(Base):
    __tablename__ = "review_likes"
    user_id = Column(ForeignKey("users.id"), primary_key=True)
    review_id = Column(ForeignKey("reviews.id"), primary_key=True)
    timestamp = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="liked_reviews")
    review = relationship("Review", back_populates="likes")

class CommentLike(Base):
    __tablename__ = "comment_likes"
    user_id = Column(ForeignKey("users.id"), primary_key=True)
    comment_id = Column(ForeignKey("comments.id"), primary_key=True)
    timestamp = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="liked_comments")
    comment = relationship("Comment", back_populates="likes")
