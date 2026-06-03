from datetime import date, datetime
from decimal import Decimal
import logging
from server.database.crud.helpers.tag_extractor import extract_tags
from server.database.models.book import Book
from server.database.models.genres import BookTag
from server.database.models.review import Review
from server.database.models.comment import Comment
from server.database.models.user_book_status import UserBookStatus
from server.database.schemas.comment import CommentOut
from server.database.schemas.review import BookReviewOut, GetReviewsResponse, ReviewCreate, ReviewCreateResponse, ReviewUpdate
from server.database.schemas.user import UserOut
from server.helpers.books.calculate_books_reviews_count import calculate_books_reviews_count
from server.helpers.reviews.adjust_star_count import adjust_star_count
from server.utils.errors import raise_http_error
from sqlalchemy.orm import Session, joinedload

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

def create_new_review(db: Session, review: ReviewCreate, user_id: int) -> Review:
    db_book = (
        db.query(Book)
        .filter(Book.id == review.book_id)
        .first()
    )
    if not db_book:
        return ReviewCreateResponse(success=False, message="Book not found!", data=None)

    db_user_status = (
        db.query(UserBookStatus)
        .filter(UserBookStatus.user_id == user_id, UserBookStatus.status == 'read')
        .first()
    )
    book_average = db_book.average_rating if db_book.average_rating else 0
    book_reviews_count = calculate_books_reviews_count(book=db_book)

    existing_review = (
        db.query(Review)
        .filter(
            Review.book_id == review.book_id, 
            Review.user_id == user_id
        )
        .first()
    )

    if existing_review:
        return ReviewCreateResponse(success=False, message="A user can only review a book once!", data=None)

    try:
        new_review = Review(
            user_id=user_id,
            book_id=review.book_id,
            rating=review.rating,
            review_content=review.review_content,
            start_date=db_user_status.added_at.date() if db_user_status else datetime.now().date(),
            end_date=date.today()
        )
        db.add(new_review)
        db.flush()

        new_average = (Decimal(str(book_reviews_count)) * (Decimal(str(book_average))) + Decimal(str(review.rating))) / (Decimal(str(book_reviews_count)) + Decimal('1'))
        db_book.average_rating = new_average
        rating = review.rating

        if rating == 0:
            db_book.zero_stars_count += 1
        elif rating in [1, 1.5]:
            db_book.one_stars_count += 1
        elif rating in [2, 2.5]:
            db_book.two_stars_count += 1
        elif rating in [3, 3.5]:
            db_book.three_stars_count += 1
        elif rating in [4, 4.5]:
            db_book.four_stars_count += 1
        elif rating in [5]:
            db_book.five_stars_count += 1

        logger.debug(f"Writing a new review....")

        if review.review_content:
            logger.debug(f"Extracting tags from the review...")
            matched_tags = extract_tags(review.review_content, min_confidence=0.6)
            logger.debug(f"Tags extracted: {matched_tags}")
            for match in matched_tags:
                existing = (
                    db.query(BookTag)
                    .filter(
                        BookTag.book_id == review.book_id,
                        BookTag.tag == match.tag,
                        BookTag.review_id == new_review.id,
                    )
                    .first()
                )
                if not existing:
                    db.add(BookTag(
                        book_id=review.book_id,
                        tag=match.tag,
                        source="review_nlp",
                        confidence=match.confidence,
                        review_id=new_review.id,
                    ))

        db.commit()
        db.refresh(new_review)
        return ReviewCreateResponse(success=True, message="Review created successfully", data=new_review)

    except Exception as e:
        raise_http_error(status_code=500, code="ERROR_CREATING_REVIEW", detail=f"Something went wrong while creating the review: {str(e)}", hint="Try again later or contact the support!")

def update_existing_review(db: Session, review: ReviewUpdate, user_id: int):
    try:
        existing_review = (
            db.query(Review)
            .options(
                joinedload(Review.book)
            )
            .filter(
                Review.id == review.id,
                Review.user_id == user_id
            )
            .first()
        )

        if not existing_review:
            raise_http_error(status_code=400, detail="Could not find the review!", code="REVIEW_NOT_FOUND", hint="Try again later and if the problem persists, get in contact with the support!")
        
        db_book: Book = existing_review.book
        old_rating = existing_review.rating
        new_rating = review.rating

        existing_review.rating = new_rating
        existing_review.review_content = review.review_content
        existing_review.end_date = review.end_date

        total_reviews = calculate_books_reviews_count(book=db_book)
        if total_reviews == 0:
            db_book.average_rating = Decimal(str(new_rating))
        else:
            old_average = db_book.average_rating or Decimal("0")
            new_average = (Decimal(str(old_average)) * Decimal(str(total_reviews)) - Decimal(str(old_rating)) + Decimal(str(new_rating))) / Decimal(str(total_reviews))
            db_book.average_rating = new_average

        adjust_star_count(db_book=db_book, rating_value=old_rating, delta=-1)
        adjust_star_count(db_book=db_book, rating_value=new_rating, delta=1)

        db.commit()
        db.refresh(existing_review)
        return existing_review
    except Exception as e:
        raise_http_error(status_code=500, detail=f"Something went wrong while updating the review: {str(e)}", hint="Try again later or contact the support!")      

def delete_existing_review(db: Session, review_id: int, user_id: int):
    try:
        existing_review = (
            db.query(Review)
            .options(
                joinedload(Review.book),
                joinedload(Review.likes),
                joinedload(Review.comments)
                .joinedload(Comment.likes)
            )
            .filter(
                Review.id == review_id,
                Review.user_id == user_id
            )
            .first()
        )

        if not existing_review:
            raise_http_error(
                status_code=400,
                detail="Could not find the review!",
                hint="Try again later and if the problem persists, get in contact with the support!"
            )

        db_book: Book = existing_review.book
        old_rating = existing_review.rating

        comments_likes = [like for comment in existing_review.comments for like in comment.likes]
        for like in comments_likes:
            db.delete(like)

        for comment in existing_review.comments:
            db.delete(comment)

        for like in existing_review.likes:
            db.delete(like)

        db.delete(existing_review)

        total_reviews = calculate_books_reviews_count(book=db_book)  
        if total_reviews <= 1: 
            db_book.average_rating = Decimal("0")
        else:
            old_average = db_book.average_rating or Decimal("0")
            new_average = (Decimal(str(old_average)) * Decimal(str(total_reviews)) - Decimal(str(old_rating))) / Decimal(str(total_reviews - 1))
            db_book.average_rating = new_average

        
        adjust_star_count(db_book=db_book, rating_value=old_rating, delta=-1)

        db.commit()

    except Exception as e:
        raise_http_error(
            status_code=500,
            detail=f"Something went wrong while deleting the review: {str(e)}",
            hint="Try again later or contact the support!"
        )

def get_book_reviews(db: Session, book_id: int, user_id: int):
    db_reviews = (
        db.query(Review)
        .options(
            joinedload(Review.book),
            joinedload(Review.comments)
            .joinedload(Comment.user),
            joinedload(Review.likes),
            joinedload(Review.user),
            joinedload(Review.book)
            .joinedload(Book.user_book_statuses)
        )
        .filter(
            Review.book_id == book_id,
            Review.review_content != ""
        )
        .all()
    )

    if not db_reviews:
        return GetReviewsResponse(success=False, message="Reviews not found!", data=None)

    reviews = []

    for review in db_reviews:
        book: Book = review.book
        reading_statuses: list[UserBookStatus] = book.user_book_statuses if book else None
        user_status = next((status for status in reading_statuses if status.user_id == review.user_id), None) if reading_statuses else None
        comments = None

        if review.comments:
            comments = []
            for comment in review.comments:
                comments.append(
                    CommentOut(
                        id=comment.id,
                        comment_content=comment.comment_content,
                        created_at=comment.created_at,
                        likes=len(comment.likes),
                        user_liked=any(l.user_id == user_id for l in comment.likes),
                        user=UserOut(username=comment.user.username if comment.user else "Unknown"),
                        can_edit=comment.user_id == user_id,
                        likes_count=len(comment.likes) if comment.likes else 0
                    )
                )

        reviews.append(
            BookReviewOut(
                id=review.id,
                rating=review.rating,
                review_content=review.review_content,
                created_at=review.created_at,
                comments=comments,
                user_liked=any(l.user_id == user_id for l in review.likes),
                user=UserOut(username=review.user.username if review.user else "Unknown"),
                user_book_status=user_status,
                can_edit=review.user_id == user_id,
                likes_count=len(review.likes) if review.likes else 0
            )
        )

    return GetReviewsResponse(
        success=True,
        message="Reviews fetched successfully!",
        data=reviews
    )