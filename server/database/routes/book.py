import base64
from pathlib import Path
from fastapi import APIRouter, Body, Depends, File, Query, UploadFile
from server.database.crud.helpers.create_access_token import get_authenticated_user
from server.database.database import get_db
from sqlalchemy.orm import Session
from server.database.crud.book import create_new_book, get_all_books, add_goodreads_import, get_book_by_id
from server.database.models.user import User
from server.database.schemas.book import BookOut, CreateBook, GetBooksFilters, GoodreadsImportData
from server.database.schemas.responses import ErrorResponse

router = APIRouter(prefix='/book', tags=["Book"], dependencies=[Depends(get_authenticated_user)])

BASE_DIR = Path(__file__).resolve().parents[2]
BOOKS_STATIC_DIR = BASE_DIR / "static" / "books"

@router.get("/get_all_books")
def get_all_books_request(offset: int = 0, limit: int = 50, genres: list[int] = Query(default=None), authors: list[int] = Query(default=None), languages: list[int] = Query(default=None), ratings: list[int] = Query(default=None), db: Session = Depends(get_db),
):
    filters = GetBooksFilters(
        genres=genres,
        authors=authors,
        languages=languages,
        ratings=ratings,
    )
    return get_all_books(db, offset, limit, filters=filters)

@router.post("/process_goodreads_data")
async def process_goodreads_data(
    favorite_genres: UploadFile = File(...),
    reviews: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_authenticated_user),
):
    import_data = GoodreadsImportData(favorite_genres=favorite_genres, reviews=reviews)
    return await add_goodreads_import(db=db, import_data=import_data, user_id=user.id)

@router.get("/get_book_by_id/{book_id}", response_model=BookOut, responses={401: {"model": ErrorResponse}, 400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
def fetch_book_by_id(book_id: int, db: Session = Depends(get_db), user: User = Depends(get_authenticated_user)):
    return get_book_by_id(book_id=book_id, db=db, user_id=user.id)

@router.post('/create')
def create_new_book_request(book: CreateBook = Depends(), db: Session = Depends(get_db), user: User = Depends(get_authenticated_user)):
    return create_new_book(db=db, book=book, user=user)

@router.post("/images")
def get_images_request(filenames: list[str] = Body(...)):
    result: dict[str, str] = {}

    for filename in filenames:
        file_path = BOOKS_STATIC_DIR / filename
        print(file_path)

        if not file_path.exists() or not file_path.is_file():
            continue

        ext = file_path.suffix.lower().lstrip(".")

        with open(file_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")

        result[filename] = f"data:image/{ext};base64,{encoded}"

    return result