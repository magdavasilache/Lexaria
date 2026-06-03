from typing import Optional
from pydantic import BaseModel

from server.database.schemas.global_schemas import RequestResponse


class CountryBase(BaseModel):
    name: str

class CountryCreateSchema(CountryBase):
    language_id: Optional[int] = None

class CountryOut(CountryBase):
    id: int

    class Config:
        from_attributes = True

class CreateCountryResponse(RequestResponse):
    data: Optional[CountryOut] = None

class FormCountryOut(CountryBase):
    id: int

    class Config:
        from_attributes = True

class GetFormCountriesResponse(RequestResponse):
    data: Optional[list[FormCountryOut]] = None