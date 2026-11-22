from typing import Annotated

from fastapi import APIRouter, Depends, Path, status
from sqlalchemy.orm import Session

from server.core.dependencies import get_admin_user, get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.language import LanguageIn, LanguageOut
from server.services import catalog_service

router = APIRouter(prefix="/languages", tags=["Languages"], dependencies=[Depends(get_authenticated_user)])

LanguageId = Annotated[int, Path(ge=1)]


@router.get(
    "",
    response_model=ApiResponse[list[LanguageOut]],
    summary="List languages with how many books use each",
    responses=error_responses(401),
)
def list_languages(db: Session = Depends(get_db)) -> ApiResponse[list[LanguageOut]]:
    return ok(catalog_service.list_languages(db))


@router.post(
    "",
    response_model=ApiResponse[LanguageOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add a language (admin)",
    responses=error_responses(401, 403, 409, 422),
)
def create_language(
    form: LanguageIn,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[LanguageOut]:
    return ok(catalog_service.create_language(db, form, user))


@router.put(
    "/{language_id}",
    response_model=ApiResponse[LanguageOut],
    summary="Rename or correct a language (admin)",
    responses=error_responses(401, 403, 404, 409, 422),
)
def update_language(
    language_id: LanguageId,
    form: LanguageIn,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[LanguageOut]:
    return ok(catalog_service.update_language(db, language_id, form, user))


@router.delete(
    "/{language_id}",
    response_model=ApiResponse[None],
    summary="Delete a language; books, editions and countries that used it keep no language (admin)",
    responses=error_responses(401, 403, 404, 422),
)
def delete_language(
    language_id: LanguageId,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    catalog_service.delete_language(db, language_id, user)
    return ok(None)
