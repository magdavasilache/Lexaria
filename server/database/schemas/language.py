from typing import Annotated

from pydantic import Field

from server.database.models.language import LANGUAGE_NAME_MAX_LENGTH
from server.database.schemas.base import InputSchema, OutputSchema, name_field


class LanguageIn(InputSchema):
    name: name_field(LANGUAGE_NAME_MAX_LENGTH)


class LanguageOut(OutputSchema):
    id: int
    name: Annotated[str, Field(max_length=LANGUAGE_NAME_MAX_LENGTH)]
    books_count: int
