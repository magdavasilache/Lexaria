from typing import Annotated

from fastapi import APIRouter, Depends, Path, status
from sqlalchemy.orm import Session

from server.core.dependencies import get_admin_user, get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.genre import GenreIn, GenreOut
from server.services import catalog_service

router = APIRouter(prefix="/genres", tags=["Genres"], dependencies=[Depends(get_authenticated_user)])

GenreId = Annotated[int, Path(ge=1)]


@router.get(
    "",
    response_model=ApiResponse[list[GenreOut]],
    summary="List genres with how many books use each",
    responses=error_responses(401),
)
def list_genres(db: Session = Depends(get_db)) -> ApiResponse[list[GenreOut]]:
    return ok(catalog_service.list_genres(db))


@router.post(
    "",
    response_model=ApiResponse[GenreOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add a genre (admin)",
    responses=error_responses(401, 403, 409, 422),
)
def create_genre(
    form: GenreIn,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[GenreOut]:
    return ok(catalog_service.create_genre(db, form, user))


@router.put(
    "/{genre_id}",
    response_model=ApiResponse[GenreOut],
    summary="Rename or correct a genre (admin)",
    responses=error_responses(401, 403, 404, 409, 422),
)
def update_genre(
    genre_id: GenreId,
    form: GenreIn,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[GenreOut]:
    return ok(catalog_service.update_genre(db, genre_id, form, user))


@router.delete(
    "/{genre_id}",
    response_model=ApiResponse[None],
    summary="Delete a genre and remove it from every book and reader (admin)",
    responses=error_responses(401, 403, 404, 422),
)
def delete_genre(
    genre_id: GenreId,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    catalog_service.delete_genre(db, genre_id, user)
    return ok(None)
