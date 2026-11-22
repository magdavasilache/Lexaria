import hashlib
import logging
import threading
from collections.abc import Sequence

import numpy as np
from sqlalchemy.orm import Session

from server.core.config import settings
from server.database.database import SessionLocal
from server.database.models.book import Book
from server.database.models.book_embedding import BookEmbedding
from server.ml import engine
from server.ml.errors import EngineUnavailable
from server.repositories import recommendation_repository

SYNOPSIS_LANGUAGE = "en"

logger = logging.getLogger(__name__)

Vectors = dict[int, np.ndarray]


def book_text(book: Book) -> str:
    synopses = {description.language: description.synopsis for description in book.descriptions}
    synopsis = synopses.get(SYNOPSIS_LANGUAGE) or next(iter(synopses.values()), None)
    genres = ", ".join(genre.name for genre in book.genres)
    author = book.author.full_name if book.author else None
    return ". ".join(part for part in (book.title, author, genres, synopsis) if part)


def _hash(model: str, text: str) -> str:
    return hashlib.sha256(f"{model}\n{text}".encode()).hexdigest()


def _encode(texts: list[str]) -> np.ndarray | None:
    try:
        return engine.encode(texts)
    except (EngineUnavailable, OSError) as error:
        logger.warning("Book embeddings are unavailable: %s", error)
        return None


def vectors(db: Session, books: Sequence[Book]) -> Vectors:
    model = settings.chatbot_model
    hashes = {book.id: _hash(model, book_text(book)) for book in books}
    stored = recommendation_repository.embeddings(db)
    stale = [book for book in books if (row := stored.get(book.id)) is None or row.text_hash != hashes[book.id]]
    if stale:
        encoded = _encode([book_text(book) for book in stale])
        if encoded is not None:
            rows = [
                BookEmbedding(
                    book_id=book.id,
                    model=model,
                    text_hash=hashes[book.id],
                    dimensions=int(vector.shape[0]),
                    vector=vector.astype(np.float32).tobytes(),
                )
                for book, vector in zip(stale, encoded)
            ]
            recommendation_repository.save_embeddings(db, rows)
            db.commit()
            stored.update({row.book_id: row for row in rows})
    return {
        book_id: np.frombuffer(row.vector, dtype=np.float32)
        for book_id, row in stored.items()
        if book_id in hashes and row.text_hash == hashes[book_id]
    }


def warm_up() -> None:
    with SessionLocal() as db:
        vectors(db, recommendation_repository.catalog(db))


def start_warm_up() -> None:
    threading.Thread(target=warm_up, name="book-embeddings-warm-up", daemon=True).start()
