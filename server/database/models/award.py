from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table, Text

from server.database.database import Base
from sqlalchemy.orm import relationship

book_award = Table(
    "book_award",
    Base.metadata,
    Column("book_id", Integer, ForeignKey("books.id"), primary_key=True),
    Column("award_id", Integer, ForeignKey("awards.id"), primary_key=True),
)

class Award(Base):
    __tablename__ = "awards"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    year = Column(Integer, nullable=True)
    image = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now())

    books = relationship("Book", secondary=book_award, back_populates="awards")