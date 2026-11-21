from typing import Annotated

from fastapi import APIRouter, Depends, Form, Path, Query, status
from sqlalchemy.orm import Session

from server.core.dependencies import get_admin_user, get_authenticated_user
from server.core.responses import ApiResponse, error_responses, ok
from server.database.database import get_db
from server.database.models.user import User
from server.database.schemas.book import BookCreate, BookDetail, BookListItem, BookListQuery, BookUpdate
from server.services import book_service

router = APIRouter(prefix="/books", tags=["Books"], dependencies=[Depends(get_authenticated_user)])

BookId = Annotated[int, Path(ge=1)]


@router.get(
    "",
    response_model=ApiResponse[list[BookListItem]],
    summary="List books with filters, sorting and paging",
    responses=error_responses(401, 422),
)
def list_books(
    query: Annotated[BookListQuery, Query()],
    db: Session = Depends(get_db),
) -> ApiResponse[list[BookListItem]]:
    books, total = book_service.list_books(db, query)
    return ok(books, meta={"total": total, "offset": query.offset, "limit": query.limit})


@router.get(
    "/{book_id}",
    response_model=ApiResponse[BookDetail],
    summary="Get a book with its ratings and the current user's reading status",
    responses=error_responses(401, 404, 422),
)
def get_book(
    book_id: BookId,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> ApiResponse[BookDetail]:
    return ok(book_service.get_book(db, book_id, user))


@router.post(
    "",
    response_model=ApiResponse[BookDetail],
    status_code=status.HTTP_201_CREATED,
    summary="Add a book (admin)",
    responses=error_responses(401, 403, 422),
)
def create_book(
    form: Annotated[BookCreate, Form()],
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[BookDetail]:
    return ok(book_service.create_book(db, form, user))


@router.put(
    "/{book_id}",
    response_model=ApiResponse[BookDetail],
    summary="Replace a book's details and images (admin)",
    responses=error_responses(401, 403, 404, 422),
)
def update_book(
    book_id: BookId,
    form: Annotated[BookUpdate, Form()],
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[BookDetail]:
    return ok(book_service.update_book(db, book_id, form, user))


@router.delete(
    "/{book_id}",
    response_model=ApiResponse[None],
    summary="Delete a book with its reviews and reading statuses (admin)",
    responses=error_responses(401, 403, 404, 422),
)
def delete_book(
    book_id: BookId,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ApiResponse[None]:
    book_service.delete_book(db, book_id, user)
    return ok(None)
