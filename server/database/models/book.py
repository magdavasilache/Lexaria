from datetime import datetime
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, ARRAY, Text, text
from server.database.database import Base
from sqlalchemy.orm import relationship
from server.database.models.genres import book_genres
from server.database.models.award import book_award
from server.database.models.genres import book_genres
class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    author_id = Column(Integer, ForeignKey("authors.id"), nullable=True)
    images = Column(ARRAY(String), nullable=True)  
    pages = Column(Integer, default=0)
    language_id = Column(Integer, ForeignKey("languages.id"), nullable=True)
    published_at = Column(Date)
    created_at = Column(DateTime, default=datetime.now())
    synopsis = Column(Text)
    settings = Column(ARRAY(String))
    characters = Column(ARRAY(String))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("books.id"), nullable=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=True)
    average_rating = Column(Numeric(3,2), nullable=True)
    zero_stars_count = Column(Integer, nullable=False, default=0, server_default=text("0"))
    one_stars_count = Column(Integer, nullable=False, default=0, server_default=text("0"))
    two_stars_count = Column(Integer, nullable=False, default=0, server_default=text("0"))
    three_stars_count = Column(Integer, nullable=False, default=0, server_default=text("0"))
    four_stars_count = Column(Integer, nullable=False, default=0, server_default=text("0"))
    five_stars_count = Column(Integer, nullable=False, default=0, server_default=text("0"))

    user = relationship("User", back_populates="books")
    author = relationship("Author", back_populates="books")
    user_book_statuses = relationship("UserBookStatus", back_populates="book", cascade="all, delete-orphan")
    genres = relationship("Genre", secondary=book_genres, back_populates="books")
    language = relationship("Language", back_populates="books")
    editions = relationship("Edition", back_populates="book", cascade="all, delete-orphan")
    country = relationship("Country", back_populates="books")
    awards = relationship("Award", secondary=book_award, back_populates="books")
    reviews = relationship("Review", back_populates="book")
    tags = relationship("BookTag", back_populates="book", cascade="all, delete-orphan")
