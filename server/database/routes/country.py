from fastapi import APIRouter, Depends, HTTPException
from server.database.crud.helpers.create_access_token import get_authenticated_user
from server.database.database import get_db
from sqlalchemy.orm import Session
from server.database.crud.country import create_new_country, get_countries_for_forms

from server.database.schemas.country import CountryCreateSchema, CreateCountryResponse, FormCountryOut, GetFormCountriesResponse
from server.utils.errors import raise_http_error

router = APIRouter(prefix='/country', tags=["Country"], dependencies=[Depends(get_authenticated_user)])

@router.post('/create-country', response_model=CreateCountryResponse)
def create_country_request(create_country: CountryCreateSchema, db: Session = Depends(get_db)):
    try:
        country = create_new_country(db=db, country_create=create_country)
        return CreateCountryResponse(
            success=True,
            message="Country created successfully!",
            data=country
        )
    except HTTPException as e:
        return CreateCountryResponse(
            success=False,
            message=e.detail,
            data=None
        )
    except Exception as e:
        db.rollback()
        raise_http_error(500, f"Error creating country: {str(e)}")

@router.get('/all-countries', response_model=GetFormCountriesResponse)
def get_form_countries_request(db: Session = Depends(get_db)):
    try:
        countries = get_countries_for_forms(db=db)
        return GetFormCountriesResponse(
            data=countries,
            success=True,
            message="Countries fetched successfully!" 
        )
    except Exception as e:
        raise_http_error(500, f"Error fetching countries: {str(e)}")