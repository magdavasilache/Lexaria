from datetime import datetime
import json
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException

from server.database.crud.helpers.book_helpers import save_book_image
from server.database.crud.helpers.process_genres import process_genres
from server.database.crud.helpers.process_reviews import process_reviews
from server.database.models.book import Book
from server.database.models.genres import Genre
from server.database.models.user import User
from server.database.schemas.book import BookCreateResponse, BookOut, BookOutBase, CreateBook, CreateBookOut, GetBooksFilters, GetBooksOutput, GoodreadsImportData

from server.database.schemas.genre import GenreOut
from server.database.schemas.user_book_status import UserBookStatusOut
from server.helpers.books.validate_pagination import validate_pagination
from server.utils.errors import raise_http_error
from server.utils.logger import logger

def create_new_book(db: Session, book: CreateBook, user: User):
    images = book.images
    db_images = []
    if images:
        for image in images:
            new_image = save_book_image(image)
            if new_image:
                db_images.append(new_image)

    new_book = Book(
        title=book.title,
        author_id=book.author_id,
        pages=book.pages,
        language_id=book.language_id,
        published_at=book.published_at,
        created_at=datetime.now(),
        synopsis=book.synopsis,
        images=db_images,
        settings=book.settings,
        characters=book.characters,
        user_id=user.id
    )

    db.add(new_book)
    db.commit()
    db.refresh(new_book)

    data = CreateBookOut(
        id=new_book.id,
        title=new_book.title,
        author_name=f"{new_book.author.first_name} {new_book.author.last_name}" if new_book.author else None,
        image=new_book.images[0] if new_book.images else None
    )

    return BookCreateResponse(
        success=True,
        message="Book created successfully!",
        data=data
    )

def get_all_books(db: Session, offset: int = 0, limit: int = 15, max_limit: int = 100, filters: GetBooksFilters = None) -> GetBooksOutput:
    validate_pagination(offset, limit, max_limit)

    print(f"Filters: {filters}")
    
    try:
        base_query = (
            db.query(Book)
            .options(joinedload(Book.author), joinedload(Book.language))
        )
        

        if filters:
            if filters.languages:
                base_query = base_query.filter(Book.language_id.in_(filters.languages))
            if filters.authors:
                base_query = base_query.filter(Book.author_id.in_(filters.authors))
            if filters.genres:
                base_query = base_query.filter(Book.genres.any(Genre.id.in_(filters.genres)))
            if filters.ratings:
                rating_conditions = []
                for r in filters.ratings:
                    rating_conditions.append(
                        and_(Book.average_rating >= r - 1, Book.average_rating < r)
                    )
                base_query = base_query.filter(or_(*rating_conditions))
        
        total_count = db.scalar(select(func.count()).select_from(Book))
        books = (
            base_query
            .offset(offset)
            .limit(limit)
            .all()
        )
        result_books = [
            BookOutBase(
                id=b.id,
                title=b.title,
                author_name=f"{b.author.first_name} {b.author.last_name}" if b.author else None,
                language_name=b.language.name if b.language else None,
                image=b.images[0] if b.images else None,
                pages=b.pages,
                synopsis=b.synopsis,
                tags=[genre.name for genre in b.genres] if b.genres else None
            )
            for b in books
        ]
        return GetBooksOutput(
            total_count=total_count,
            books=result_books
        )
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.warning(f"Database error in get_all_books: {str(e)}", exc_info=True)
        raise_http_error(500, "Failed to retrieve books from database", code="DB_ERROR")
    except Exception as e:
        db.rollback()
        logger.warning(f"Unexpected error in get_all_books: {str(e)}", exc_info=True)
        raise_http_error(500, "An unexpected error occurred", code="UNEXPECTED_ERROR")
    
async def add_goodreads_import(db: Session, import_data: GoodreadsImportData, user: User):
    try:
        if not import_data.favorite_genres.filename.endswith('.json') or not import_data.reviews.filename.endswith('.json'):
            raise_http_error(400, "Both files must be JSON files.", code="INVALID_FILE_TYPE")

        favorite_genres_content = await import_data.favorite_genres.read()
        reviews_content = await import_data.reviews.read()

        try:
            genres_data = json.loads(favorite_genres_content)
            reviews_data = json.loads(reviews_content)
        except json.JSONDecodeError:
            raise_http_error(400, "Invalid JSON file.", code="INVALID_JSON")

        if not isinstance(genres_data, list) or len(genres_data) < 2:
            raise_http_error(400, "Unexpected JSON structure for genres.", code="INVALID_GENRE_STRUCTURE")

        genre_info = genres_data[0]
        genres_list = genre_info.get("genres", "").split(",") if "genres" in genre_info else []
        process_genres(db=db, genres_list=genres_list, user_id=user.id)

        if not isinstance(reviews_data, list) or len(reviews_data) < 2:
            raise_http_error(400, "Unexpected JSON structure for reviews.", code="INVALID_REVIEW_STRUCTURE")

        process_reviews(db=db, reviews=reviews_data[1:], user_id=user.id)
        db.commit()
        return {"success": True,"message": "Goodreads data imported successfully."}

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        logger.warning(f"Unexpected error in Goodreads import: {str(e)}", exc_info=True)
        raise_http_error(500, "Failed to process Goodreads data.", code="IMPORT_ERROR", hint="Check file contents or contact support.")

def get_book_by_id(db: Session, book_id: int, user_id: int) -> BookOut:
    try:
        book = (
            db.query(Book)
            .options(
                joinedload(Book.author), 
                joinedload(Book.language), 
                joinedload(Book.user_book_statuses)
            )
            .filter(Book.id == book_id)
            .first()
        )
        
        if not book:
            raise_http_error(404, "Book not found.", code="BOOK_NOT_FOUND")

        user_book_status = None
        for status in book.user_book_statuses:
            if status.user_id == user_id:
                user_book_status = status
                break
            
        return BookOut(
            id=book.id,
            title=book.title,
            author_name=f"{book.author.first_name} {book.author.last_name}" if book.author else None,
            language_name=book.language.name if book.language else None,
            user_id=book.user_id,
            images=book.images,
            pages=book.pages,
            published_at=book.published_at,
            created_at=book.created_at,
            synopsis=book.synopsis,
            awards=book.awards,
            settings=book.settings,
            characters=book.characters,
            parent_id=book.parent_id,
            country_name=book.country.name if book.country else None,
            genres_out = (
                [GenreOut.model_validate(g) for g in book.genres]
                if book.genres else None
            ),
            user_book_status = (
                UserBookStatusOut.model_validate(user_book_status)
                if user_book_status else None
            ),
            average_rating=book.average_rating,
            five_stars=book.five_stars_count,
            four_stars=book.four_stars_count,
            three_stars=book.three_stars_count,
            two_stars=book.two_stars_count,
            one_star=book.one_stars_count,
            zero_stars=book.zero_stars_count,
        )
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.warning(f"Database error in get_book_by_id: {str(e)}", exc_info=True)
        raise_http_error(500, "Failed to retrieve book from database", code="DB_ERROR")
    except Exception as e:
        db.rollback()
        logger.warning(f"Unexpected error in get_book_by_id: {str(e)}", exc_info=True)
        raise_http_error(500, "An unexpected error occurred", code="UNEXPECTED_ERROR")


    

