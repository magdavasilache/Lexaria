from sqlalchemy.orm import Session

from server.core.errors import ConflictError, ErrorCode, ForbiddenError, NotFoundError
from server.core.message_keys import MessageKey
from server.database.models.audit_log import AuditAction
from server.database.models.comment import Comment
from server.database.models.review import Review
from server.database.models.user import User, UserRole
from server.database.schemas.review import (
    ReviewerOut,
    CommentCreate,
    CommentOut,
    CommentUpdate,
    LikeOut,
    ReviewCreate,
    ReviewListQuery,
    ReviewOut,
    ReviewUpdate,
)
from server.repositories import book_repository, reader_signal_repository, review_repository
from server.services import audit_service, book_service
from server.services.review_tags import extract_tags

TAG_MIN_CONFIDENCE = 0.6


def _is_admin(user: User) -> bool:
    return user.role == UserRole.ADMIN


def _author(user: User) -> ReviewerOut:
    return ReviewerOut.model_validate(user)


def _comment_out(comment: Comment, user: User, liked: set[int]) -> CommentOut:
    return CommentOut(
        id=comment.id,
        review_id=comment.review_id,
        content=comment.content,
        author=_author(comment.user),
        likes_count=comment.likes_count,
        liked_by_me=comment.id in liked,
        can_edit=comment.user_id == user.id,
        can_delete=comment.user_id == user.id or _is_admin(user),
        created_at=comment.created_at,
        updated_at=comment.updated_at,
    )


def _reviews_out(db: Session, reviews: list[Review], user: User) -> list[ReviewOut]:
    liked_reviews = review_repository.liked_review_ids(db, user.id, (review.id for review in reviews))
    liked_comments = review_repository.liked_comment_ids(
        db, user.id, (comment.id for review in reviews for comment in review.comments)
    )
    return [
        ReviewOut(
            id=review.id,
            book_id=review.book_id,
            rating=float(review.rating) if review.rating is not None else None,
            content=review.content,
            start_date=review.start_date,
            end_date=review.end_date,
            has_spoilers=review.has_spoilers,
            author=_author(review.user),
            likes_count=review.likes_count,
            liked_by_me=review.id in liked_reviews,
            can_edit=review.user_id == user.id,
            can_delete=review.user_id == user.id or _is_admin(user),
            comments=[_comment_out(comment, user, liked_comments) for comment in review.comments],
            created_at=review.created_at,
            updated_at=review.updated_at,
        )
        for review in reviews
    ]


def _review_out(db: Session, review_id: int, user: User) -> ReviewOut:
    db.expire_all()
    return _reviews_out(db, [_load_review(db, review_id)], user)[0]


def _load_review(db: Session, review_id: int) -> Review:
    review = review_repository.get_review(db, review_id)
    if review is None:
        raise NotFoundError(
            MessageKey.REVIEW_NOT_FOUND, params={"review_id": review_id}, code=ErrorCode.REVIEW_NOT_FOUND
        )
    return review


def _load_comment(db: Session, comment_id: int) -> Comment:
    comment = review_repository.get_comment(db, comment_id)
    if comment is None:
        raise NotFoundError(
            MessageKey.COMMENT_NOT_FOUND, params={"comment_id": comment_id}, code=ErrorCode.COMMENT_NOT_FOUND
        )
    return comment


def _require_author(owner_id: int, user: User, key: MessageKey, *, allow_admin: bool) -> None:
    if owner_id != user.id and not (allow_admin and _is_admin(user)):
        raise ForbiddenError(key, code=ErrorCode.NOT_AUTHOR)


def _apply(review: Review, form: ReviewCreate) -> None:
    review.rating = form.rating
    review.content = form.content
    review.start_date = form.start_date
    review.end_date = form.end_date
    review.has_spoilers = form.has_spoilers


def _refresh_tags(db: Session, review: Review) -> None:
    matches = extract_tags(review.content, min_confidence=TAG_MIN_CONFIDENCE) if review.content else []
    review_repository.replace_tags(db, review, ((match.tag, match.confidence) for match in matches))


def _review_exists(book_id: int) -> ConflictError:
    return ConflictError(
        MessageKey.REVIEW_EXISTS,
        params={"book_id": book_id},
        code=ErrorCode.REVIEW_EXISTS,
        hint_key=MessageKey.REVIEW_EXISTS_HINT,
    )


def list_reviews(db: Session, book_id: int, query: ReviewListQuery, user: User) -> tuple[list[ReviewOut], int]:
    book_service.require_book(db, book_id)
    reviews, total = review_repository.list_for_book(db, book_id, query)
    return _reviews_out(db, list(reviews), user), total


def get_my_review(db: Session, book_id: int, user: User) -> ReviewOut | None:
    book_service.require_book(db, book_id)
    review = review_repository.get_user_review(db, user.id, book_id)
    return _reviews_out(db, [review], user)[0] if review else None


def create_review(db: Session, book_id: int, form: ReviewCreate, user: User) -> ReviewOut:
    params = {"username": user.username, "book_id": book_id}
    with audit_service.track(db, AuditAction.REVIEW_CREATE, actor=user, params=params) as entry:
        book = book_service.require_book(db, book_id)
        entry.params["title"] = book.title
        if review_repository.get_user_review(db, user.id, book_id) is not None:
            raise _review_exists(book_id)
        review = Review(user_id=user.id, book_id=book_id)
        _apply(review, form)
        review_repository.add(db, review)
        entry.set_entity("review", review.id)
        _refresh_tags(db, review)
        book_repository.refresh_ratings(db, [book_id])
        reader_signal_repository.refresh(db, [book_id])
    return _review_out(db, review.id, user)


def update_review(db: Session, review_id: int, form: ReviewUpdate, user: User) -> ReviewOut:
    params = {"username": user.username, "review_id": review_id}
    with audit_service.track(db, AuditAction.REVIEW_UPDATE, actor=user, params=params) as entry:
        entry.set_entity("review", review_id)
        review = _load_review(db, review_id)
        _require_author(review.user_id, user, MessageKey.REVIEW_NOT_AUTHOR, allow_admin=False)
        entry.params["title"] = review.book.title
        _apply(review, form)
        db.flush()
        _refresh_tags(db, review)
        book_repository.refresh_ratings(db, [review.book_id])
        reader_signal_repository.refresh(db, [review.book_id])
    return _review_out(db, review_id, user)


def delete_review(db: Session, review_id: int, user: User) -> None:
    params = {"username": user.username, "review_id": review_id}
    with audit_service.track(db, AuditAction.REVIEW_DELETE, actor=user, params=params) as entry:
        entry.set_entity("review", review_id)
        review = _load_review(db, review_id)
        _require_author(review.user_id, user, MessageKey.REVIEW_NOT_AUTHOR, allow_admin=True)
        entry.params["title"] = review.book.title
        book_id = review.book_id
        review_repository.delete_item(db, review)
        book_repository.refresh_ratings(db, [book_id])
        reader_signal_repository.refresh(db, [book_id])


def create_comment(db: Session, review_id: int, form: CommentCreate, user: User) -> CommentOut:
    params = {"username": user.username, "review_id": review_id}
    with audit_service.track(db, AuditAction.COMMENT_CREATE, actor=user, params=params) as entry:
        _load_review(db, review_id)
        comment = Comment(user_id=user.id, review_id=review_id, content=form.content)
        review_repository.add(db, comment)
        entry.params["comment_id"] = comment.id
        entry.set_entity("comment", comment.id)
    return _comment_view(db, comment.id, user)


def update_comment(db: Session, comment_id: int, form: CommentUpdate, user: User) -> CommentOut:
    params = {"username": user.username, "comment_id": comment_id}
    with audit_service.track(db, AuditAction.COMMENT_UPDATE, actor=user, params=params) as entry:
        entry.set_entity("comment", comment_id)
        comment = _load_comment(db, comment_id)
        _require_author(comment.user_id, user, MessageKey.COMMENT_NOT_AUTHOR, allow_admin=False)
        comment.content = form.content
        db.flush()
    return _comment_view(db, comment_id, user)


def delete_comment(db: Session, comment_id: int, user: User) -> None:
    params = {"username": user.username, "comment_id": comment_id}
    with audit_service.track(db, AuditAction.COMMENT_DELETE, actor=user, params=params) as entry:
        entry.set_entity("comment", comment_id)
        comment = _load_comment(db, comment_id)
        _require_author(comment.user_id, user, MessageKey.COMMENT_NOT_AUTHOR, allow_admin=True)
        entry.params["review_id"] = comment.review_id
        review_repository.delete_item(db, comment)


def _comment_view(db: Session, comment_id: int, user: User) -> CommentOut:
    db.expire_all()
    comment = _load_comment(db, comment_id)
    return _comment_out(comment, user, review_repository.liked_comment_ids(db, user.id, [comment_id]))


def set_review_like(db: Session, review_id: int, liked: bool, user: User) -> LikeOut:
    action = AuditAction.REVIEW_LIKE if liked else AuditAction.REVIEW_UNLIKE
    params = {"username": user.username, "review_id": review_id}
    with audit_service.track(db, action, actor=user, params=params) as entry:
        entry.set_entity("review", review_id)
        _load_review(db, review_id)
        count = review_repository.set_review_like(db, user.id, review_id, liked)
    return LikeOut(liked=liked, likes_count=count)


def set_comment_like(db: Session, comment_id: int, liked: bool, user: User) -> LikeOut:
    action = AuditAction.COMMENT_LIKE if liked else AuditAction.COMMENT_UNLIKE
    params = {"username": user.username, "comment_id": comment_id}
    with audit_service.track(db, action, actor=user, params=params) as entry:
        entry.set_entity("comment", comment_id)
        _load_comment(db, comment_id)
        count = review_repository.set_comment_like(db, user.id, comment_id, liked)
    return LikeOut(liked=liked, likes_count=count)
