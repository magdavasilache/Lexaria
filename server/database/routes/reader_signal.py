from typing import Annotated

from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from server.core.dependencies import get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.reader_signal import ReaderSignalsOut, ReaderVoteUpdate
from server.services import reader_signal_service

router = APIRouter(prefix="/books/{book_id}/signals", tags=["Moods & pace"])

BookId = Annotated[int, Path(ge=1)]


@router.get(
    "",
    response_model=ApiResponse[ReaderSignalsOut],
    summary="Readers' moods and pace for a book, with the current user's vote",
    responses=error_responses(401, 404, 422),
)
def get_signals(
    book_id: BookId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ReaderSignalsOut]:
    return ok(reader_signal_service.get_signals(db, book_id, user))


@router.put(
    "/mine",
    response_model=ApiResponse[ReaderSignalsOut],
    summary="Describe a book's moods and pace (readers who started it)",
    responses=error_responses(401, 403, 404, 422),
)
def set_vote(
    book_id: BookId,
    form: ReaderVoteUpdate,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ReaderSignalsOut]:
    return ok(reader_signal_service.set_vote(db, book_id, form, user))


@router.delete(
    "/mine",
    response_model=ApiResponse[ReaderSignalsOut],
    summary="Remove your moods and pace vote for a book",
    responses=error_responses(401, 404, 422),
)
def remove_vote(
    book_id: BookId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ReaderSignalsOut]:
    return ok(reader_signal_service.remove_vote(db, book_id, user))
