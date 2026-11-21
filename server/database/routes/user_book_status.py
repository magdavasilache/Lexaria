from typing import Annotated

from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from server.core.dependencies import get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.user_book_status import UserBookStatusOut, UserBookStatusSet
from server.services import reading_status_service

router = APIRouter(prefix="/books", tags=["Reading status"], dependencies=[Depends(get_authenticated_user)])

BookId = Annotated[int, Path(ge=1)]


@router.put(
    "/{book_id}/status",
    response_model=ApiResponse[UserBookStatusOut],
    summary="Put a book on one of your shelves (or move it to another)",
    responses=error_responses(401, 404, 422),
)
def set_status(
    book_id: BookId,
    form: UserBookStatusSet,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[UserBookStatusOut]:
    return ok(reading_status_service.set_status(db, book_id, form, user))


@router.delete(
    "/{book_id}/status",
    response_model=ApiResponse[None],
    summary="Take a book off your shelves",
    responses=error_responses(401, 404, 422),
)
def remove_status(
    book_id: BookId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    reading_status_service.remove_status(db, book_id, user)
    return ok(None)
