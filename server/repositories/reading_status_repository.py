from sqlalchemy.orm import Session

from server.database.models.user_book_status import ReadingStatus, UserBookStatus


def get_status(db: Session, user_id: int, book_id: int) -> UserBookStatus | None:
    return db.get(UserBookStatus, (user_id, book_id))


def set_status(db: Session, user_id: int, book_id: int, status: ReadingStatus) -> UserBookStatus:
    entry = get_status(db, user_id, book_id)
    if entry is None:
        entry = UserBookStatus(user_id=user_id, book_id=book_id, status=status.value)
        db.add(entry)
    else:
        entry.status = status.value
    db.flush()
    return entry


def remove_status(db: Session, user_id: int, book_id: int) -> bool:
    entry = get_status(db, user_id, book_id)
    if entry is None:
        return False
    db.delete(entry)
    db.flush()
    return True
