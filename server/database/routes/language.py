from server.database.schemas.language import CreateLanguageResponse, DeleteLanguageResponse, GetLanguagesResponse, LanguageCreate
from server.utils.errors import raise_http_error
from fastapi import APIRouter, Depends, HTTPException
from server.database.crud.helpers.create_access_token import get_authenticated_user
from server.database.database import get_db
from sqlalchemy.orm import Session
from server.database.crud.language import create_new_language, delete_language, get_languages

router = APIRouter(prefix='/language', tags=["Language"], dependencies=[Depends(get_authenticated_user)])

@router.post('', response_model=CreateLanguageResponse)
def create_language_request(payload: LanguageCreate,db: Session = Depends(get_db)):
    try: 
        data = create_new_language(db=db, payload=payload)
        return CreateLanguageResponse(
            success=True,
            message="Language created successfully!",
            data=data
        )
    except HTTPException as e:
        return CreateLanguageResponse(
            success=False,
            message=e.detail,
            data=None
        )
    except Exception as e:
        db.rollback()
        raise_http_error(500, f"Error creating language: {str(e)}")

@router.get('', response_model=GetLanguagesResponse)
def get_languages_request(db: Session = Depends(get_db)):
    try:
        data = get_languages(db=db)
        return GetLanguagesResponse(
            success=True,
            message="Languages fetched successfully!",
            data=data
        )
    except Exception as e:
        raise_http_error(500, f"Error fetching languages: {str(e)}")

@router.delete('/{id}', response_model=DeleteLanguageResponse)
def delete_language_request(id: int, db: Session = Depends(get_db)):
    try:
        delete_language(db=db, id=id)
        return DeleteLanguageResponse(
            success=True,
            message="Language deleted successfully!",
            data=None
        )
    except HTTPException as e:
        return DeleteLanguageResponse(
            success=False,
            message=e.detail,
            data=None
        )
    except Exception as e:
        db.rollback()
        raise_http_error(500, f"Error deleting language: {str(e)}")