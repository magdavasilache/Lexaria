from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base

GENRE_NAME_MAX_LENGTH = 50

book_genres = Table(
    "book_genres",
    Base.metadata,
    Column("book_id", ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
    Column("genre_id", ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True),
    Index("ix_book_genres_genre_id", "genre_id"),
)


class Genre(Base):
    __tablename__ = "genres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(GENRE_NAME_MAX_LENGTH), nullable=False)

    books = relationship("Book", secondary=book_genres, back_populates="genres", passive_deletes=True)


Index("uq_genres_name_lower", func.lower(Genre.name), unique=True)

user_genres = Table(
    "user_genres",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("genre_id", ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True),
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
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    book = relationship("Book", back_populates="tags")
    review = relationship("Review")