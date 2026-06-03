from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship

from server.database.database import Base


book_genres = Table(
    "book_genres",
    Base.metadata,
    Column("book_id", ForeignKey("books.id"), primary_key=True),
    Column("genre_id", ForeignKey("genres.id"), primary_key=True),
)

class Genre(Base):
    __tablename__ = "genres"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)

    books = relationship("Book", secondary=book_genres, back_populates="genres")

user_genres = Table(
    "user_genres",
    Base.metadata,
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("genre_id", ForeignKey("genres.id"), primary_key=True),
)

# BookTags -> these are secret tags that will be extracted from the reviews, so that the filtering can be more effective,
# without overwhelming the user with too many tags and the ones they will see are more relevant

class BookTag(Base):
    __tablename__ = "book_tags"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    tag = Column(String, nullable=False)
    source = Column(String, nullable=False)
    confidence = Column(Float, nullable=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    book = relationship("Book", back_populates="tags")
    review = relationship("Review")