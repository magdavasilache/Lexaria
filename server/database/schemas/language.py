from typing import Optional
from pydantic import BaseModel
from server.database.schemas.global_schemas import RequestResponse

class LanguageBase(BaseModel):
    name: str

class LanguageCreate(LanguageBase):
    pass

class LanguageOut(LanguageBase):
    id: int

    class Config:
        from_attributes = True

class CreateLanguageResponse(RequestResponse):
    data: Optional[LanguageOut] = None

class GetLanguagesResponse(RequestResponse):
    data: Optional[list[LanguageOut]] = None

class DeleteLanguageResponse(RequestResponse):
    data: bool