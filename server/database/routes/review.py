from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from server.core.dependencies import get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.review import (
    CommentCreate,
    CommentOut,
    CommentUpdate,
    LikeOut,
    ReviewCreate,
    ReviewListQuery,
    ReviewOut,
    ReviewUpdate,
)
from server.services import review_service

router = APIRouter(tags=["Reviews"], dependencies=[Depends(get_authenticated_user)])

BookId = Annotated[int, Path(ge=1)]
ReviewId = Annotated[int, Path(ge=1)]
CommentId = Annotated[int, Path(ge=1)]


@router.get(
    "/books/{book_id}/reviews",
    response_model=ApiResponse[list[ReviewOut]],
    summary="List a book's written reviews with their comments",
    responses=error_responses(401, 404, 422),
)
def list_reviews(
    book_id: BookId,
    query: Annotated[ReviewListQuery, Query()],
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[list[ReviewOut]]:
    reviews, total = review_service.list_reviews(db, book_id, query, user)
    return ok(reviews, meta={"total": total, "offset": query.offset, "limit": query.limit})


@router.get(
    "/books/{book_id}/reviews/mine",
    response_model=ApiResponse[ReviewOut | None],
    summary="Get the current user's review of a book, if any",
    responses=error_responses(401, 404, 422),
)
def get_my_review(
    book_id: BookId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ReviewOut | None]:
    return ok(review_service.get_my_review(db, book_id, user))


@router.post(
    "/books/{book_id}/reviews",
    response_model=ApiResponse[ReviewOut],
    status_code=status.HTTP_201_CREATED,
    summary="Rate or review a book",
    responses=error_responses(401, 404, 409, 422),
)
def create_review(
    book_id: BookId,
    form: ReviewCreate,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ReviewOut]:
    return ok(review_service.create_review(db, book_id, form, user))


@router.put(
    "/reviews/{review_id}",
    response_model=ApiResponse[ReviewOut],
    summary="Replace your review",
    responses=error_responses(401, 403, 404, 422),
)
def update_review(
    review_id: ReviewId,
    form: ReviewUpdate,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ReviewOut]:
    return ok(review_service.update_review(db, review_id, form, user))


@router.delete(
    "/reviews/{review_id}",
    response_model=ApiResponse[None],
    summary="Delete a review with its comments and likes (author or admin)",
    responses=error_responses(401, 403, 404, 422),
)
def delete_review(
    review_id: ReviewId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    review_service.delete_review(db, review_id, user)
    return ok(None)


@router.put(
    "/reviews/{review_id}/like",
    response_model=ApiResponse[LikeOut],
    summary="Like a review",
    responses=error_responses(401, 404, 422),
)
def like_review(
    review_id: ReviewId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[LikeOut]:
    return ok(review_service.set_review_like(db, review_id, True, user))


@router.delete(
    "/reviews/{review_id}/like",
    response_model=ApiResponse[LikeOut],
    summary="Remove your like from a review",
    responses=error_responses(401, 404, 422),
)
def unlike_review(
    review_id: ReviewId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[LikeOut]:
    return ok(review_service.set_review_like(db, review_id, False, user))


@router.post(
    "/reviews/{review_id}/comments",
    response_model=ApiResponse[CommentOut],
    status_code=status.HTTP_201_CREATED,
    summary="Comment on a review",
    responses=error_responses(401, 404, 422),
)
def create_comment(
    review_id: ReviewId,
    form: CommentCreate,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[CommentOut]:
    return ok(review_service.create_comment(db, review_id, form, user))


@router.put(
    "/comments/{comment_id}",
    response_model=ApiResponse[CommentOut],
    summary="Edit your comment",
    responses=error_responses(401, 403, 404, 422),
)
def update_comment(
    comment_id: CommentId,
    form: CommentUpdate,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[CommentOut]:
    return ok(review_service.update_comment(db, comment_id, form, user))


@router.delete(
    "/comments/{comment_id}",
    response_model=ApiResponse[None],
    summary="Delete a comment (author or admin)",
    responses=error_responses(401, 403, 404, 422),
)
def delete_comment(
    comment_id: CommentId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    review_service.delete_comment(db, comment_id, user)
    return ok(None)


@router.put(
    "/comments/{comment_id}/like",
    response_model=ApiResponse[LikeOut],
    summary="Like a comment",
    responses=error_responses(401, 404, 422),
)
def like_comment(
    comment_id: CommentId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[LikeOut]:
    return ok(review_service.set_comment_like(db, comment_id, True, user))


@router.delete(
    "/comments/{comment_id}/like",
    response_model=ApiResponse[LikeOut],
    summary="Remove your like from a comment",
    responses=error_responses(401, 404, 422),
)
def unlike_comment(
    comment_id: CommentId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[LikeOut]:
    return ok(review_service.set_comment_like(db, comment_id, False, user))
