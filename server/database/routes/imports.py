from typing import Annotated

from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session

from server.core.dependencies import get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.goodreads_import import GoodreadsImportForm, GoodreadsImportSummary
from server.services import goodreads_import_service

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
