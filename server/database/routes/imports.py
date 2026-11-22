from typing import Annotated

from fastapi import APIRouter, Depends, Form, Query, status
from sqlalchemy.orm import Session

from server.core.dependencies import get_admin_user, get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.goodreads_import import GoodreadsImportForm, GoodreadsImportSummary
from server.database.schemas.isbn_import import IsbnImportCreate, IsbnImportResult, IsbnLookupQuery, IsbnPreview
from server.services import goodreads_import_service, isbn_import_service

router = APIRouter(prefix="/imports", tags=["Imports"])


@router.post(
    "/goodreads",
    response_model=ApiResponse[GoodreadsImportSummary],
    summary="Import favourite genres, reading statuses and ratings from a Goodreads export",
    responses=error_responses(401, 422),
)
def import_goodreads(
    form: Annotated[GoodreadsImportForm, Form()],
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[GoodreadsImportSummary]:
    result = goodreads_import_service.import_goodreads(db, form, user)
    return ok(result.summary, warnings=result.warnings)


@router.get(
    "/isbn",
    response_model=ApiResponse[IsbnPreview],
    summary="Look up a book on Open Library by ISBN before importing it (admin)",
    responses=error_responses(401, 403, 404, 422, 503),
)
def preview_isbn(
    query: Annotated[IsbnLookupQuery, Query()],
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[IsbnPreview]:
    return ok(isbn_import_service.preview(db, query.isbn))


@router.post(
    "/isbn",
    response_model=ApiResponse[IsbnImportResult],
    status_code=status.HTTP_201_CREATED,
    summary="Import a book from Open Library by ISBN, or add the ISBN as an edition of a matching book (admin)",
    responses=error_responses(401, 403, 404, 409, 422, 503),
)
def import_isbn(
    form: IsbnImportCreate,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[IsbnImportResult]:
    outcome = isbn_import_service.import_book(db, form, user)
    return ok(outcome.result, warnings=outcome.warnings)
