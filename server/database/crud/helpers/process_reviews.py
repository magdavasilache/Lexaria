from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from sqlalchemy import insert
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
from server.database.models.book import Book
from server.database.models.review import Review
from server.database.models.user_book_status import UserBookStatus
from server.helpers.books.calculate_books_reviews_count import calculate_books_reviews_count
from server.utils.errors import raise_http_error
from server.utils.logger import logger


def process_reviews(db: Session, reviews: list[dict[str, Any]], user_id: int) -> None:
    try:
        db_books = db.query(Book).all()
        for review in reviews:
            db_book = get_or_create_db_book(db, db_books, review["book"], user_id)
            process_review(db, review, db_book, user_id)
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error while processing reviews: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        db.rollback()
        logger.exception("Unexpected error while processing reviews")
        raise HTTPException(status_code=500, detail="Unexpected error")


def get_or_create_db_book(db: Session, db_books: list[Book], book_title: str, user_id: int) -> Book | None:
    existing_book = next((book for book in db_books if book.title == book_title), None)
    if existing_book:
        return existing_book

    try:
        new_book = Book(title=book_title, user_id=user_id)
        db.add(new_book)
        db.flush()  
        return new_book
    except SQLAlchemyError as e:
        logger.error(f"Error creating book '{book_title}' for user {user_id}: {e}")
        return None


def parse_datetime(value: str) -> datetime:
    """Convert review timestamp string into a UTC datetime object."""
    return datetime.strptime(value, "%Y-%m-%d %H:%M:%S %Z").replace(tzinfo=timezone.utc)


def insert_status_entry(db: Session, status: str, user_id: int, book_id: int) -> None:
    if status not in {"to-read", "read", "currently-reading"}:
        logger.warning(f"Invalid status '{status}' for user {user_id} and book {book_id}")
        return
    try:
        new_status = db.query(UserBookStatus).filter_by(user_id=user_id, book_id=book_id).first()
        if new_status:
            new_status.status = status
            new_status.updated_at = datetime.now()
        else:
            new_status = UserBookStatus(user_id=user_id, book_id=book_id, status=status) 
            db.add(new_status)
    except SQLAlchemyError as e:
        logger.error(f"Error inserting status '{status}' for user {user_id} and book {book_id}: {e}")
        raise_http_error(500, "Database error while updating book status")


def process_review(db: Session, review: dict[str, Any], db_book: Book, user_id: int) -> None:
    if not db_book:
        raise HTTPException(status_code=500, detail="Couldn't process the review")

    read_status = review["read_status"].lower()
    book_id = db_book.id

    if read_status:
        insert_status_entry(db=db, status=read_status, user_id=user_id, book_id=book_id)

    if read_status == "read":
        rating = int(review["rating"])
        new_review = Review(
            user_id=user_id,
            book_id=db_book.id,
            rating=review,
            review_content=review["review"] if review["review"] != "(not provided)" else None,
            start_date=parse_datetime(review["created_at"]),
        )
        db.add(new_review)

        if rating == 1:
            db_book.one_stars_count += 1
        elif rating == 2:
            db_book.two_stars_count += 1
        elif rating == 3:
            db_book.three_stars_count += 1
        elif rating == 4:
            db_book.four_stars_count += 1
        elif rating == 5:
            db_book.five_stars_count += 1
        
        book_average = db_book.average_rating if db_book.average_rating else 0
        book_reviews_count = calculate_books_reviews_count(book=db_book)
        new_average = (Decimal(str(book_reviews_count)) * (Decimal(str(book_average))) + Decimal(str(review.rating))) / (Decimal(str(book_reviews_count)) + Decimal('1'))
        db_book.average_rating = new_average


        

