from collections.abc import Iterable, Sequence

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from server.database.models.comment import Comment
from server.database.models.genres import BookTag
from server.database.models.likes import CommentLike, ReviewLike
from server.database.models.review import REVIEW_RATING_MAX, Review
from server.database.schemas.review import ReviewListQuery, ReviewSort

TAG_SOURCE = "review_nlp"


def _with_details(statement):
    return statement.options(
        joinedload(Review.user),
        selectinload(Review.comments).joinedload(Comment.user),
    )


def list_for_book(db: Session, book_id: int, query: ReviewListQuery) -> tuple[Sequence[Review], int]:
    conditions = [Review.book_id == book_id, Review.content.is_not(None)]
    if query.stars is not None:
        if query.stars > 1:
            conditions.append(Review.rating >= query.stars)
        if query.stars < REVIEW_RATING_MAX:
            conditions.append(Review.rating < query.stars + 1)
        else:
            conditions.append(Review.rating.is_not(None))
    total = db.scalar(select(func.count()).select_from(Review).where(*conditions)) or 0
    ordering = (
        (Review.likes_count.desc(), Review.created_at.desc(), Review.id.desc())
        if query.sort == ReviewSort.TOP
        else (Review.created_at.desc(), Review.id.desc())
    )
    statement = _with_details(select(Review)).where(*conditions).order_by(*ordering).offset(query.offset).limit(query.limit)
    return db.scalars(statement).unique().all(), total


def get_review(db: Session, review_id: int) -> Review | None:
    return db.scalars(_with_details(select(Review)).where(Review.id == review_id)).first()


def get_user_review(db: Session, user_id: int, book_id: int) -> Review | None:
    statement = _with_details(select(Review)).where(Review.user_id == user_id, Review.book_id == book_id)
    return db.scalars(statement).first()


def get_comment(db: Session, comment_id: int) -> Comment | None:
    return db.scalars(select(Comment).options(joinedload(Comment.user)).where(Comment.id == comment_id)).first()


def liked_review_ids(db: Session, user_id: int, review_ids: Iterable[int]) -> set[int]:
    ids = set(review_ids)
    if not ids:
        return set()
    return set(db.scalars(select(ReviewLike.review_id).where(ReviewLike.user_id == user_id, ReviewLike.review_id.in_(ids))))


def liked_comment_ids(db: Session, user_id: int, comment_ids: Iterable[int]) -> set[int]:
    ids = set(comment_ids)
    if not ids:
        return set()
    return set(
        db.scalars(select(CommentLike.comment_id).where(CommentLike.user_id == user_id, CommentLike.comment_id.in_(ids)))
    )


def add(db: Session, item: Review | Comment) -> None:
    db.add(item)
    db.flush()


def delete_item(db: Session, item: Review | Comment) -> None:
    db.delete(item)
    db.flush()


def set_review_like(db: Session, user_id: int, review_id: int, liked: bool) -> int:
    existing = db.get(ReviewLike, (user_id, review_id))
    if liked and existing is None:
        db.add(ReviewLike(user_id=user_id, review_id=review_id))
    elif not liked and existing is not None:
        db.delete(existing)
    db.flush()
    return db.scalar(select(func.count()).select_from(ReviewLike).where(ReviewLike.review_id == review_id)) or 0


def set_comment_like(db: Session, user_id: int, comment_id: int, liked: bool) -> int:
    existing = db.get(CommentLike, (user_id, comment_id))
    if liked and existing is None:
        db.add(CommentLike(user_id=user_id, comment_id=comment_id))
    elif not liked and existing is not None:
        db.delete(existing)
    db.flush()
    return db.scalar(select(func.count()).select_from(CommentLike).where(CommentLike.comment_id == comment_id)) or 0


def replace_tags(db: Session, review: Review, tags: Iterable[tuple[str, float]]) -> None:
    db.execute(delete(BookTag).where(BookTag.review_id == review.id))
    db.add_all(
        BookTag(book_id=review.book_id, review_id=review.id, tag=tag, source=TAG_SOURCE, confidence=confidence)
        for tag, confidence in tags
    )
    db.flush()
