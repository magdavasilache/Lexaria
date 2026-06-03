from fastapi import APIRouter, Depends
from server.database.crud.helpers.create_access_token import get_authenticated_user
from server.database.database import get_db
from sqlalchemy.orm import Session
from server.database.crud.likes import toggle_comment_like, toggle_review_like
from server.database.models.user import User
from server.database.schemas.likes import ToggleReviewLikeRequest, ToggleCommentLikeRequest
from server.utils.errors import raise_http_error

router = APIRouter(prefix='/likes', tags=["Likes"], dependencies=[Depends(get_authenticated_user)])

@router.post('/review-like/')
def toggle_review_like_request(payload: ToggleReviewLikeRequest, db: Session = Depends(get_db), user: User = Depends(get_authenticated_user)):
    try:
        response = toggle_review_like(review_id=payload.review_id, user_id=user.id, db=db)
        return response
    except Exception as e:
        raise_http_error(status_code=500, detail={str(e)}, code="REVIEW_LIKE")

@router.post('/comment-like/')
def toggle_comment_like_request(payload: ToggleCommentLikeRequest, db: Session = Depends(get_db), user: User = Depends(get_authenticated_user)):
    try:
        response = toggle_comment_like(comment_id=payload.comment_id, user_id=user.id, db=db)
        return response
    except Exception as e:
        raise_http_error(status_code=500, detail={str(e)}, code="COMMENT_LIKE")