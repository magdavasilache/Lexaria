from sqlalchemy import func
from sqlalchemy.orm import Session

from server.database.crud.helpers.name_checks import is_similar, normalize
from server.database.crud.user import get_user_by_id
from server.database.models.language import Language
from server.database.schemas.language import LanguageCreate
from server.utils.errors import raise_http_error

def get_searched_language(db: Session, search_input: str):
    db_languages = (
        db.query(Language)
        .filter(Language.name.ilike(f"%{search_input}%"))
        .all()
    )
    if not db_languages:
        return []
    
    return db_languages

def create_new_language(db: Session, payload: LanguageCreate):
    name = payload.name
    normalized_name = normalize(value=name)

    existing = db.query(Language).filter(
        func.lower(Language.name) == normalized_name
    ).first()

    if existing:
        raise_http_error(status_code=400, detail="Language already exists")

    all_languages = db.query(Language.name).all()

    for (lang_name,) in all_languages:
        if is_similar(normalized_name, normalize(lang_name)):
            raise_http_error(status_code=400, detail=f"Similar language already exists: {lang_name}")

    new_language = Language(name=name.strip())

    db.add(new_language)
    db.commit()
    db.refresh(new_language)
    return new_language


def get_languages(db: Session):
    db_languages = (
        db.query(Language)
        .all()
    )
    return db_languages

def delete_language(db: Session, id: int):
    language = db.query(Language).filter(Language.id == id).first()

    if not language:
        raise_http_error(status_code=404, detail="Language not found")

    db.delete(language)
    db.commit()

    return True