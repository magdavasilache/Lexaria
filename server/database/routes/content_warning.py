from typing import Annotated

from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from server.core.dependencies import get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.content_warning import ContentWarningsOut, ContentWarningsUpdate
from server.services import content_warning_service

router = APIRouter(prefix="/books/{book_id}/content-warnings", tags=["Content warnings"])

BookId = Annotated[int, Path(ge=1)]


@router.get(
    "",
    response_model=ApiResponse[ContentWarningsOut],
    summary="Content warnings readers reported for a book, with the current user's report",
    responses=error_responses(401, 404, 422),
)
def get_warnings(
    book_id: BookId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ContentWarningsOut]:
    return ok(content_warning_service.get_warnings(db, book_id, user))


@router.put(
    "/mine",
    response_model=ApiResponse[ContentWarningsOut],
    summary="Report a book's content warnings (readers who started it)",
    responses=error_responses(401, 403, 404, 422),
)
def set_report(
    book_id: BookId,
    form: ContentWarningsUpdate,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ContentWarningsOut]:
    return ok(content_warning_service.set_report(db, book_id, form, user))


@router.delete(
    "/mine",
    response_model=ApiResponse[ContentWarningsOut],
    summary="Remove your content warning report for a book",
    responses=error_responses(401, 404, 422),
)
def remove_report(
    book_id: BookId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ContentWarningsOut]:
    return ok(content_warning_service.remove_report(db, book_id, user))
