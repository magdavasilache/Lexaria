from fastapi import APIRouter, Depends
from server.database.crud.helpers.create_access_token import get_authenticated_user
from server.database.crud.review import create_new_review, update_existing_review, delete_existing_review, get_book_reviews
from server.database.database import get_db
from sqlalchemy.orm import Session

from server.database.models.user import User
from server.database.schemas.review import GetReviewsResponse, ReviewCreate, ReviewCreateResponse, ReviewOut, ReviewUpdate
from server.utils.errors import raise_http_error


router = APIRouter(prefix='/review', tags=["Review"], dependencies=[Depends(get_authenticated_user)])

@router.post('/create-review', response_model=ReviewCreateResponse)
def create_review(review_form: ReviewCreate, db: Session = Depends(get_db), user: User = Depends(get_authenticated_user)):
    try:
        create_response = create_new_review(db=db, review=review_form, user_id=user.id)
        return create_response
    except Exception as e:
        raise_http_error(status_code=500, detail=f"Error creating a review: {str(e)}", code="REVIEW_CREATE", hint="Try again later or contact the support team if the problem persists!")

@router.put('/update-review', response_model=ReviewOut)
def update_review(review_form: ReviewUpdate, db: Session = Depends(get_db), user: User = Depends(get_authenticated_user)):
    return update_existing_review(db=db, review=review_form, user_id=user.id)

@router.delete('/delete-review/{review_id}', response_model=ReviewOut)
def delete_review(review_id: int, db: Session = Depends(get_db), user: int = Depends(get_authenticated_user)):
    return delete_existing_review(db=db, review_id=review_id, user_id=user.id)

@router.get('/get-book-reviews/{book_id}', response_model=GetReviewsResponse)
def get_book_reviews_request(book_id: int, db: Session = Depends(get_db), user: int = Depends(get_authenticated_user)):
    return get_book_reviews(db=db, user_id=user.id, book_id=book_id)