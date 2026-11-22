import re
from dataclasses import dataclass, field
from functools import cache

from server.utils.tags_vocabulary import GENRE_KEYWORDS, MOOD_KEYWORDS

ENTITY_MIN_LENGTH = 3
ENTITY_LABELS = {"WORK_OF_ART", "PERSON"}
SERIES_WORDS = ("series", "saga", "trilogy", "sequence")
STANDALONE_WORDS = ("standalone", "one book", "single book", "not a series")
HIGHLY_RATED_WORDS = ("best", "top rated", "highest rated", "acclaimed", "award", "award-winning")
ROMANIAN_MOODS = {
    "întunecat": "dark", "întunecată": "dark", "sumbru": "dark", "sumbră": "dark",
    "amuzant": "funny", "amuzantă": "funny", "haios": "funny", "haioasă": "funny",
    "trist": "sad", "tristă": "sad", "emoționant": "emotional", "emoționantă": "emotional",
    "tensionat": "tense", "tensionată": "tense", "palpitant": "gripping", "palpitantă": "gripping",
    "melancolic": "melancholic", "melancolică": "melancholic", "optimist": "hopeful", "optimistă": "hopeful",
    "liniștitor": "cozy", "liniștitoare": "cozy", "înfricoșător": "scary", "înfricoșătoare": "scary",
}
ROMANIAN_GENRES = {
    "polițist": "mystery", "polițiste": "mystery", "mister": "mystery", "crimă": "crime", "crime": "crime",
    "groază": "horror", "horror": "horror", "distopie": "dystopian", "distopii": "dystopian", "distopic": "dystopian",
    "clasic": "classic", "clasice": "classic", "istoric": "historical", "istorice": "historical",
    "fantastic": "fantasy", "fantasy": "fantasy", "științifico-fantastic": "sci-fi", "sf": "sci-fi",
    "dragoste": "romance", "romantic": "romance", "aventură": "adventure", "aventuri": "adventure",
    "grafic": "graphic novel", "non-ficțiune": "non-fiction", "nonficțiune": "non-fiction",
}
SIMILAR_TO = re.compile(
    r"(?:like|similar to|after(?:\s+reading)?|if\s+i\s+(?:liked|loved|enjoyed))\s+['\"]?([A-Z][^,.?!]+?)['\"]?(?:\s|$|[,.?!])"
)


@dataclass(frozen=True)
class Modifiers:
    moods: list[str] = field(default_factory=list)
    genres: list[str] = field(default_factory=list)
    series_only: bool = False
    standalone_only: bool = False
    highly_rated: bool = False
    similar_to: str | None = None


@cache
def _spacy():
    try:
        import spacy

        return spacy.load("en_core_web_sm")
    except (ImportError, OSError):
        return None


def entity_names(message: str) -> list[str]:
    pipeline = _spacy()
    if pipeline is None:
        return []
    doc = pipeline(message)
    names = [entity.text for entity in doc.ents if entity.label_ in ENTITY_LABELS]
    names += [token.text for token in doc if token.pos_ == "PROPN"]
    return list(dict.fromkeys(name.strip() for name in names if len(name.strip()) >= ENTITY_MIN_LENGTH))


def _mentions(text: str, phrase: str) -> bool:
    return re.search(rf"(?<![\w-]){re.escape(phrase)}(?![\w-])", text) is not None


def _found(text: str, phrases, translations: dict[str, str]) -> list[str]:
    found = {phrase for phrase in phrases if _mentions(text, phrase)}
    found |= {meaning for word, meaning in translations.items() if _mentions(text, word)}
    return sorted(found)


def extract_modifiers(message: str) -> Modifiers:
    text = message.lower()
    similar = SIMILAR_TO.search(message)
    return Modifiers(
        moods=_found(text, MOOD_KEYWORDS, ROMANIAN_MOODS),
        genres=_found(text, GENRE_KEYWORDS, ROMANIAN_GENRES),
        series_only=any(_mentions(text, word) for word in SERIES_WORDS),
        standalone_only=any(_mentions(text, word) for word in STANDALONE_WORDS),
        highly_rated=any(_mentions(text, word) for word in HIGHLY_RATED_WORDS),
        similar_to=similar.group(1).strip() if similar else None,
    )


def mask(message: str, replacements: dict[str, str]) -> str:
    masked = message
    for phrase in sorted(replacements, key=len, reverse=True):
        masked = re.sub(re.escape(phrase), replacements[phrase], masked, flags=re.IGNORECASE)
    return masked
