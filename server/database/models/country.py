from sqlalchemy import ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base

COUNTRY_NAME_MAX_LENGTH = 100


class Country(Base):
    __tablename__ = "countries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(COUNTRY_NAME_MAX_LENGTH), nullable=False)
    language_id: Mapped[int | None] = mapped_column(ForeignKey("languages.id", ondelete="SET NULL"))

    authors = relationship("Author", back_populates="country", passive_deletes=True)
    books = relationship("Book", back_populates="country", passive_deletes=True)
    language = relationship("Language", back_populates="countries")

    @property
    def language_name(self) -> str | None:
        return self.language.name if self.language else None


Index("uq_countries_name_lower", func.lower(Country.name), unique=True)
