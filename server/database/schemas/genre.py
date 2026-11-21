from server.database.schemas.base import OutputSchema


class GenreOut(OutputSchema):
    id: int
    name: str
