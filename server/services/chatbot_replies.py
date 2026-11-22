from collections.abc import Callable
from dataclasses import dataclass, field
from decimal import Decimal

from sqlalchemy.orm import Session

from server.core.message_keys import MessageKey, MessageParam
from server.database.models.author import Author
from server.database.models.book import Book
from server.database.models.genres import Genre
from server.database.models.user import User
from server.database.models.user_book_status import ReadingStatus
from server.database.schemas.stats import ChallengeMetric, PaceStatus, StatsQuery
from server.ml.nlp import Modifiers
from server.repositories import chatbot_repository
from server.services import recommendation_service, stats_service

BOOKS_SHOWN = 3
CANDIDATES = 20
HIGH_RATING = Decimal("4.0")
TOP_RATING = Decimal("4.2")
SHORT_BOOK_PAGES = 300

TRAITS: dict[str, MessageKey] = {
    "dark": MessageKey.TRAIT_DARK,
    "slow-burn": MessageKey.TRAIT_SLOW_BURN,
    "found-family": MessageKey.TRAIT_FOUND_FAMILY,
    "fast-paced": MessageKey.TRAIT_FAST_PACED,
    "lyrical-prose": MessageKey.TRAIT_LYRICAL_PROSE,
    "morally-grey-protagonist": MessageKey.TRAIT_MORALLY_GREY,
    "hard-sci-fi": MessageKey.TRAIT_HARD_SCI_FI,
}


METRICS: dict[ChallengeMetric, MessageKey] = {
    ChallengeMetric.BOOKS: MessageKey.STATS_METRIC_BOOKS,
    ChallengeMetric.PAGES: MessageKey.STATS_METRIC_PAGES,
    ChallengeMetric.HOURS: MessageKey.STATS_METRIC_HOURS,
}

PACES: dict[PaceStatus, MessageKey] = {
    PaceStatus.AHEAD: MessageKey.STATS_PACE_AHEAD,
    PaceStatus.ON_TRACK: MessageKey.STATS_PACE_ON_TRACK,
    PaceStatus.BEHIND: MessageKey.STATS_PACE_BEHIND,
    PaceStatus.COMPLETED: MessageKey.STATS_PACE_COMPLETED,
    PaceStatus.MISSED: MessageKey.STATS_PACE_MISSED,
}

Line = recommendation_service.ReasonLine


@dataclass
class ChatContext:
    user: User
    modifiers: Modifiers
    tz: str = "UTC"
    books: list[Book] = field(default_factory=list)
    authors: list[Author] = field(default_factory=list)
    genres: list[Genre] = field(default_factory=list)
    excluded_ids: set[int] = field(default_factory=set)


@dataclass
class Reply:
    lines: list[Line]
    books: list[Book] = field(default_factory=list)
    reasons: dict[int, Line] = field(default_factory=dict)


def _say(key: MessageKey, books: list[Book] | None = None, **params: MessageParam) -> Reply:
    return Reply([(key, params)], list(books or []))


def _joined(words: list[str]) -> str:
    return ", ".join(words)


def _rating(value: Decimal | float) -> float:
    return round(float(value), 1)


def _unread(books: list[Book], ctx: ChatContext) -> list[Book]:
    return [book for book in books if book.id not in ctx.excluded_ids]


def _by_tags(db: Session, tags: list[str], exclude: set[int]) -> list[Book]:
    return chatbot_repository.books_by_ids(db, chatbot_repository.book_ids_by_tags(db, tags, exclude, CANDIDATES))


def _sort_by_mood(db: Session, books: list[Book], moods: list[str]) -> list[Book]:
    if not moods or not books:
        return books
    scores = chatbot_repository.tag_matches(db, [book.id for book in books], moods)
    return sorted(books, key=lambda book: scores.get(book.id, 0), reverse=True)


def recommend_similar(ctx: ChatContext, db: Session) -> Reply:
    base = next(iter(ctx.books), None)
    if base is None and ctx.modifiers.similar_to:
        base = chatbot_repository.find_book_by_title(db, ctx.modifiers.similar_to)
    if base is None:
        return _say(MessageKey.REPLY_SIMILAR_ASK)

    candidates = recommendation_service.similar_books(db, base.id, CANDIDATES, ctx.excluded_ids)
    candidates = _sort_by_mood(db, candidates, ctx.modifiers.moods)

    if not candidates:
        key = MessageKey.REPLY_SIMILAR_NONE_UNREAD if ctx.excluded_ids else MessageKey.REPLY_SIMILAR_NONE
        return _say(key, title=base.title)
    if ctx.modifiers.moods:
        return _say(MessageKey.REPLY_SIMILAR_FOUND_MOOD, candidates, title=base.title, moods=_joined(ctx.modifiers.moods))
    return _say(MessageKey.REPLY_SIMILAR_FOUND, candidates, title=base.title)


def recommend_by_genre(ctx: ChatContext, db: Session) -> Reply:
    genre = next(iter(ctx.genres), None)
    if genre is None:
        asked = next(iter(ctx.modifiers.genres), None)
        if asked is None:
            return _say(MessageKey.REPLY_GENRE_ASK)
        return _say(MessageKey.REPLY_GENRE_MISSING, genre=asked)

    modifiers = ctx.modifiers
    series = True if modifiers.series_only else False if modifiers.standalone_only else None
    books = chatbot_repository.top_books(
        db,
        genre_ids=[genre.id],
        exclude_ids=ctx.excluded_ids,
        min_rating=HIGH_RATING if modifiers.highly_rated else None,
        is_series=series,
        limit=CANDIDATES,
    )
    books = _sort_by_mood(db, books, modifiers.moods)

    if not books:
        return _say(MessageKey.REPLY_GENRE_NONE, genre=genre.name)
    if modifiers.moods:
        return _say(MessageKey.REPLY_GENRE_FOUND_MOOD, books, genre=genre.name, moods=_joined(modifiers.moods))
    return _say(MessageKey.REPLY_GENRE_FOUND, books, genre=genre.name)


def recommend_by_mood(ctx: ChatContext, db: Session) -> Reply:
    moods = ctx.modifiers.moods
    if not moods:
        return _say(MessageKey.REPLY_MOOD_ASK)

    books = _by_tags(db, moods, ctx.excluded_ids)
    if ctx.genres and books:
        wanted = {genre.id for genre in ctx.genres}
        genres_of = chatbot_repository.book_genre_ids(db, [book.id for book in books])
        in_genre = [book for book in books if genres_of.get(book.id, set()) & wanted]
        books = in_genre or books

    if not books:
        return _say(MessageKey.REPLY_MOOD_NONE, moods=_joined(moods))
    return _say(MessageKey.REPLY_MOOD_FOUND, books, moods=_joined(moods))


def author_info(ctx: ChatContext, db: Session) -> Reply:
    author = next(iter(ctx.authors), None) or next((book.author for book in ctx.books if book.author), None)
    if author is None:
        return _say(MessageKey.REPLY_AUTHOR_ASK)

    books = chatbot_repository.author_books(db, author.id)
    if not books:
        return _say(MessageKey.REPLY_AUTHOR_NO_BOOKS, name=author.full_name)
    reply = _say(MessageKey.REPLY_AUTHOR_BOOKS, books, name=author.full_name)
    average = chatbot_repository.author_average_rating(db, author.id)
    if average:
        reply.lines.append((MessageKey.REPLY_AUTHOR_RATING, {"rating": _rating(average)}))
    return reply


def book_info(ctx: ChatContext, db: Session) -> Reply:
    book = next(iter(ctx.books), None)
    if book is None:
        return _say(MessageKey.REPLY_BOOK_ASK)

    if book.author is not None:
        reply = _say(MessageKey.REPLY_BOOK_INFO, [book], title=book.title, author=book.author.full_name)
    else:
        reply = _say(MessageKey.REPLY_BOOK_INFO_NO_AUTHOR, [book], title=book.title)
    if book.genres:
        reply.lines.append((MessageKey.REPLY_BOOK_GENRES, {"genres": _joined([genre.name for genre in book.genres])}))
    if book.average_rating:
        reply.lines.append((MessageKey.REPLY_BOOK_RATING, {"rating": _rating(book.average_rating)}))
    tags = {tag.tag for tag in book.tags}
    traits = [key.value for tag, key in TRAITS.items() if tag in tags][:BOOKS_SHOWN]
    if traits:
        reply.lines.append((MessageKey.REPLY_BOOK_TRAITS, {"traits": traits}))
    return reply


def book_search(ctx: ChatContext, db: Session) -> Reply:
    if ctx.books:
        return book_info(ctx, db)
    if ctx.authors:
        return author_info(ctx, db)
    if ctx.genres or ctx.modifiers.moods:
        return recommend_by_genre(ctx, db)
    return _say(MessageKey.REPLY_SEARCH_ASK)


def filter_unread(ctx: ChatContext, db: Session) -> Reply:
    if not ctx.excluded_ids:
        return _say(MessageKey.REPLY_UNREAD_NO_HISTORY)
    books = chatbot_repository.top_books(db, exclude_ids=ctx.excluded_ids, limit=CANDIDATES)
    if not books:
        return _say(MessageKey.REPLY_UNREAD_NONE)
    return _say(MessageKey.REPLY_UNREAD_FOUND, books)


def filter_by_rating(ctx: ChatContext, db: Session) -> Reply:
    books = chatbot_repository.top_books(
        db,
        genre_ids=[genre.id for genre in ctx.genres],
        exclude_ids=ctx.excluded_ids,
        min_rating=TOP_RATING,
        limit=CANDIDATES,
    )
    if not books:
        return _say(MessageKey.REPLY_TOP_RATED_NONE)
    if ctx.genres:
        return _say(MessageKey.REPLY_TOP_RATED_GENRE_FOUND, books, genre=ctx.genres[0].name)
    return _say(MessageKey.REPLY_TOP_RATED_FOUND, books)


def recommend_by_author(ctx: ChatContext, db: Session) -> Reply:
    author = next(iter(ctx.authors), None)
    if author is None:
        return _say(MessageKey.REPLY_BY_AUTHOR_ASK)

    own = chatbot_repository.author_books(db, author.id)
    unread = _unread(own, ctx)
    if unread:
        return _say(MessageKey.REPLY_BY_AUTHOR_UNREAD, unread, name=author.full_name)

    exclude = {book.id for book in own} | ctx.excluded_ids
    similar = _by_tags(db, chatbot_repository.author_tags(db, author.id), exclude)
    if not similar:
        return _say(MessageKey.REPLY_BY_AUTHOR_NONE, name=author.full_name)
    return _say(MessageKey.REPLY_BY_AUTHOR_SIMILAR, similar, name=author.full_name)


def _for_you(ctx: ChatContext, db: Session) -> Reply | None:
    if recommendation_service.load_taste(db, ctx.user).empty:
        return None
    picks = recommendation_service.picks_for(db, ctx.user, CANDIDATES, ctx.excluded_ids)
    if not picks:
        return _say(MessageKey.REPLY_TASTE_NONE)
    reasons = {pick.book.id: pick.reason for pick in picks}
    return Reply([(MessageKey.REPLY_TASTE_FOUND, {})], [pick.book for pick in picks], reasons)


def recommend_for_you(ctx: ChatContext, db: Session) -> Reply:
    return _for_you(ctx, db) or _say(MessageKey.REPLY_TASTE_EMPTY)


def recommend_book(ctx: ChatContext, db: Session) -> Reply:
    if ctx.books or ctx.modifiers.similar_to:
        return recommend_similar(ctx, db)
    if ctx.genres or ctx.modifiers.genres:
        return recommend_by_genre(ctx, db)
    if ctx.modifiers.moods:
        return recommend_by_mood(ctx, db)
    if ctx.authors:
        return recommend_by_author(ctx, db)
    general = filter_by_rating(ctx, db) if not ctx.excluded_ids else filter_unread(ctx, db)
    personal = _for_you(ctx, db)
    if personal is None or not personal.books:
        return general
    picked = {book.id for book in personal.books}
    personal.books += [book for book in general.books if book.id not in picked]
    return personal


def recommend_short(ctx: ChatContext, db: Session) -> Reply:
    books = chatbot_repository.top_books(
        db,
        genre_ids=[genre.id for genre in ctx.genres],
        exclude_ids=ctx.excluded_ids,
        max_pages=SHORT_BOOK_PAGES,
        limit=CANDIDATES,
    )
    books = _sort_by_mood(db, books, ctx.modifiers.moods)
    if not books:
        return _say(MessageKey.REPLY_SHORT_NONE, pages=SHORT_BOOK_PAGES)
    return _say(MessageKey.REPLY_SHORT_FOUND, books, pages=SHORT_BOOK_PAGES)


def recommend_series(ctx: ChatContext, db: Session) -> Reply:
    books = chatbot_repository.top_books(
        db, genre_ids=[genre.id for genre in ctx.genres], exclude_ids=ctx.excluded_ids, is_series=True, limit=CANDIDATES
    )
    if not books:
        return _say(MessageKey.REPLY_SERIES_NONE)
    if ctx.genres:
        return _say(MessageKey.REPLY_SERIES_GENRE_FOUND, books, genre=ctx.genres[0].name)
    return _say(MessageKey.REPLY_SERIES_FOUND, books)


def book_length(ctx: ChatContext, db: Session) -> Reply:
    book = next(iter(ctx.books), None)
    if book is None:
        return _say(MessageKey.REPLY_LENGTH_ASK)
    if not book.pages:
        return _say(MessageKey.REPLY_LENGTH_UNKNOWN, [book], title=book.title)
    return _say(MessageKey.REPLY_LENGTH, [book], title=book.title, pages=book.pages)


def genre_info(ctx: ChatContext, db: Session) -> Reply:
    genre = next(iter(ctx.genres), None)
    if genre is None:
        return recommend_by_genre(ctx, db)
    count = chatbot_repository.genre_book_count(db, genre.id)
    if count == 0:
        return _say(MessageKey.REPLY_GENRE_INFO_EMPTY, genre=genre.name)
    books = chatbot_repository.top_books(db, genre_ids=[genre.id], limit=CANDIDATES)
    return _say(MessageKey.REPLY_GENRE_INFO, books, genre=genre.name, count=count)


def my_shelves(ctx: ChatContext, db: Session) -> Reply:
    counts = chatbot_repository.shelf_counts(db, ctx.user.id)
    if not counts:
        return _say(MessageKey.REPLY_SHELVES_EMPTY)
    reply = _say(
        MessageKey.REPLY_SHELVES,
        read=counts.get(ReadingStatus.READ, 0),
        reading=counts.get(ReadingStatus.CURRENTLY_READING, 0),
        want=counts.get(ReadingStatus.WANT_TO_READ, 0),
    )
    for status, key in (
        (ReadingStatus.CURRENTLY_READING, MessageKey.REPLY_SHELVES_READING),
        (ReadingStatus.WANT_TO_READ, MessageKey.REPLY_SHELVES_NEXT),
    ):
        books = chatbot_repository.shelf_books(db, ctx.user.id, status, BOOKS_SHOWN)
        if books:
            reply.lines.append((key, {}))
            reply.books = books
            break
    return reply


def my_stats(ctx: ChatContext, db: Session) -> Reply:
    stats = stats_service.get_stats(db, StatsQuery(tz=ctx.tz), ctx.user)
    totals = stats.totals
    if totals.books == 0 and totals.pages == 0 and stats.streak.current == 0 and stats.challenge is None:
        return _say(MessageKey.REPLY_STATS_EMPTY, year=stats.year, total=stats.all_time_books)

    reply = _say(MessageKey.REPLY_STATS_YEAR, year=stats.year, finished=totals.books, pages=totals.pages)
    if stats.challenge is None:
        reply.lines.append((MessageKey.REPLY_STATS_NO_CHALLENGE, {"year": stats.year}))
    else:
        for target in stats.challenge.targets:
            value = int(target.value) if target.metric != ChallengeMetric.HOURS else round(target.value, 1)
            reply.lines.append(
                (
                    MessageKey.REPLY_STATS_CHALLENGE,
                    {
                        "metric": [METRICS[target.metric].value],
                        "value": value,
                        "target": target.target,
                        "status": [PACES[target.status].value],
                    },
                )
            )
    if stats.streak.current:
        reply.lines.append((MessageKey.REPLY_STATS_STREAK, {"days": stats.streak.current}))
    if stats.genres:
        reply.lines.append((MessageKey.REPLY_STATS_GENRE, {"genre": stats.genres[0].name}))
    return reply


HANDLERS: dict[str, Callable[[ChatContext, Session], Reply]] = {
    "recommend_for_you": recommend_for_you,
    "my_stats": my_stats,
    "recommend_similar": recommend_similar,
    "recommend_by_genre": recommend_by_genre,
    "recommend_by_mood": recommend_by_mood,
    "recommend_by_author": recommend_by_author,
    "recommend_book": recommend_book,
    "recommend_short": recommend_short,
    "recommend_series": recommend_series,
    "book_length": book_length,
    "genre_info": genre_info,
    "my_shelves": my_shelves,
    "filter_by_rating": filter_by_rating,
    "filter_unread": filter_unread,
    "book_search": book_search,
    "book_info": book_info,
    "author_info": author_info,
}


RECOMMENDERS = frozenset(
    {
        "recommend_book",
        "recommend_for_you",
        "recommend_by_genre",
        "recommend_by_mood",
        "recommend_by_author",
        "recommend_similar",
        "recommend_short",
        "recommend_series",
        "filter_unread",
        "filter_by_rating",
        "genre_info",
    }
)
FOLLOW_UPS = frozenset({"more_results", "refine_shorter", "affirm"})
