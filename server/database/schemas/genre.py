from typing import Annotated

from pydantic import Field

from server.database.models.genres import GENRE_NAME_MAX_LENGTH
from server.database.schemas.base import InputSchema, OutputSchema, name_field


class GenreIn(InputSchema):
    name: name_field(GENRE_NAME_MAX_LENGTH)


class GenreOut(OutputSchema):
    id: int
    name: Annotated[str, Field(max_length=GENRE_NAME_MAX_LENGTH)]
    books_count: int
