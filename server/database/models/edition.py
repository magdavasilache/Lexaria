from sqlalchemy import Column, Integer, String, Date, ForeignKey, Table
from sqlalchemy.orm import relationship

from server.database.database import Base

class Edition(Base):
    __tablename__ = "editions"
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    edition_number = Column(Integer, nullable=False)
    publication_date = Column(Date)
    publisher = Column(String)
    format = Column(String)
    isbn = Column(String, unique=True)
    cover = Column(String, nullable=True)

    book = relationship("Book", back_populates="editions")