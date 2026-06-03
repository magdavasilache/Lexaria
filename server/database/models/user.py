from sqlalchemy import Column, Integer, String
from server.database.database import Base
from sqlalchemy.orm import relationship
from server.database.models.likes import ReviewLike, CommentLike
from server.database.models.genres import user_genres

#Roles: 
#1 - Admin
#2 - Free User
#3 - Premium User

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Integer, default=2, nullable=True) 

    books = relationship("Book", back_populates="user")
    user_book_statuses = relationship("UserBookStatus", back_populates="user", cascade="all, delete-orphan")
    favorite_genres = relationship("Genre", secondary=user_genres)
    liked_reviews = relationship("ReviewLike", back_populates="user")
    liked_comments = relationship("CommentLike", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    comments = relationship("Comment", back_populates="user")