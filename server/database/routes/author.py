from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile
from server.database.crud.helpers.create_access_token import get_authenticated_user
from server.database.database import get_db
from sqlalchemy.orm import Session
from server.database.models.user import User
from server.database.schemas.author import AuthorCreate, AuthorCreateResponse, AuthorSearchResult
from server.database.crud.author import get_existing_author, create_author, get_form_authors

router = APIRouter(prefix='/author', tags=["Author"], dependencies=[Depends(get_authenticated_user)])

@router.post('/create', response_model=AuthorCreateResponse)
def create_author_entry(
    first_name: str = Form(...),
    last_name: Optional[str] = Form(None),
    birthdate: Optional[date] = Form(None),
    country_id: Optional[int] = Form(None),
    about: Optional[str] = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    author_create = AuthorCreate(
        first_name=first_name,
        last_name=last_name,
        birthdate=birthdate,
        country_id=country_id,
        about=about
    )

    return create_author(db=db, author_create=author_create, img_url=image)

@router.get('/search_authors', response_model=list[AuthorSearchResult])
def search_authors(search_term: str, db: Session = Depends(get_db)):
    return get_existing_author(db=db, search_term=search_term)

@router.get("/form_authors")
def get_form_authors_request(db: Session = Depends(get_db)):
    return get_form_authors(db=db)