from sqlalchemy import Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.database.database import Base

LANGUAGE_NAME_MAX_LENGTH = 50


class Language(Base):
    __tablename__ = "languages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(LANGUAGE_NAME_MAX_LENGTH), nullable=False)

    books = relationship("Book", back_populates="language", passive_deletes=True)
    countries = relationship("Country", back_populates="language", passive_deletes=True)


Index("uq_languages_name_lower", func.lower(Language.name), unique=True)
