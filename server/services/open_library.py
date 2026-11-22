import re
import time
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

import httpx

from server.core.config import settings
from server.core.errors import ErrorCode, ServiceUnavailableError
from server.core.message_keys import MessageKey
from server.database.models.edition import EditionFormat

USER_AGENT = "Lexaria/1.0 (book catalog import)"
AUTHORS_MAX = 3
SUBJECTS_MAX = 50
CACHE_TTL_SECONDS = 600
CACHE_MAX_ENTRIES = 128
COVER_CONTENT_TYPES = {"image/jpeg": ".jpg", "image/png": ".png"}

MARC_LANGUAGES: dict[str, tuple[str, tuple[str, ...]]] = {
    "eng": ("en", ("English",)),
    "rum": ("ro", ("Romanian",)),
    "ron": ("ro", ("Romanian",)),
    "fre": ("fr", ("French",)),
    "fra": ("fr", ("French",)),
    "ger": ("de", ("German",)),
    "deu": ("de", ("German",)),
    "ita": ("it", ("Italian",)),
    "spa": ("es", ("Spanish",)),
    "por": ("pt", ("Portuguese",)),
    "pol": ("pl", ("Polish",)),
    "rus": ("ru", ("Russian",)),
    "ukr": ("uk", ("Ukrainian",)),
    "chi": ("zh", ("Chinese", "Mandarin")),
    "zho": ("zh", ("Chinese", "Mandarin")),
    "jpn": ("ja", ("Japanese",)),
    "kor": ("ko", ("Korean",)),
    "dut": ("nl", ("Dutch",)),
    "nld": ("nl", ("Dutch",)),
    "hun": ("hu", ("Hungarian",)),
    "cze": ("cs", ("Czech",)),
    "ces": ("cs", ("Czech",)),
    "swe": ("sv", ("Swedish",)),
    "nor": ("no", ("Norwegian",)),
    "dan": ("da", ("Danish",)),
    "fin": ("fi", ("Finnish",)),
    "gre": ("el", ("Greek",)),
    "ell": ("el", ("Greek",)),
    "tur": ("tr", ("Turkish",)),
    "ara": ("ar", ("Arabic",)),
    "heb": ("he", ("Hebrew",)),
    "lat": ("la", ("Latin",)),
}

_FORMAT_WORDS: tuple[tuple[EditionFormat, str], ...] = (
    (EditionFormat.AUDIOBOOK, r"audio\w*|mp3|compact disc|cd"),
    (EditionFormat.EBOOK, r"e-?book|electronic|kindle|epub|digital"),
    (
        EditionFormat.HARDCOVER,
        r"hardcover|hardback|hard cover|library binding|cartonat\w*|copertina rigida|tapa dura|gebunden",
    ),
    (
        EditionFormat.PAPERBACK,
        r"paperback|softcover|soft cover|mass market|trade paper\w*|bro[sș]at\w*|brossura|taschenbuch|tapa blanda",
    ),
)
_FORMAT_PATTERNS = tuple((edition_format, re.compile(rf"\b(?:{words})\b")) for edition_format, words in _FORMAT_WORDS)
_DATE_FORMATS = ("%B %d, %Y", "%b %d, %Y", "%d %B %Y", "%d %b %Y", "%Y-%m-%d", "%Y/%m/%d", "%m/%d/%Y")
_YEAR = re.compile(r"(?<!\d)(1[0-9]{3}|20[0-9]{2})(?!\d)")
_KEY = re.compile(r"^/(works|authors)/OL\d+[WA]$")
_LINK_REFERENCE = re.compile(r"^\s*\[\d+\]:\s*\S+.*$", re.MULTILINE)
_INLINE_SOURCE = re.compile(r"\s*\(\[[^\]]*\]\[\d+\]\.?\)")
_DESCRIPTION_END = re.compile(r"^-{5,}\s*$", re.MULTILINE)


@dataclass(frozen=True)
class OpenLibraryBook:
    isbn: str
    title: str
    authors: tuple[str, ...]
    pages: int | None
    publisher: str | None
    published_at: date | None
    first_published_at: date | None
    language_code: str | None
    description: str | None
    subjects: tuple[str, ...]
    cover_id: int | None
    edition_format: EditionFormat | None


@dataclass(frozen=True)
class Cover:
    content: bytes
    extension: str


_cache: dict[str, tuple[float, OpenLibraryBook]] = {}


def _unavailable() -> ServiceUnavailableError:
    return ServiceUnavailableError(MessageKey.IMPORT_SOURCE_UNAVAILABLE, code=ErrorCode.CATALOG_SOURCE_UNAVAILABLE)


def _client(base_url: str) -> httpx.Client:
    return httpx.Client(
        base_url=base_url,
        timeout=settings.open_library_timeout_seconds,
        headers={"User-Agent": USER_AGENT},
        follow_redirects=True,
    )


def _get_json(client: httpx.Client, path: str) -> dict[str, Any] | None:
    try:
        response = client.get(path, headers={"Accept": "application/json"})
    except httpx.HTTPError as error:
        raise _unavailable() from error
    if response.status_code == httpx.codes.NOT_FOUND:
        return None
    if response.is_error:
        raise _unavailable()
    try:
        data = response.json()
    except ValueError as error:
        raise _unavailable() from error
    return data if isinstance(data, dict) else None


def _text(value: Any) -> str | None:
    if isinstance(value, dict):
        value = value.get("value")
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _first_text(values: Any) -> str | None:
    if isinstance(values, list):
        for value in values:
            if text := _text(value):
                return text
    return None


def _key(value: Any) -> str | None:
    if isinstance(value, dict):
        value = value.get("key")
    return value if isinstance(value, str) and _KEY.match(value) else None


def parse_date(value: Any) -> date | None:
    text = _text(value)
    if text is None:
        return None
    cleaned = re.sub(r"(\d)(st|nd|rd|th)\b", r"\1", text.replace(".", "")).strip()
    for pattern in _DATE_FORMATS:
        try:
            return datetime.strptime(cleaned, pattern).date()
        except ValueError:
            continue
    match = _YEAR.search(cleaned)
    return date(int(match.group(1)), 1, 1) if match else None


def parse_format(value: Any) -> EditionFormat | None:
    text = (_text(value) or "").lower()
    found = [
        (match.start(), edition_format)
        for edition_format, pattern in _FORMAT_PATTERNS
        if (match := pattern.search(text))
    ]
    return min(found)[1] if found else None


def clean_description(value: Any) -> str | None:
    text = _text(value)
    if text is None:
        return None
    text = text.replace("\r\n", "\n")
    end = _DESCRIPTION_END.search(text)
    if end:
        text = text[: end.start()]
    text = _INLINE_SOURCE.sub("", _LINK_REFERENCE.sub("", text))
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text or None


def _pages(value: Any) -> int | None:
    return value if isinstance(value, int) and not isinstance(value, bool) and value > 0 else None


def _cover_id(*sources: Any) -> int | None:
    for covers in sources:
        if isinstance(covers, list):
            for cover in covers:
                if isinstance(cover, int) and cover > 0:
                    return cover
    return None


def _language_code(edition: dict[str, Any]) -> str | None:
    for language in edition.get("languages") or []:
        key = language.get("key") if isinstance(language, dict) else None
        if isinstance(key, str) and key.startswith("/languages/"):
            return key.removeprefix("/languages/")
    return None


def _author_keys(edition: dict[str, Any], work: dict[str, Any]) -> list[str]:
    keys = [_key(author) for author in edition.get("authors") or []]
    if not any(keys):
        keys = [_key(author.get("author")) for author in work.get("authors") or [] if isinstance(author, dict)]
    unique = list(dict.fromkeys(key for key in keys if key))
    return unique[:AUTHORS_MAX]


def _author_names(client: httpx.Client, keys: list[str]) -> tuple[str, ...]:
    names = []
    for key in keys:
        author = _get_json(client, f"{key}.json") or {}
        if name := _text(author.get("name")) or _text(author.get("personal_name")):
            names.append(name)
    return tuple(names)


def _subjects(work: dict[str, Any]) -> tuple[str, ...]:
    subjects = [subject.strip() for subject in work.get("subjects") or [] if isinstance(subject, str)]
    return tuple(subject for subject in subjects if subject)[:SUBJECTS_MAX]


def _fetch(isbn: str) -> OpenLibraryBook | None:
    with _client(settings.open_library_url) as client:
        edition = _get_json(client, f"/isbn/{isbn}.json")
        if edition is None:
            return None
        works = edition.get("works") or []
        work_key = _key(works[0]) if works else None
        work = (_get_json(client, f"{work_key}.json") if work_key else None) or {}
        title = _text(work.get("title")) or _text(edition.get("title"))
        if title is None:
            return None
        return OpenLibraryBook(
            isbn=isbn,
            title=title,
            authors=_author_names(client, _author_keys(edition, work)),
            pages=_pages(edition.get("number_of_pages")),
            publisher=_first_text(edition.get("publishers")),
            published_at=parse_date(edition.get("publish_date")),
            first_published_at=parse_date(work.get("first_publish_date")),
            language_code=_language_code(edition),
            description=clean_description(work.get("description")) or clean_description(edition.get("description")),
            subjects=_subjects(work),
            cover_id=_cover_id(edition.get("covers"), work.get("covers")),
            edition_format=parse_format(edition.get("physical_format")),
        )


def lookup(isbn: str) -> OpenLibraryBook | None:
    now = time.monotonic()
    cached = _cache.get(isbn)
    if cached and now - cached[0] < CACHE_TTL_SECONDS:
        return cached[1]
    book = _fetch(isbn)
    if book is not None:
        if len(_cache) >= CACHE_MAX_ENTRIES:
            _cache.pop(min(_cache, key=lambda key: _cache[key][0]))
        _cache[isbn] = (now, book)
    return book


def fetch_cover(cover_id: int, max_bytes: int) -> Cover | None:
    try:
        with _client(settings.open_library_covers_url) as client:
            with client.stream("GET", f"/b/id/{cover_id}-L.jpg", params={"default": "false"}) as response:
                content_type = response.headers.get("content-type", "").split(";")[0].strip().lower()
                if response.is_error or content_type not in COVER_CONTENT_TYPES:
                    return None
                content = bytearray()
                for chunk in response.iter_bytes():
                    content.extend(chunk)
                    if len(content) > max_bytes:
                        return None
    except httpx.HTTPError:
        return None
    return Cover(bytes(content), COVER_CONTENT_TYPES[content_type]) if content else None
