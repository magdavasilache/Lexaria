from datetime import datetime
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from server.database.database import Base

from sqlalchemy.orm import relationship

class Author(Base):
    __tablename__ = "authors"

    id = Column(Integer, primary_key=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    img_url = Column(String, nullable=True)
    birthdate = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    country_id = Column(Integer, ForeignKey("countries.id"))
    about = Column(Text, nullable=True)

    books = relationship("Book", back_populates="author")
    country = relationship("Country", back_populates="authors")