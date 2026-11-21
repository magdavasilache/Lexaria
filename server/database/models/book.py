from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    ARRAY,
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base
from server.database.models.award import book_award
from server.database.models.genres import book_genres

TITLE_MAX_LENGTH = 255
SYNOPSIS_MAX_LENGTH = 5000
DESCRIPTION_LANGUAGE_MAX_LENGTH = 8
DESCRIPTION_LANGUAGE_PATTERN = r"^[a-z]{2,3}(-[A-Za-z0-9]{2,4})?$"
DESCRIPTIONS_MAX = 20
PAGES_MAX = 20000
LIST_ITEM_MAX_LENGTH = 100
LIST_MAX_ITEMS = 30
IMAGE_NAME_MAX_LENGTH = 100
BOOK_IMAGES_MAX = 3
RATING_MIN = 0
RATING_MAX = 5

StringList = ARRAY(String).with_variant(JSON(), "sqlite")


class Book(Base):
    __tablename__ = "books"
    __table_args__ = (
        CheckConstraint("pages > 0", name="ck_books_pages_positive"),
        CheckConstraint(
            f"average_rating >= {RATING_MIN} AND average_rating <= {RATING_MAX}",
            name="ck_books_average_rating_range",
        ),
        CheckConstraint("ratings_count >= 0", name="ck_books_ratings_count_non_negative"),
        Index("ix_books_author_id", "author_id"),
        Index("ix_books_language_id", "language_id"),
        Index("ix_books_average_rating", "average_rating"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(TITLE_MAX_LENGTH), nullable=False)
    author_id: Mapped[int | None] = mapped_column(ForeignKey("authors.id", ondelete="SET NULL"))
    language_id: Mapped[int | None] = mapped_column(ForeignKey("languages.id", ondelete="SET NULL"))
    country_id: Mapped[int | None] = mapped_column(ForeignKey("countries.id", ondelete="SET NULL"))
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    images: Mapped[list[str]] = mapped_column(
        StringList, nullable=False, default=list, server_default=text("'{}'")
    )
    pages: Mapped[int | None] = mapped_column(Integer)
    published_at: Mapped[date | None] = mapped_column(Date)
    settings: Mapped[list[str]] = mapped_column(
        StringList, nullable=False, default=list, server_default=text("'{}'")
    )
    characters: Mapped[list[str]] = mapped_column(
        StringList, nullable=False, default=list, server_default=text("'{}'")
    )
    is_series: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    average_rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2))
    ratings_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    created_by = relationship("User", back_populates="created_books")
    author = relationship("Author", back_populates="books")
    language = relationship("Language", back_populates="books")
    country = relationship("Country", back_populates="books")
    genres = relationship("Genre", secondary=book_genres, back_populates="books", passive_deletes=True)
    awards = relationship("Award", secondary=book_award, back_populates="books", passive_deletes=True)
    user_book_statuses = relationship(
        "UserBookStatus", back_populates="book", cascade="all, delete-orphan", passive_deletes=True
    )
    editions = relationship("Edition", back_populates="book", cascade="all, delete-orphan", passive_deletes=True)
    readings = relationship("Reading", back_populates="book", cascade="all, delete-orphan", passive_deletes=True)
    reviews = relationship("Review", back_populates="book", cascade="all, delete-orphan", passive_deletes=True)
    tags = relationship("BookTag", back_populates="book", cascade="all, delete-orphan", passive_deletes=True)
    descriptions = relationship(
        "BookDescription",
        back_populates="book",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="BookDescription.language",
    )


class BookDescription(Base):
    __tablename__ = "book_descriptions"

    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    language: Mapped[str] = mapped_column(String(DESCRIPTION_LANGUAGE_MAX_LENGTH), primary_key=True)
    synopsis: Mapped[str] = mapped_column(String(SYNOPSIS_MAX_LENGTH), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    book = relationship("Book", back_populates="descriptions")
