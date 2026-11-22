from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from server.core.dependencies import get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.book import BookListItem
from server.database.schemas.recommendation import RecommendationOut, RecommendationQuery, SimilarBooksQuery
from server.services import recommendation_service

router = APIRouter(tags=["Recommendations"], dependencies=[Depends(get_authenticated_user)])


@router.get(
    "/recommendations",
    response_model=ApiResponse[list[RecommendationOut]],
    summary="Books picked for the current user from their ratings, reads, favourite genres and moods",
    responses=error_responses(401, 422),
)
def recommendations(
    query: Annotated[RecommendationQuery, Query()],
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[list[RecommendationOut]]:
    return ok(recommendation_service.recommendations(db, user, query.limit))


@router.get(
    "/books/{book_id}/similar",
    response_model=ApiResponse[list[BookListItem]],
    summary="Books similar to this one by synopsis, genres, moods, pace and author",
    responses=error_responses(401, 404, 422),
)
def similar_books(
    book_id: Annotated[int, Path(ge=1)],
    query: Annotated[SimilarBooksQuery, Query()],
    db: Session = Depends(get_db),
) -> ApiResponse[list[BookListItem]]:
    return ok(recommendation_service.similar(db, book_id, query.limit))
