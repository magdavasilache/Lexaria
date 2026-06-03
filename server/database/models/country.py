from sqlalchemy import Column, ForeignKey, Integer, String
from server.database.models import language

from server.database.database import Base
from sqlalchemy.orm import relationship


class Country(Base):
    __tablename__ = "countries"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    language_id = Column(Integer, ForeignKey("languages.id"))

    authors = relationship("Author", back_populates="country")
    books = relationship("Book", back_populates="country")
    language = relationship("Language", back_populates="countries")