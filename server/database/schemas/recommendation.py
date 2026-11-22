from typing import Annotated

from pydantic import Field

from server.core.message_keys import MessageParam
from server.database.schemas.base import InputSchema, OutputSchema
from server.database.schemas.book import BookListItem

RECOMMENDATIONS_DEFAULT = 12
SIMILAR_DEFAULT = 8
RECOMMENDATIONS_MAX = 24


class RecommendationQuery(InputSchema):
    limit: Annotated[int, Field(ge=1, le=RECOMMENDATIONS_MAX)] = RECOMMENDATIONS_DEFAULT


class SimilarBooksQuery(InputSchema):
    limit: Annotated[int, Field(ge=1, le=RECOMMENDATIONS_MAX)] = SIMILAR_DEFAULT


class RecommendationReason(OutputSchema):
    key: str
    params: dict[str, MessageParam]


class RecommendationOut(OutputSchema):
    book: BookListItem
    reason: RecommendationReason
