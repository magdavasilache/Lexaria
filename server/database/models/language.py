from sqlalchemy import Column, Integer, String

from server.database.database import Base
from sqlalchemy.orm import relationship


class Language(Base):
    __tablename__ = "languages"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)

    books = relationship("Book", back_populates="language")
    countries = relationship("Country", back_populates="language")