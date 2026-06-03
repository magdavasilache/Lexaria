import re
import nltk
import numpy as np
import spacy
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from server.database.models.author import Author
from server.database.models.book import Book
from server.database.models.genres import Genre
from server.database.models.review import Review
from server.database.models.user_book_status import UserBookStatus
from server.ml.schemas import InferenceContext
from server.utils.tags_vocabulary import GENRE_KEYWORDS, LENGTH_KEYWORDS, MOOD_KEYWORDS
nlp = spacy.load("en_core_web_sm")
from nltk.stem.porter import PorterStemmer


try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")

try:
    nltk.data.find("tokenizers/punkt_tab")
except LookupError:
    nltk.download("punkt_tab")

stemmer = PorterStemmer()

def tokenize(sentence: str) -> list[str]:
    return nltk.word_tokenize(sentence)

def stem(word: str) -> str:
    return stemmer.stem(word.lower())

def bag_of_words(tokenized_sentence: list[str], words: list[str]) -> np.ndarray:
    sentence_words = [stem(word) for word in tokenized_sentence]

    return np.array([
        1 if word in sentence_words else 0
        for word in words
    ], dtype=np.float32)

def extract_modifiers(message: str) -> dict:
    text = message.lower()
    words = set(text.split())

    modifiers = {
        "moods": [m for m in MOOD_KEYWORDS if m in text],
        "genres": [g for g in GENRE_KEYWORDS if g in text],
        "length": next((l for l in LENGTH_KEYWORDS if l in text), None),
        "unread_only": any(w in text for w in ["haven't read", "not read", "new to me", "haven't tried", "never read"]),
        "series_only": any(w in text for w in ["series", "saga", "trilogy", "sequence"]),
        "standalone_only": any(w in text for w in ["standalone", "one book", "single book", "not a series"]),
        "highly_rated": any(w in text for w in ["best", "top rated", "highest rated", "acclaimed", "award", "award-winning"]),
    }

    similar_match = re.search(
        r"(?:like|similar to|after(?:\s+reading)?|if\s+i\s+(?:liked|loved|enjoyed))\s+['\"]?([A-Z][^,.?!]+?)['\"]?(?:\s|$|[,.?!])",
        message
    )
    if similar_match:
        modifiers["similar_to"] = similar_match.group(1).strip()

    return modifiers


def extract_entities(message: str) -> dict:
    doc = nlp(message)
    entities = {
        "titles": [ent.text for ent in doc.ents if ent.label_ == "WORK_OF_ART"],
        "people": [ent.text for ent in doc.ents if ent.label_ == "PERSON"],
        "proper_nouns": [token.text for token in doc if token.pos_ == "PROPN"],
    }
    return entities


MOOD_KEYWORDS = {
    "dark", "darker", "grim", "bleak", "hopeless", "brutal",
    "funny", "hilarious", "witty", "comedic",
    "uplifting", "hopeful", "heartwarming",
    "tense", "gripping", "suspenseful",
    "slow", "slow-burn", "dense",
    "fast", "fast-paced", "quick",
    "emotional", "sad", "bittersweet",
}

LENGTH_KEYWORDS = {
    "short", "quick", "fast read", "under 300",
    "long", "epic", "massive", "doorstop",
}

GENRE_KEYWORDS = {
    "fantasy", "sci-fi", "science fiction", "horror", "thriller",
    "mystery", "romance", "historical", "literary", "non-fiction",
    "dystopian", "gothic", "crime", "adventure",
}


def extract_modifiers(message: str) -> dict:
    text = message.lower()
    words = set(text.split())

    modifiers = {
        "moods": [m for m in MOOD_KEYWORDS if m in text],
        "genres": [g for g in GENRE_KEYWORDS if g in text],
        "length": next((l for l in LENGTH_KEYWORDS if l in text), None),
        "unread_only": any(w in text for w in ["haven't read", "not read", "new to me", "haven't tried"]),
        "series_only": any(w in text for w in ["series", "saga", "trilogy", "sequence"]),
        "standalone_only": any(w in text for w in ["standalone", "one book", "single book", "not a series"]),
        "highly_rated": any(w in text for w in ["best", "top rated", "highest rated", "acclaimed", "award"]),
    }

    # "like X", "similar to X", "after X", "if I liked X"
    similar_match = re.search(
        r"(?:like|similar to|after(?:\s+reading)?|if\s+i\s+(?:liked|loved|enjoyed))\s+['\"]?([A-Z][^,.?!]+?)['\"]?(?:\s|$|[,.?!])",
        message
    )
    if similar_match:
        modifiers["similar_to"] = similar_match.group(1).strip()

    return modifiers


def build_context(message: str, intent: str, confidence: float, user_id: int | None, conversation_id: int | None, db: Session) -> InferenceContext:
    ctx = InferenceContext(
        message=message,
        intent=intent,
        confidence=confidence,
        entities=extract_entities(message),
        modifiers=extract_modifiers(message),
    )

    all_names = (
        ctx.entities["titles"]
        + ctx.entities["people"]
        + ctx.entities["proper_nouns"]
    )

    for name in all_names:
        book = (
            db.query(Book)
            .filter(Book.title.ilike(f"%{name}%"))
            .first()
        )
        if book and book not in ctx.matched_books:
            ctx.matched_books.append(book)
        name_parts = name.split()
        if len(name_parts) > 1:
            first_name = name_parts[0]
            last_name = " ".join(name_parts[1:])
        author = (
            db.query(Author)
            .filter(
                or_(
                    Author.first_name.ilike(f"%{first_name}%"),
                    Author.last_name.ilike(f"%{last_name}%"),
                    Author.first_name.ilike(f"%{last_name}%"),
                    Author.last_name.ilike(f"%{first_name}%"),
                )
            )
            .first()
        )
        if author and author not in ctx.matched_authors:
            ctx.matched_authors.append(author)

    for genre_name in ctx.modifiers.get("genres", []):
        genre = (
            db.query(Genre)
            .filter(Genre.name.ilike(f"%{genre_name}%"))
            .first()
        )
        if genre and genre not in ctx.matched_genres:
            ctx.matched_genres.append(genre)

    if user_id:
        read_statuses = (
            db.query(UserBookStatus)
            .filter(
                UserBookStatus.user_id == user_id,
                UserBookStatus.status == "read",
            )
            .all()
        )
        ctx.user_read_book_ids = {s.book_id for s in read_statuses}

        avg = (
            db.query(func.avg(Review.rating))
            .filter(Review.user_id == user_id)
            .scalar()
        )
        ctx.user_avg_rating = float(avg or 0.0)

    if conversation_id:
        from server.ml.model import ChatbotMessage
        ctx.conversation_history = (
            db.query(ChatbotMessage)
            .filter(ChatbotMessage.conversation_id == conversation_id)
            .order_by(ChatbotMessage.created_at.desc())
            .limit(6)
            .all()
        )

    return ctx


