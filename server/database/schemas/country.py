from typing import Annotated

from pydantic import Field

from server.database.models.country import COUNTRY_NAME_MAX_LENGTH
from server.database.models.language import LANGUAGE_NAME_MAX_LENGTH
from server.database.schemas.base import Id, InputSchema, OutputSchema, name_field


class CountryIn(InputSchema):
    name: name_field(COUNTRY_NAME_MAX_LENGTH)
    language_id: Id | None = None


class CountryOut(OutputSchema):
    id: int
    name: Annotated[str, Field(max_length=COUNTRY_NAME_MAX_LENGTH)]
    language_id: int | None
    language_name: Annotated[str | None, Field(max_length=LANGUAGE_NAME_MAX_LENGTH)]
    books_count: int
    authors_count: int
