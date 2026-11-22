from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from server.core.dependencies import get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.reading import (
    ActiveSessionOut,
    JourneyOut,
    NoteCreate,
    NoteUpdate,
    ReadingEventOut,
    ReadingGoalOut,
    ReadingGoalSet,
    ReadingOut,
    ReadingTodayOut,
    ReadingTodayQuery,
    ReadingUpdate,
    SessionEnd,
    SessionStart,
)
from server.services import reading_goal_service, reading_journey_service, reading_session_service

router = APIRouter(tags=["Reading"], dependencies=[Depends(get_authenticated_user)])

BookId = Annotated[int, Path(ge=1)]
SessionId = Annotated[int, Path(ge=1)]
ReadingId = Annotated[int, Path(ge=1)]
NoteId = Annotated[int, Path(ge=1)]


@router.get(
    "/reading/sessions/active",
    response_model=ApiResponse[ActiveSessionOut | None],
    summary="Get your running reading session, if any",
    responses=error_responses(401),
)
def get_active_session(
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ActiveSessionOut | None]:
    return ok(reading_session_service.get_active(db, user))


@router.post(
    "/books/{book_id}/sessions",
    response_model=ApiResponse[ActiveSessionOut],
    status_code=status.HTTP_201_CREATED,
    summary="Start a reading session (puts the book on Currently reading if needed)",
    responses=error_responses(401, 404, 409, 422),
)
def start_session(
    book_id: BookId,
    form: SessionStart,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ActiveSessionOut]:
    return ok(reading_session_service.start_session(db, book_id, form, user))


@router.post(
    "/reading/sessions/{session_id}/pause",
    response_model=ApiResponse[ActiveSessionOut],
    summary="Pause your running reading session",
    responses=error_responses(401, 404, 409, 422),
)
def pause_session(
    session_id: SessionId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ActiveSessionOut]:
    return ok(reading_session_service.pause_session(db, session_id, user))


@router.post(
    "/reading/sessions/{session_id}/resume",
    response_model=ApiResponse[ActiveSessionOut],
    summary="Resume your paused reading session",
    responses=error_responses(401, 404, 409, 422),
)
def resume_session(
    session_id: SessionId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ActiveSessionOut]:
    return ok(reading_session_service.resume_session(db, session_id, user))


@router.post(
    "/reading/sessions/{session_id}/end",
    response_model=ApiResponse[ReadingOut],
    summary="End your reading session, saving progress and an optional note",
    responses=error_responses(401, 404, 409, 422),
)
def end_session(
    session_id: SessionId,
    form: SessionEnd,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ReadingOut]:
    return ok(reading_session_service.end_session(db, session_id, form, user))


@router.delete(
    "/reading/sessions/{session_id}",
    response_model=ApiResponse[None],
    summary="Discard a reading session",
    responses=error_responses(401, 404, 422),
)
def discard_session(
    session_id: SessionId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    reading_session_service.discard_session(db, session_id, user)
    return ok(None)


@router.put(
    "/readings/{reading_id}",
    response_model=ApiResponse[ReadingOut],
    summary="Correct a read-through's edition, dates and progress",
    responses=error_responses(401, 404, 422),
)
def update_reading(
    reading_id: ReadingId,
    form: ReadingUpdate,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ReadingOut]:
    return ok(reading_journey_service.update_reading(db, reading_id, form, user))


@router.delete(
    "/readings/{reading_id}",
    response_model=ApiResponse[None],
    summary="Delete a read-through with its sessions and notes",
    responses=error_responses(401, 404, 422),
)
def delete_reading(
    reading_id: ReadingId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    reading_journey_service.delete_reading(db, reading_id, user)
    return ok(None)


@router.post(
    "/readings/{reading_id}/notes",
    response_model=ApiResponse[ReadingEventOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add a note to a read-through",
    responses=error_responses(401, 404, 422),
)
def create_note(
    reading_id: ReadingId,
    form: NoteCreate,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ReadingEventOut]:
    return ok(reading_journey_service.create_note(db, reading_id, form, user))


@router.put(
    "/reading/notes/{note_id}",
    response_model=ApiResponse[ReadingEventOut],
    summary="Edit one of your reading notes",
    responses=error_responses(401, 404, 422),
)
def update_note(
    note_id: NoteId,
    form: NoteUpdate,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ReadingEventOut]:
    return ok(reading_journey_service.update_note(db, note_id, form, user))


@router.delete(
    "/reading/notes/{note_id}",
    response_model=ApiResponse[None],
    summary="Delete one of your reading notes",
    responses=error_responses(401, 404, 422),
)
def delete_note(
    note_id: NoteId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    reading_journey_service.delete_note(db, note_id, user)
    return ok(None)


@router.get(
    "/books/{book_id}/journey",
    response_model=ApiResponse[JourneyOut],
    summary="Your reading journey for a book: shelf history and every read-through with its timeline",
    responses=error_responses(401, 404, 422),
)
def get_journey(
    book_id: BookId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[JourneyOut]:
    return ok(reading_journey_service.get_journey(db, book_id, user))


@router.get(
    "/reading/today",
    response_model=ApiResponse[ReadingTodayOut],
    summary="Time read today in your time zone (ended sessions) and your daily goal",
    responses=error_responses(401, 422),
)
def get_today(
    query: Annotated[ReadingTodayQuery, Query()],
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ReadingTodayOut]:
    return ok(reading_goal_service.get_today(db, query, user))


@router.put(
    "/users/me/reading-goal",
    response_model=ApiResponse[ReadingGoalOut],
    summary="Set or clear your daily reading goal in minutes",
    responses=error_responses(401, 422),
)
def set_reading_goal(
    form: ReadingGoalSet,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[ReadingGoalOut]:
    return ok(reading_goal_service.set_goal(db, form, user))
