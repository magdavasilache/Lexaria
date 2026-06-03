from fastapi import APIRouter, Depends, HTTPException
from server.database.crud.helpers.create_access_token import get_authenticated_user
from server.database.database import get_db
from sqlalchemy.orm import Session
from server.database.crud.award import create_award, search_for_award
from server.database.schemas.award import AwardCreate, AwardUOut
from server.database.schemas.responses import ErrorResponse
from server.utils.errors import raise_http_error

router = APIRouter(prefix='/award', tags=["Award"], dependencies=[Depends(get_authenticated_user)])

@router.post("/create_award", response_model=AwardUOut, responses={401: {"model": ErrorResponse}, 400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
def create_award_route(award: AwardCreate, db: Session = Depends(get_db)):
    try:
        return create_award(db=db, award_create=award)
    except HTTPException as e:
        raise_http_error(
            status_code=e.status_code,
            detail=e.detail,
            code=e.detail.get("code", "UNKNOWN_ERROR"),
            hint=e.detail.get("hint", None)
        )
    except Exception as e:
        raise_http_error(
            status_code=500,
            detail="Unexpected error creating award.",
            code="UNEXPECTED_ERROR",
            hint="Please try again later."
        )

@router.get("/search_award", response_model=list[AwardUOut], responses={401: {"model": ErrorResponse}, 400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
def search_award_route(input: str, db: Session = Depends(get_db)):
    try:
        return search_for_award(db=db, input=input)
    except HTTPException as e:
        raise_http_error(
            status_code=e.status_code,
            detail=e.detail,
            code=e.detail.get("code", "UNKNOWN_ERROR"),
            hint=e.detail.get("hint", None)
        )
    except Exception as e:
        raise_http_error(
            status_code=500,
            detail="Unexpected error searching for award.",
            code="UNEXPECTED_ERROR",
            hint="Please try again later."
        )