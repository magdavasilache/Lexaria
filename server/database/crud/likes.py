from datetime import datetime
from sqlalchemy.orm import Session

from server.database.crud.user import get_user_by_id
from server.database.models.likes import CommentLike, ReviewLike
from server.utils.errors import raise_http_error

def toggle_review_like(db: Session, review_id: int, user_id: int):
    review_like = (
        db.query(ReviewLike)
        .filter(ReviewLike.review_id == review_id)
        .first()
    )
    if review_like:
        db.delete(review_like)
    else:
        like = ReviewLike(
            user_id=user_id,
            review_id=review_id,
            timestamp=datetime.now()
        )
        db.add(like)

    db.commit()
    
    return {"success": True}

def toggle_comment_like(db: Session, comment_id: int, user_id: int):
    comment_like = (
        db.query(CommentLike)
        .filter(CommentLike.comment_id == comment_id)
        .first()
    )
    if comment_like:
        db.delete(comment_like)
    else:
        like = CommentLike(
            user_id=user_id,
            comment_id=comment_id,
            timestamp=datetime.now()
        )
        db.add(like)
    db.commit()
    return {"success": True}