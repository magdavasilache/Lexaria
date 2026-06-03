from server.database.crud.helpers.create_access_token import get_authenticated_user
from server.database.models.user import User
from server.database.schemas.comment import CommentCreate, CommentCreateResponse
from fastapi import APIRouter, Depends
from server.database.database import get_db
from sqlalchemy.orm import Session
from server.database.crud.comment import create_comment
from server.utils.errors import raise_http_error

router = APIRouter(prefix='/comment', tags=["Comment"], dependencies=[Depends(get_authenticated_user)])

@router.post('/create-comment', response_model=CommentCreateResponse)
def create_comment_request(comment_form: CommentCreate, db: Session = Depends(get_db), user: User = Depends(get_authenticated_user)):
    try:
        response = create_comment(db=db, comment_create=comment_form, user=user)
        return response
    except Exception as e:
        raise_http_error(status_code=500, detail=f"Error creating a comment: {str(e)}", code="COMMENT_CREATE", hint="Try again later or contact the support team if the problem persists!")
        