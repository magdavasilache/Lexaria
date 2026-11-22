from datetime import datetime

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Index, Integer, String, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base

AWARD_NAME_MAX_LENGTH = 150
AWARD_DESCRIPTION_MAX_LENGTH = 2000
AWARD_YEAR_MIN = 1800
AWARD_YEAR_MAX = 2100

book_award = Table(
    "book_award",
    Base.metadata,
    Column("book_id", Integer, ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
    Column("award_id", Integer, ForeignKey("awards.id", ondelete="CASCADE"), primary_key=True),
)


class Award(Base):
    __tablename__ = "awards"
    __table_args__ = (
        CheckConstraint(f"year >= {AWARD_YEAR_MIN} AND year <= {AWARD_YEAR_MAX}", name="ck_awards_year_range"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(AWARD_NAME_MAX_LENGTH), nullable=False)
    year: Mapped[int | None] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(String(AWARD_DESCRIPTION_MAX_LENGTH))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    books = relationship("Book", secondary=book_award, back_populates="awards", passive_deletes=True)


Index("uq_awards_name_year", func.lower(Award.name), func.coalesce(Award.year, 0), unique=True)
