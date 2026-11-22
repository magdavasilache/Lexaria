from typing import Annotated

from fastapi import APIRouter, Depends, Form, Path, status
from sqlalchemy.orm import Session

from server.core.dependencies import get_admin_user, get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.author import AuthorIn, AuthorOut, AuthorUpdate
from server.services import author_service

router = APIRouter(prefix="/authors", tags=["Authors"], dependencies=[Depends(get_authenticated_user)])

AuthorId = Annotated[int, Path(ge=1)]


@router.get(
    "",
    response_model=ApiResponse[list[AuthorOut]],
    summary="List authors with how many books each has",
    responses=error_responses(401),
)
def list_authors(db: Session = Depends(get_db)) -> ApiResponse[list[AuthorOut]]:
    return ok(author_service.list_authors(db))


@router.post(
    "",
    response_model=ApiResponse[AuthorOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add an author with an optional portrait (admin)",
    responses=error_responses(401, 403, 422),
)
def create_author(
    form: Annotated[AuthorIn, Form()],
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[AuthorOut]:
    return ok(author_service.create_author(db, form, user))


@router.put(
    "/{author_id}",
    response_model=ApiResponse[AuthorOut],
    summary="Replace an author's details; send a new image to replace the portrait or remove_image to drop it (admin)",
    responses=error_responses(401, 403, 404, 422),
)
def update_author(
    author_id: AuthorId,
    form: Annotated[AuthorUpdate, Form()],
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[AuthorOut]:
    return ok(author_service.update_author(db, author_id, form, user))


@router.delete(
    "/{author_id}",
    response_model=ApiResponse[None],
    summary="Delete an author; their books keep no author (admin)",
    responses=error_responses(401, 403, 404, 422),
)
def delete_author(
    author_id: AuthorId,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    author_service.delete_author(db, author_id, user)
    return ok(None)
