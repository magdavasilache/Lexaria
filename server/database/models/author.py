from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base
from server.database.models.book import IMAGE_NAME_MAX_LENGTH

AUTHOR_NAME_MAX_LENGTH = 100
AUTHOR_ABOUT_MAX_LENGTH = 5000
AUTHOR_IMAGE_NAME_MAX_LENGTH = IMAGE_NAME_MAX_LENGTH


class Author(Base):
    __tablename__ = "authors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    first_name: Mapped[str] = mapped_column(String(AUTHOR_NAME_MAX_LENGTH), nullable=False)
    last_name: Mapped[str | None] = mapped_column(String(AUTHOR_NAME_MAX_LENGTH))
    image: Mapped[str | None] = mapped_column(String(AUTHOR_IMAGE_NAME_MAX_LENGTH))
    birthdate: Mapped[date | None] = mapped_column(Date)
    country_id: Mapped[int | None] = mapped_column(ForeignKey("countries.id", ondelete="SET NULL"))
    about: Mapped[str | None] = mapped_column(String(AUTHOR_ABOUT_MAX_LENGTH))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    books = relationship("Book", back_populates="author", passive_deletes=True)
    country = relationship("Country", back_populates="authors")

    @hybrid_property
    def full_name(self) -> str:
        return " ".join(part for part in (self.first_name, self.last_name) if part)

    @full_name.inplace.expression
    @classmethod
    def _full_name_expression(cls):
        return func.trim(cls.first_name + " " + func.coalesce(cls.last_name, ""))

    @property
    def country_name(self) -> str | None:
        return self.country.name if self.country else None
