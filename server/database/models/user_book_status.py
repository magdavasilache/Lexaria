from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from server.database.database import Base

class UserBookStatus(Base):
    __tablename__ = "user_book_status"

    user_id = Column(ForeignKey("users.id"), primary_key=True)
    book_id = Column(ForeignKey("books.id"), primary_key=True)
    status = Column(String, nullable=False)  
    added_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    user = relationship("User", back_populates="user_book_statuses")
    book = relationship("Book", back_populates="user_book_statuses")

    __table_args__ = (
        UniqueConstraint("user_id", "book_id", name="uq_user_book"),
    )
