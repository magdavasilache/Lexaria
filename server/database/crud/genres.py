from sqlalchemy.orm import Session
from sqlalchemy import func
from server.database.models.genres import book_genres

from server.database.models.book import Book
from server.database.models.genres import Genre

def get_generes_suggestions(db: Session):
    db_genres = (
        db.query(
            Genre.id,
            Genre.name,
            func.count(Book.id).label("books_count"),
        )
        .join(Genre.books.property.secondary)  
        .join(Book, Book.id == book_genres.c.book_id)
        .group_by(Genre.id, Genre.name)
        .order_by(func.count(Book.id).desc())
        .limit(10)
        .all()
    )