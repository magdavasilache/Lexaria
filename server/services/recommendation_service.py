from collections import Counter
from collections.abc import Collection
from dataclasses import dataclass, field
from decimal import Decimal

import numpy as np
from sqlalchemy.orm import Session

from server.core.message_keys import MessageKey, MessageParam
from server.database.models.book import RATING_MAX, Book
from server.database.models.reader_signal import SignalKind
from server.database.models.user import User
from server.database.schemas.book import BookListItem
from server.database.schemas.recommendation import RecommendationOut, RecommendationReason
from server.repositories import recommendation_repository
from server.services import book_embeddings
from server.services.book_service import list_item, require_book

EMBEDDING_WEIGHT = 0.5
GENRE_WEIGHT = 0.2
MOOD_WEIGHT = 0.2
AUTHOR_WEIGHT = 0.1
PACE_WEIGHT = 0.05
RATING_WEIGHT = 0.05
SIMILAR_MIN_SCORE = 0.2
TASTE_MIN_SCORE = 0.15
REASON_MIN_SIMILARITY = 0.2
LIKED_RATING = Decimal("4")
LIKED_BASELINE = 3.0
UNRATED_READ_WEIGHT = 0.5
POPULAR_PRIOR_VOTES = 5
POPULAR_PRIOR_RATING = 3.5

ReasonLine = tuple[MessageKey, dict[str, MessageParam]]


@dataclass(frozen=True)
class Profile:
    book: Book
    vector: np.ndarray | None
    genres: frozenset[int]
    moods: dict[str, float]


@dataclass(frozen=True)
class TasteProfile:
    vector: np.ndarray | None
    genres: dict[int, float]
    moods: dict[str, float]
    authors: frozenset[int]


@dataclass
class Taste:
    liked: dict[int, float] = field(default_factory=dict)
    favourite_genres: set[int] = field(default_factory=set)

    @property
    def empty(self) -> bool:
        return not (self.liked or self.favourite_genres)


@dataclass(frozen=True)
class Pick:
    book: Book
    score: float
    reason: ReasonLine


def _mood_shares(book: Book) -> dict[str, float]:
    if not book.mood_voters:
        return {}
    return {signal.value: signal.votes / book.mood_voters for signal in book.signals if signal.kind == SignalKind.MOOD}


def _profiles(db: Session) -> dict[int, Profile]:
    books = recommendation_repository.catalog(db)
    vectors = book_embeddings.vectors(db, books)
    return {
        book.id: Profile(
            book=book,
            vector=vectors.get(book.id),
            genres=frozenset(genre.id for genre in book.genres),
            moods=_mood_shares(book),
        )
        for book in books
    }


def _cosine(first: dict, second: dict) -> float:
    shared = first.keys() & second.keys()
    if not shared:
        return 0.0
    dot = sum(first[key] * second[key] for key in shared)
    norm = (sum(value * value for value in first.values()) * sum(value * value for value in second.values())) ** 0.5
    return dot / norm if norm else 0.0


def _vector_similarity(first: np.ndarray | None, second: np.ndarray | None) -> float:
    if first is None or second is None:
        return 0.0
    return max(float(first @ second), 0.0)


def _jaccard(first: frozenset[int], second: frozenset[int]) -> float:
    union = first | second
    return len(first & second) / len(union) if union else 0.0


def rating_prior(book: Book) -> float:
    average = float(book.average_rating or 0)
    votes = book.ratings_count
    return (average * votes + POPULAR_PRIOR_RATING * POPULAR_PRIOR_VOTES) / (votes + POPULAR_PRIOR_VOTES) / RATING_MAX


def similarity(first: Profile, second: Profile) -> float:
    score = EMBEDDING_WEIGHT * _vector_similarity(first.vector, second.vector)
    score += GENRE_WEIGHT * _jaccard(first.genres, second.genres)
    score += MOOD_WEIGHT * _cosine(first.moods, second.moods)
    if first.book.author_id is not None and first.book.author_id == second.book.author_id:
        score += AUTHOR_WEIGHT
    if first.book.pace is not None and first.book.pace == second.book.pace:
        score += PACE_WEIGHT
    return score


def similar_books(db: Session, book_id: int, limit: int, exclude_ids: Collection[int] = ()) -> list[Book]:
    require_book(db, book_id)
    profiles = _profiles(db)
    base = profiles[book_id]
    scored = [
        (profile, similarity(base, profile))
        for profile in profiles.values()
        if profile.book.id != book_id and profile.book.id not in exclude_ids
    ]
    ranked = sorted(
        (item for item in scored if item[1] >= SIMILAR_MIN_SCORE),
        key=lambda item: (-item[1], -rating_prior(item[0].book), item[0].book.id),
    )
    return [profile.book for profile, _ in ranked[:limit]]


def load_taste(db: Session, user: User) -> Taste:
    ratings = recommendation_repository.ratings(db, user.id)
    liked = {book_id: float(rating) - LIKED_BASELINE for book_id, rating in ratings.items() if rating >= LIKED_RATING}
    for book_id in recommendation_repository.finished_book_ids(db, user.id):
        if book_id not in ratings:
            liked[book_id] = UNRATED_READ_WEIGHT
    return Taste(liked=liked, favourite_genres=recommendation_repository.favourite_genre_ids(db, user.id))


def _taste_vector(liked: list[tuple[Profile, float]]) -> np.ndarray | None:
    weighted = [weight * profile.vector for profile, weight in liked if profile.vector is not None]
    if not weighted:
        return None
    summed = np.sum(weighted, axis=0)
    norm = float(np.linalg.norm(summed))
    return summed / norm if norm else None


def _taste_profile(taste: Taste, liked: list[tuple[Profile, float]], own_moods: dict[int, set[str]]) -> TasteProfile:
    genres: Counter[int] = Counter()
    moods: Counter[str] = Counter()
    for profile, weight in liked:
        genres.update({genre_id: weight for genre_id in profile.genres})
        mine = own_moods.get(profile.book.id)
        moods.update({mood: weight for mood in mine} if mine else {mood: weight * share for mood, share in profile.moods.items()})
    strongest = max(genres.values(), default=1.0)
    genres.update({genre_id: strongest for genre_id in taste.favourite_genres})
    return TasteProfile(
        vector=_taste_vector(liked),
        genres=dict(genres),
        moods=dict(moods),
        authors=frozenset(profile.book.author_id for profile, _ in liked if profile.book.author_id is not None),
    )


def _genre_affinity(weights: dict[int, float], genres: frozenset[int]) -> float:
    top = max(weights.values(), default=0.0)
    if not top or not genres:
        return 0.0
    return max(weights.get(genre_id, 0.0) for genre_id in genres) / top


def _taste_score(target: TasteProfile, profile: Profile) -> float:
    score = EMBEDDING_WEIGHT * _vector_similarity(target.vector, profile.vector)
    score += GENRE_WEIGHT * _genre_affinity(target.genres, profile.genres)
    score += MOOD_WEIGHT * _cosine(target.moods, profile.moods)
    score += AUTHOR_WEIGHT * (profile.book.author_id in target.authors)
    return score + RATING_WEIGHT * rating_prior(profile.book)


def _reason(candidate: Profile, liked: list[Profile], favourite_genres: set[int]) -> ReasonLine:
    scored = [(profile, similarity(profile, candidate)) for profile in liked]
    closest = max(scored, key=lambda item: item[1], default=None)
    if closest is not None and closest[1] >= REASON_MIN_SIMILARITY:
        return MessageKey.RECOMMEND_BECAUSE_LIKED, {"title": closest[0].book.title}
    author = candidate.book.author
    if author is not None and any(profile.book.author_id == author.id for profile in liked):
        return MessageKey.RECOMMEND_SAME_AUTHOR, {"name": author.full_name}
    favourites = sorted(genre.name for genre in candidate.book.genres if genre.id in favourite_genres)
    if favourites:
        return MessageKey.RECOMMEND_FAVOURITE_GENRE, {"genre": favourites[0]}
    return MessageKey.RECOMMEND_TASTE, {}


def _popular(profiles: dict[int, Profile], exclude: set[int], limit: int) -> list[Pick]:
    rated = [profile.book for profile in profiles.values() if profile.book.ratings_count and profile.book.id not in exclude]
    rated.sort(key=lambda book: (-rating_prior(book), book.id))
    return [Pick(book, rating_prior(book), (MessageKey.RECOMMEND_POPULAR, {})) for book in rated[:limit]]


def picks_for(db: Session, user: User, limit: int, exclude_ids: Collection[int] = ()) -> list[Pick]:
    profiles = _profiles(db)
    taste = load_taste(db, user)
    exclude = recommendation_repository.seen_book_ids(db, user.id) | set(taste.liked) | set(exclude_ids)
    if taste.empty:
        return _popular(profiles, exclude, limit)
    liked = [(profiles[book_id], weight) for book_id, weight in taste.liked.items() if book_id in profiles]
    target = _taste_profile(taste, liked, recommendation_repository.mood_votes(db, user.id))
    scored = [
        (profile, score)
        for profile in profiles.values()
        if profile.book.id not in exclude and (score := _taste_score(target, profile)) >= TASTE_MIN_SCORE
    ]
    scored.sort(key=lambda item: (-item[1], item[0].book.id))
    liked_profiles = [profile for profile, _ in liked]
    return [
        Pick(profile.book, score, _reason(profile, liked_profiles, taste.favourite_genres))
        for profile, score in scored[:limit]
    ]


def recommendations(db: Session, user: User, limit: int) -> list[RecommendationOut]:
    return [
        RecommendationOut(
            book=list_item(pick.book), reason=RecommendationReason(key=pick.reason[0].value, params=pick.reason[1])
        )
        for pick in picks_for(db, user, limit)
    ]


def similar(db: Session, book_id: int, limit: int) -> list[BookListItem]:
    return [list_item(book) for book in similar_books(db, book_id, limit)]
