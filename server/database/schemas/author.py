from datetime import date
from typing import Optional
from pydantic import BaseModel

from server.database.schemas.global_schemas import RequestResponse

class AuthorBase(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    birthdate: Optional[date] = None
    country_id: Optional[int] = None
    about: Optional[str] = None

class AuthorSearchResult(BaseModel):
    id: int
    full_name: str

class AuthorCreate(AuthorBase):
    pass

class AuthorResponse(AuthorBase):
    id: int
    img_url: Optional[str] = None

    class Config:
        from_attributes = True

class AuthorCreateResponse(RequestResponse):
    data: AuthorResponse

class FormAuthorOut(BaseModel):
    id: int
    name: str

