from fastapi import APIRouter, Depends
from server.database.crud.helpers.create_access_token import get_authenticated_user
from server.database.crud.user_book_status import create_or_update_user_book_status
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.user_book_status import UserBookStatusCreate, UserBookStatusOut

router = APIRouter(prefix='/user_book_status', tags=["User Book Status"], dependencies=[Depends(get_authenticated_user)])

@router.post("/set_status", response_model=UserBookStatusOut)
def set_user_book_status(params: UserBookStatusCreate, db=Depends(get_db), user: User = Depends(get_authenticated_user)):
    return create_or_update_user_book_status(db=db, user_id=user.id, book_id=params.book_id, status=params.status)