from datetime import datetime
from sqlalchemy.orm import Session

from server.database.crud.user import get_user_by_id
from server.database.models.user_book_status import UserBookStatus
from server.utils.errors import raise_http_error

def create_or_update_user_book_status(db: Session, user_id: int, book_id: int, status: str):
    validate_status(status)
    try:
        existing_status = get_user_book_status(db=db, user_id=user_id, book_id=book_id, status=status)
        if existing_status:
            existing_status.updated_at = datetime.now()
            db.commit()
            db.refresh(existing_status)
            return existing_status
        else:
            new_status = UserBookStatus(user_id=user_id, book_id=book_id, status=status)
            db.add(new_status)
            db.commit()
            db.refresh(new_status)
            return new_status
    except Exception as e:
        db.rollback()
        raise e
    
def get_user_book_status(db: Session, user_id: int, book_id: int, status: str):
    user_book_status = db.query(UserBookStatus).filter_by(user_id=user_id, book_id=book_id, status=status).first()
    return user_book_status

def validate_status(status: str):
    allowed_statuses = {"want_to_read", "currently_reading", "read", 'did_not_finish'}
    if status not in allowed_statuses:
        raise_http_error(
            status_code=400,
            detail=f"Invalid status '{status}'. Allowed statuses are: {', '.join(allowed_statuses)}.",
            code="INVALID_STATUS",
            hint="Please provide a valid status."
        )