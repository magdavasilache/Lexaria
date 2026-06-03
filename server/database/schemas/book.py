from datetime import date, datetime
from typing import List, Optional
from fastapi import File, Form, UploadFile
from pydantic import BaseModel

from server.database.schemas.genre import GenreOut
from server.database.schemas.global_schemas import RequestResponse
from server.database.schemas.user_book_status import UserBookStatusOut

class BookBase(BaseModel):
    title: str

class CreateBook:
    def __init__(
        self,
        title: str = Form(...),
        author_id: Optional[int] = Form(None),
        pages: Optional[int] = Form(None),
        language_id: Optional[int] = Form(None),
        published_at: Optional[date] = Form(None),
        synopsis: Optional[str] = Form(None),
        parent_id: Optional[int] = Form(None),
        country_id: Optional[int] = Form(None),
        awards: Optional[List[int]] = Form(None),
        settings: Optional[List[str]] = Form(None),
        characters: Optional[List[str]] = Form(None),
        images: List[UploadFile] = File(default=[]),
    ):
        self.title = title
        self.author_id = author_id
        self.pages = pages
        self.language_id = language_id
        self.published_at = published_at
        self.synopsis = synopsis
        self.parent_id = parent_id
        self.country_id = country_id
        self.awards = awards
        self.settings = settings
        self.characters = characters
        self.images = images

class BookOutBase(BookBase):
    id: int
    pages: Optional[int] = None
    language_name: Optional[str] = None
    image: Optional[str] = None
    synopsis: Optional[str] = None
    tags: Optional[List[str]] = None
    author_name: Optional[str] = None

class BookOut(BookBase):
    id: int
    images: Optional[List[str]] = None
    author_name: Optional[str] = None
    pages: Optional[int] = None
    language_name: Optional[str] = None
    published_at: Optional[date] = None
    created_at: Optional[datetime] = None
    synopsis: Optional[str] = None
    settings: Optional[List[str]] = None
    characters: Optional[List[str]] = None
    parent_id: Optional[int] = None
    country_name: Optional[str] = None
    genres: Optional[list[GenreOut]] = None
    user_book_status: Optional[UserBookStatusOut] = None
    tags: Optional[List[str]] = None
    average_rating: Optional[float] = None
    five_stars: Optional[int] = None
    four_stars: Optional[int] = None
    three_stars: Optional[int] = None
    two_stars: Optional[int] = None
    one_star: Optional[int] = None
    zero_stars: Optional[int] = None

    class Config:
        from_attributes = True

class GetBooksOutput(BaseModel):
    total_count: int
    books: list[BookOutBase]

class GoodreadsImportData(BaseModel):
    favorite_genres: UploadFile
    reviews: UploadFile

class CreateBookOut(BaseModel):
    id: int
    title: str
    author_name: Optional[str] = None
    image: Optional[str] = None

class BookCreateResponse(RequestResponse):
    data: CreateBookOut

class GetBooksFilters(BaseModel):
    genres: Optional[List[int]] = None
    languages: Optional[List[int]] = None
    authors: Optional[List[int]] = None
    ratings: Optional[List[int]] = None