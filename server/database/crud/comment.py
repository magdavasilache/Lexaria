from datetime import datetime
from server.database.crud.user import get_user_by_id
from server.database.models.comment import Comment
from server.database.models.user import User
from server.database.schemas.comment import CommentCreate, CommentCreateResponse, CommentOut
from sqlalchemy.orm import Session

from server.database.schemas.user import UserOut

def create_comment(db: Session, comment_create: CommentCreate, user: User):

    new_comment = Comment(
        created_at=datetime.now(),
        user_id=user.id,
        comment_content=comment_create.comment_content,
        review_id=comment_create.review_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    response = CommentOut(
        comment_content=new_comment.comment_content,
        id=new_comment.id,
        user_liked=False,
        can_edit=True,
        created_at=new_comment.created_at,
        likes_count=0,
        user=UserOut(username=user.username)
    )
    return CommentCreateResponse(success=True, message="Comment created sucessfully!", data=response)