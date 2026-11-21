from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base
from server.database.models.book import PAGES_MAX


class EditionFormat(StrEnum):
    HARDCOVER = "hardcover"
    PAPERBACK = "paperback"
    EBOOK = "ebook"
    AUDIOBOOK = "audiobook"


PERCENT_FORMATS = (EditionFormat.EBOOK, EditionFormat.AUDIOBOOK)
EDITION_FORMAT_MAX_LENGTH = 20
EDITION_PAGES_MAX = PAGES_MAX
TRANSLATOR_MAX_LENGTH = 255
PUBLISHER_MAX_LENGTH = 255
ISBN_LENGTH = 13
ISBN_INPUT_MAX_LENGTH = 17

_PERCENT_FORMATS_SQL = ", ".join(repr(edition_format.value) for edition_format in PERCENT_FORMATS)


class Edition(Base):
    __tablename__ = "editions"
    __table_args__ = (
        CheckConstraint(
            f"format IN ({', '.join(repr(edition_format.value) for edition_format in EditionFormat)})",
            name="ck_editions_format_valid",
        ),
        CheckConstraint(f"pages > 0 AND pages <= {EDITION_PAGES_MAX}", name="ck_editions_pages_range"),
        CheckConstraint(
            f"format IN ({_PERCENT_FORMATS_SQL}) OR pages IS NOT NULL", name="ck_editions_print_has_pages"
        ),
        CheckConstraint(f"length(isbn) = {ISBN_LENGTH}", name="ck_editions_isbn_length"),
        Index("ix_editions_book_id", "book_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    format: Mapped[str] = mapped_column(String(EDITION_FORMAT_MAX_LENGTH), nullable=False)
    pages: Mapped[int | None] = mapped_column(Integer)
    language_id: Mapped[int | None] = mapped_column(ForeignKey("languages.id", ondelete="SET NULL"))
    translator: Mapped[str | None] = mapped_column(String(TRANSLATOR_MAX_LENGTH))
    publisher: Mapped[str | None] = mapped_column(String(PUBLISHER_MAX_LENGTH))
    published_at: Mapped[date | None] = mapped_column(Date)
    isbn: Mapped[str | None] = mapped_column(String(ISBN_LENGTH), unique=True)
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    book = relationship("Book", back_populates="editions")
    language = relationship("Language")
    created_by = relationship("User")

    @property
    def language_name(self) -> str | None:
        return self.language.name if self.language else None

    @hybrid_property
    def tracks_pages(self) -> bool:
        return self.format not in PERCENT_FORMATS

    @tracks_pages.inplace.expression
    @classmethod
    def _tracks_pages_expression(cls):
        return cls.format.not_in([edition_format.value for edition_format in PERCENT_FORMATS])
