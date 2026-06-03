from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from server.database.database import Base
from sqlalchemy.orm import relationship

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    review_id = Column(Integer, ForeignKey("reviews.id"), nullable=False)
    comment_content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    
    likes = relationship("CommentLike", back_populates="comment")
    review = relationship("Review", back_populates="comments")
    user = relationship("User", back_populates="comments")