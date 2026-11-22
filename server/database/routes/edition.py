from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from server.core.dependencies import get_admin_user, get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.edition import EditionAdminOut, EditionCreate, EditionListQuery, EditionOut, EditionUpdate
from server.services import edition_service

router = APIRouter(tags=["Editions"], dependencies=[Depends(get_authenticated_user)])

BookId = Annotated[int, Path(ge=1)]
EditionId = Annotated[int, Path(ge=1)]


@router.get(
    "/editions",
    response_model=ApiResponse[list[EditionAdminOut]],
    summary="List every edition with its book and who added it (admin)",
    responses=error_responses(401, 403, 422),
    dependencies=[Depends(get_admin_user)],
)
def list_all_editions(
    query: Annotated[EditionListQuery, Query()],
    db: Session = Depends(get_db),
) -> ApiResponse[list[EditionAdminOut]]:
    editions, total = edition_service.list_all(db, query)
    return ok(editions, meta={"total": total, "offset": query.offset, "limit": query.limit})


@router.get(
    "/books/{book_id}/editions",
    response_model=ApiResponse[list[EditionOut]],
    summary="List a book's editions and translations",
    responses=error_responses(401, 404, 422),
)
def list_editions(book_id: BookId, db: Session = Depends(get_db)) -> ApiResponse[list[EditionOut]]:
    return ok(edition_service.list_editions(db, book_id))


@router.post(
    "/books/{book_id}/editions",
    response_model=ApiResponse[EditionOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add a missing edition of a book",
    responses=error_responses(401, 404, 409, 422),
)
def create_edition(
    book_id: BookId,
    form: EditionCreate,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[EditionOut]:
    return ok(edition_service.create_edition(db, book_id, form, user))


@router.put(
    "/editions/{edition_id}",
    response_model=ApiResponse[EditionOut],
    summary="Correct an edition you added (admins can correct any edition)",
    responses=error_responses(401, 403, 404, 409, 422),
)
def update_edition(
    edition_id: EditionId,
    form: EditionUpdate,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[EditionOut]:
    return ok(edition_service.update_edition(db, edition_id, form, user))


@router.delete(
    "/editions/{edition_id}",
    response_model=ApiResponse[None],
    summary="Delete an edition (admin); read-throughs that used it keep their progress without an edition",
    responses=error_responses(401, 403, 404, 422),
)
def delete_edition(
    edition_id: EditionId,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    edition_service.delete_edition(db, edition_id, user)
    return ok(None)
