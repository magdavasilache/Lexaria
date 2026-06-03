from pydantic import BaseModel


class AwardBase(BaseModel):
    name: str
    description: str | None = None
    year: int | None = None
    image: str | None = None

class AwardCreate(AwardBase):
    pass

class AwardUOut(AwardBase):
    id: int

    class Config:
        from_attributes = True

class AwardFromSearch(BaseModel):
    id: int
    name: str
    year: int | None = None

    class Config:
        from_attributes = True