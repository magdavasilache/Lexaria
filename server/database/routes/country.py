from typing import Annotated

from fastapi import APIRouter, Depends, Path, status
from sqlalchemy.orm import Session

from server.core.dependencies import get_admin_user, get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.country import CountryIn, CountryOut
from server.services import catalog_service

router = APIRouter(prefix="/countries", tags=["Countries"], dependencies=[Depends(get_authenticated_user)])

CountryId = Annotated[int, Path(ge=1)]


@router.get(
    "",
    response_model=ApiResponse[list[CountryOut]],
    summary="List countries with how many books use each",
    responses=error_responses(401),
)
def list_countries(db: Session = Depends(get_db)) -> ApiResponse[list[CountryOut]]:
    return ok(catalog_service.list_countries(db))


@router.post(
    "",
    response_model=ApiResponse[CountryOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add a country (admin)",
    responses=error_responses(401, 403, 409, 422),
)
def create_country(
    form: CountryIn,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[CountryOut]:
    return ok(catalog_service.create_country(db, form, user))


@router.put(
    "/{country_id}",
    response_model=ApiResponse[CountryOut],
    summary="Rename or correct a country (admin)",
    responses=error_responses(401, 403, 404, 409, 422),
)
def update_country(
    country_id: CountryId,
    form: CountryIn,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[CountryOut]:
    return ok(catalog_service.update_country(db, country_id, form, user))


@router.delete(
    "/{country_id}",
    response_model=ApiResponse[None],
    summary="Delete a country; books and authors that used it keep no country (admin)",
    responses=error_responses(401, 403, 404, 422),
)
def delete_country(
    country_id: CountryId,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    catalog_service.delete_country(db, country_id, user)
    return ok(None)
