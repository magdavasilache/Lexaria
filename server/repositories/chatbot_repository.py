from collections.abc import Collection, Sequence
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Select, case, func, literal, or_, select
from sqlalchemy.orm import Session, aliased, joinedload, selectinload

from server.database.models.author import Author
from server.database.models.book import Book
from server.database.models.chatbot import (
    ChatbotConversation,
    ChatbotIntent,
    ChatbotMessage,
    ChatbotPattern,
    ChatbotResponse,
    ChatbotTraining,
    ChatbotUnknownMessage,
    ChatFeedback,
    ChatRole,
)
from server.database.models.genres import BookTag, Genre, book_genres
from server.database.models.user_book_status import ReadingStatus, UserBookStatus

LIKE_ESCAPE = "\\"
MENTION_MIN_LENGTH = 3
EXCLUDED_STATUSES = (ReadingStatus.READ, ReadingStatus.CURRENTLY_READING, ReadingStatus.DID_NOT_FINISH)


def _contains(column, text: str):
    escaped = text.replace(LIKE_ESCAPE, LIKE_ESCAPE * 2).replace("%", r"\%").replace("_", r"\_")
    return column.ilike(f"%{escaped}%", escape=LIKE_ESCAPE)


def _same_text(column, text: str):
    return func.lower(column) == func.lower(literal(text))


def add(db: Session, entity) -> None:
    db.add(entity)
    db.flush()


def delete(db: Session, entity) -> None:
    db.delete(entity)
    db.flush()


def list_intents(db: Session, intent_id: int | None = None) -> Sequence[ChatbotIntent]:
    query = select(ChatbotIntent).options(selectinload(ChatbotIntent.patterns), selectinload(ChatbotIntent.responses))
    if intent_id is not None:
        query = query.where(ChatbotIntent.id == intent_id)
    return db.scalars(query.order_by(ChatbotIntent.tag)).all()


def get_intent(db: Session, intent_id: int) -> ChatbotIntent | None:
    return db.get(ChatbotIntent, intent_id)


def get_intent_by_tag(db: Session, tag: str) -> ChatbotIntent | None:
    return db.scalar(
        select(ChatbotIntent).options(selectinload(ChatbotIntent.responses)).where(ChatbotIntent.tag == tag)
    )


def tag_taken(db: Session, tag: str, exclude_id: int | None) -> bool:
    query = select(ChatbotIntent.id).where(ChatbotIntent.tag == tag)
    if exclude_id is not None:
        query = query.where(ChatbotIntent.id != exclude_id)
    return db.scalar(query.limit(1)) is not None


def get_pattern(db: Session, pattern_id: int) -> ChatbotPattern | None:
    return db.scalar(
        select(ChatbotPattern).options(joinedload(ChatbotPattern.intent)).where(ChatbotPattern.id == pattern_id)
    )


def pattern_owner(db: Session, pattern: str, exclude_id: int | None) -> ChatbotIntent | None:
    query = (
        select(ChatbotIntent)
        .join(ChatbotPattern)
        .where(_same_text(ChatbotPattern.pattern, pattern))
    )
    if exclude_id is not None:
        query = query.where(ChatbotPattern.id != exclude_id)
    return db.scalar(query.limit(1))


def get_response(db: Session, response_id: int) -> ChatbotResponse | None:
    return db.scalar(
        select(ChatbotResponse).options(joinedload(ChatbotResponse.intent)).where(ChatbotResponse.id == response_id)
    )


def response_taken(db: Session, intent_id: int, language: str, response: str, exclude_id: int | None) -> bool:
    query = select(ChatbotResponse.id).where(
        ChatbotResponse.intent_id == intent_id,
        ChatbotResponse.language == language,
        _same_text(ChatbotResponse.response, response),
    )
    if exclude_id is not None:
        query = query.where(ChatbotResponse.id != exclude_id)
    return db.scalar(query.limit(1)) is not None


def list_unknown_messages(db: Session) -> Sequence[ChatbotUnknownMessage]:
    return db.scalars(
        select(ChatbotUnknownMessage).order_by(
            ChatbotUnknownMessage.last_seen_at.desc(), ChatbotUnknownMessage.id.desc()
        )
    ).all()


def get_unknown_message(db: Session, message_id: int) -> ChatbotUnknownMessage | None:
    return db.get(ChatbotUnknownMessage, message_id)


def record_unknown_message(db: Session, message: str, confidence: float) -> None:
    existing = db.scalar(
        select(ChatbotUnknownMessage).where(_same_text(ChatbotUnknownMessage.message, message))
    )
    if existing is None:
        add(db, ChatbotUnknownMessage(message=message, confidence=confidence))
        return
    existing.occurrences += 1
    existing.confidence = confidence
    existing.last_seen_at = func.now()
    db.flush()


def list_trainings(db: Session, training_id: int | None = None) -> Sequence[ChatbotTraining]:
    query = select(ChatbotTraining)
    if training_id is not None:
        query = query.where(ChatbotTraining.id == training_id)
    return db.scalars(query.order_by(ChatbotTraining.created_at.desc(), ChatbotTraining.id.desc())).all()


def training_samples(db: Session) -> list[tuple[str, str]]:
    return [
        (pattern, tag)
        for pattern, tag in db.execute(
            select(ChatbotPattern.pattern, ChatbotIntent.tag)
            .join(ChatbotIntent)
            .order_by(ChatbotIntent.tag, ChatbotPattern.id)
        ).all()
    ]


def get_conversation(db: Session, conversation_id: int, user_id: int) -> ChatbotConversation | None:
    return db.scalar(
        select(ChatbotConversation).where(
            ChatbotConversation.id == conversation_id, ChatbotConversation.user_id == user_id
        )
    )


def latest_conversation(db: Session, user_id: int) -> ChatbotConversation | None:
    return db.scalar(
        select(ChatbotConversation)
        .where(ChatbotConversation.user_id == user_id)
        .order_by(ChatbotConversation.created_at.desc(), ChatbotConversation.id.desc())
        .limit(1)
    )


def conversation_messages(db: Session, conversation_id: int, limit: int) -> list[ChatbotMessage]:
    recent = db.scalars(
        select(ChatbotMessage)
        .options(joinedload(ChatbotMessage.intent))
        .where(ChatbotMessage.conversation_id == conversation_id)
        .order_by(ChatbotMessage.created_at.desc(), ChatbotMessage.id.desc())
        .limit(limit)
    ).all()
    return list(reversed(recent))


def add_messages(db: Session, *messages: ChatbotMessage) -> None:
    db.add_all(messages)
    db.flush()


def get_user_bot_message(db: Session, message_id: int, user_id: int) -> ChatbotMessage | None:
    return db.scalar(
        select(ChatbotMessage)
        .join(ChatbotConversation)
        .where(
            ChatbotMessage.id == message_id,
            ChatbotMessage.role == ChatRole.BOT,
            ChatbotConversation.user_id == user_id,
        )
    )


def _question():
    asked = aliased(ChatbotMessage)
    return (
        select(asked.message)
        .where(
            asked.conversation_id == ChatbotMessage.conversation_id,
            asked.role == ChatRole.USER,
            asked.id < ChatbotMessage.id,
        )
        .order_by(asked.id.desc())
        .limit(1)
        .correlate(ChatbotMessage)
        .scalar_subquery()
    )


def _pending_feedback():
    return (ChatbotMessage.feedback == ChatFeedback.DOWN, ChatbotMessage.feedback_reviewed.is_(False))


def feedback_queue(db: Session) -> list[tuple[ChatbotMessage, str | None]]:
    rows = db.execute(
        select(ChatbotMessage, _question())
        .options(joinedload(ChatbotMessage.intent))
        .where(*_pending_feedback())
        .order_by(ChatbotMessage.created_at.desc(), ChatbotMessage.id.desc())
    ).all()
    return [(message, question) for message, question in rows]


def get_pending_feedback(db: Session, message_id: int) -> tuple[ChatbotMessage, str | None] | None:
    row = db.execute(
        select(ChatbotMessage, _question()).where(ChatbotMessage.id == message_id, *_pending_feedback())
    ).first()
    return (row[0], row[1]) if row else None


def _week(column):
    return func.date_trunc("week", func.timezone("UTC", column))


def weekly_messages(db: Session, since: datetime) -> dict[date, tuple[int, int, int, int]]:
    week = _week(ChatbotMessage.created_at)
    rows = db.execute(
        select(
            week,
            func.count(),
            func.count(case((ChatbotMessage.fallback.is_(True), 1))),
            func.count(case((ChatbotMessage.feedback == ChatFeedback.UP, 1))),
            func.count(case((ChatbotMessage.feedback == ChatFeedback.DOWN, 1))),
        )
        .where(ChatbotMessage.role == ChatRole.BOT, ChatbotMessage.created_at >= since)
        .group_by(week)
    ).all()
    return {start.date(): (messages, fallbacks, up, down) for start, messages, fallbacks, up, down in rows}


def weekly_unknowns(db: Session, since: datetime) -> dict[date, int]:
    week = _week(ChatbotUnknownMessage.created_at)
    rows = db.execute(
        select(week, func.count()).where(ChatbotUnknownMessage.created_at >= since).group_by(week)
    ).all()
    return {start.date(): count for start, count in rows}


def intent_counts(db: Session, since: datetime) -> list[tuple[str, int]]:
    count = func.count(ChatbotMessage.id)
    rows = db.execute(
        select(ChatbotIntent.tag, count)
        .join(ChatbotMessage, ChatbotMessage.intent_id == ChatbotIntent.id)
        .where(ChatbotMessage.role == ChatRole.BOT, ChatbotMessage.created_at >= since)
        .group_by(ChatbotIntent.tag)
        .order_by(count.desc(), ChatbotIntent.tag)
    ).all()
    return [(tag, total) for tag, total in rows]


def patterns_by_text(db: Session, texts: Collection[str]) -> dict[str, ChatbotPattern]:
    if not texts:
        return {}
    patterns = db.scalars(
        select(ChatbotPattern)
        .options(joinedload(ChatbotPattern.intent))
        .where(or_(*(_same_text(ChatbotPattern.pattern, text) for text in set(texts))))
    )
    return {pattern.pattern.lower(): pattern for pattern in patterns}


def _books() -> Select[tuple[Book]]:
    return select(Book).options(joinedload(Book.author))


def find_book_by_title(db: Session, title: str) -> Book | None:
    return db.scalar(
        select(Book)
        .options(joinedload(Book.author), selectinload(Book.genres), selectinload(Book.tags))
        .where(_contains(Book.title, title))
        .order_by(Book.ratings_count.desc(), Book.id)
        .limit(1)
    )


def _mentioned_in(message: str, column):
    return func.strpos(func.lower(literal(message)), func.lower(column)) > 0


def books_mentioned(db: Session, message: str, limit: int) -> list[Book]:
    return list(
        db.scalars(
            select(Book)
            .options(joinedload(Book.author), selectinload(Book.genres), selectinload(Book.tags))
            .where(func.length(Book.title) >= MENTION_MIN_LENGTH, _mentioned_in(message, Book.title))
            .order_by(func.length(Book.title).desc(), Book.ratings_count.desc())
            .limit(limit)
        ).unique()
    )


def authors_mentioned(db: Session, message: str, limit: int) -> list[Author]:
    full_name = Author.full_name
    return list(
        db.scalars(
            select(Author)
            .where(func.length(full_name) >= MENTION_MIN_LENGTH, _mentioned_in(message, full_name))
            .order_by(func.length(full_name).desc(), Author.id)
            .limit(limit)
        )
    )


def genres_mentioned(db: Session, message: str, limit: int) -> list[Genre]:
    return list(
        db.scalars(
            select(Genre)
            .where(func.length(Genre.name) >= MENTION_MIN_LENGTH, _mentioned_in(message, Genre.name))
            .order_by(func.length(Genre.name).desc(), Genre.id)
            .limit(limit)
        )
    )


def find_author_by_name(db: Session, name: str) -> Author | None:
    parts = name.split()
    conditions = [_contains(Author.full_name, name)]
    conditions += [_contains(Author.last_name, part) for part in parts[1:]] if len(parts) > 1 else [
        _contains(Author.first_name, name),
        _contains(Author.last_name, name),
    ]
    return db.scalar(select(Author).where(or_(*conditions)).order_by(Author.id).limit(1))


def find_genre_by_name(db: Session, name: str) -> Genre | None:
    return db.scalar(select(Genre).where(_contains(Genre.name, name)).order_by(func.length(Genre.name)).limit(1))


def excluded_book_ids(db: Session, user_id: int) -> set[int]:
    return set(
        db.scalars(
            select(UserBookStatus.book_id).where(
                UserBookStatus.user_id == user_id, UserBookStatus.status.in_(EXCLUDED_STATUSES)
            )
        )
    )


def book_statuses(db: Session, user_id: int, book_ids: Collection[int]) -> dict[int, str]:
    if not book_ids:
        return {}
    rows = db.execute(
        select(UserBookStatus.book_id, UserBookStatus.status).where(
            UserBookStatus.user_id == user_id, UserBookStatus.book_id.in_(book_ids)
        )
    ).all()
    return {book_id: status for book_id, status in rows}










def genres_by_ids(db: Session, genre_ids: Sequence[int]) -> list[Genre]:
    return list(db.scalars(select(Genre).where(Genre.id.in_(genre_ids)))) if genre_ids else []


def authors_by_ids(db: Session, author_ids: Sequence[int]) -> list[Author]:
    return list(db.scalars(select(Author).where(Author.id.in_(author_ids)))) if author_ids else []


def books_with_details(db: Session, book_ids: Sequence[int]) -> list[Book]:
    if not book_ids:
        return []
    return list(
        db.scalars(
            select(Book)
            .options(joinedload(Book.author), selectinload(Book.genres), selectinload(Book.tags))
            .where(Book.id.in_(book_ids))
        ).unique()
    )


def top_genres(db: Session, limit: int) -> list[Genre]:
    books = func.count(book_genres.c.book_id)
    return list(
        db.scalars(
            select(Genre).join(book_genres, book_genres.c.genre_id == Genre.id).group_by(Genre.id).order_by(books.desc(), Genre.name).limit(limit)
        )
    )


def books_by_ids(db: Session, book_ids: Sequence[int]) -> list[Book]:
    if not book_ids:
        return []
    found = {book.id: book for book in db.scalars(_books().where(Book.id.in_(book_ids))).unique()}
    return [found[book_id] for book_id in book_ids if book_id in found]


def book_ids_by_tags(db: Session, tags: Collection[str], exclude_ids: Collection[int], limit: int) -> list[int]:
    if not tags:
        return []
    matches = func.count(BookTag.id)
    query = select(BookTag.book_id).where(BookTag.tag.in_(tags))
    if exclude_ids:
        query = query.where(BookTag.book_id.notin_(exclude_ids))
    return list(db.scalars(query.group_by(BookTag.book_id).order_by(matches.desc(), BookTag.book_id).limit(limit)))


def tag_matches(db: Session, book_ids: Collection[int], tags: Collection[str]) -> dict[int, int]:
    if not book_ids or not tags:
        return {}
    rows = db.execute(
        select(BookTag.book_id, func.count(BookTag.id))
        .where(BookTag.book_id.in_(book_ids), BookTag.tag.in_(tags))
        .group_by(BookTag.book_id)
    ).all()
    return {book_id: count for book_id, count in rows}


def book_genre_ids(db: Session, book_ids: Collection[int]) -> dict[int, set[int]]:
    result: dict[int, set[int]] = {}
    if not book_ids:
        return result
    for book_id, genre_id in db.execute(
        select(book_genres.c.book_id, book_genres.c.genre_id).where(book_genres.c.book_id.in_(book_ids))
    ):
        result.setdefault(book_id, set()).add(genre_id)
    return result


def top_books(
    db: Session,
    *,
    genre_ids: Collection[int] = (),
    exclude_ids: Collection[int] = (),
    min_rating: Decimal | None = None,
    is_series: bool | None = None,
    max_pages: int | None = None,
    limit: int,
) -> list[Book]:
    query = _books()
    if genre_ids:
        query = query.where(
            Book.id.in_(select(book_genres.c.book_id).where(book_genres.c.genre_id.in_(genre_ids)))
        )
    if exclude_ids:
        query = query.where(Book.id.notin_(exclude_ids))
    if min_rating is not None:
        query = query.where(Book.average_rating >= min_rating)
    if is_series is not None:
        query = query.where(Book.is_series.is_(is_series))
    if max_pages is not None:
        query = query.where(Book.pages <= max_pages)
    return list(
        db.scalars(query.order_by(Book.average_rating.desc().nulls_last(), Book.ratings_count.desc(), Book.id).limit(limit))
        .unique()
    )


def author_books(db: Session, author_id: int) -> list[Book]:
    return list(
        db.scalars(
            _books()
            .where(Book.author_id == author_id)
            .order_by(Book.average_rating.desc().nulls_last(), Book.id)
        ).unique()
    )


def author_average_rating(db: Session, author_id: int) -> Decimal | None:
    return db.scalar(select(func.avg(Book.average_rating)).where(Book.author_id == author_id))


def author_tags(db: Session, author_id: int) -> list[str]:
    return list(
        db.scalars(select(BookTag.tag).join(Book, Book.id == BookTag.book_id).where(Book.author_id == author_id).distinct())
    )


def genre_book_count(db: Session, genre_id: int) -> int:
    return db.scalar(select(func.count()).select_from(book_genres).where(book_genres.c.genre_id == genre_id)) or 0


def shelf_counts(db: Session, user_id: int) -> dict[str, int]:
    rows = db.execute(
        select(UserBookStatus.status, func.count()).where(UserBookStatus.user_id == user_id).group_by(UserBookStatus.status)
    ).all()
    return {status: count for status, count in rows}


def shelf_books(db: Session, user_id: int, status: str, limit: int) -> list[Book]:
    return list(
        db.scalars(
            _books()
            .join(UserBookStatus, UserBookStatus.book_id == Book.id)
            .where(UserBookStatus.user_id == user_id, UserBookStatus.status == status)
            .order_by(UserBookStatus.updated_at.desc(), Book.id)
            .limit(limit)
        ).unique()
    )
