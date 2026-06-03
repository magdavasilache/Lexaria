from datetime import datetime
from pathlib import Path
import shutil
from uuid import uuid4
from sqlalchemy import or_
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from server.database.models.author import Author
from server.database.schemas.author import AuthorCreate, AuthorSearchResult, AuthorCreateResponse, FormAuthorOut
from server.utils.logger import logger

AUTHOR_IMAGE_DIR = Path("server/static/author")
AUTHOR_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

def create_author(db: Session, author_create: AuthorCreate, img_url: UploadFile | None,) -> AuthorCreateResponse:
    try:
        image_name = save_author_image(img_url)
        new_author = Author(
            first_name=author_create.first_name, 
            last_name=author_create.last_name,
            img_url=image_name,
            birthdate=author_create.birthdate,
            country_id=author_create.country_id,
            created_at=datetime.now(),
            about=author_create.about
        )
        db.add(new_author)
        db.commit()
        db.refresh(new_author)
        return AuthorCreateResponse(success=True, data=new_author, message="Author created succeessfully!")
    except:
        raise

def get_existing_author(db: Session, search_term: str):
    try:  
        db_search_results = (
            db.query(Author)
            .filter(
                or_(
                    Author.first_name.like(f"%{search_term}%"),
                    Author.last_name.like(f"%{search_term}%")
                )
            )
            .all()
        )
        if not db_search_results:
            return []
        result = [AuthorSearchResult(
            id=author.id, full_name=f"{author.first_name} {author.last_name}"
        ) for author in db_search_results]
        return result
    except Exception as e:
        logger.warning(f"Error: ", str(e))
        HTTPException(status_code=500, detail=str(e))

def save_author_image(image: UploadFile | None) -> str | None:
    if not image or not image.filename:
        return None

    extension = Path(image.filename).suffix
    filename = f"{uuid4().hex}{extension}"
    file_path = AUTHOR_IMAGE_DIR / filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    return filename

def get_form_authors(db: Session):
    db_authors = db.query(Author).all()
    response = []
    for author in db_authors:
        response.append(FormAuthorOut(id=author.id, name=f"{author.first_name} {author.last_name}"))
    return response
