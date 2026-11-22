import math
import os
import threading
from collections import Counter
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from functools import cache
from importlib.util import find_spec
from pathlib import Path

from server.core.config import settings
from server.ml.errors import EngineUnavailable, ModelNotTrained

INDEX_PATH = Path(__file__).resolve().parent / "index.npz"
NEIGHBOURS = 5
VOTE_TEMPERATURE = 0.05
FOLDS = 5
BATCH_SIZE = 32
CONFUSED_PAIRS_SHOWN = 5
RANKED_INTENTS = 3

_training_lock = threading.Lock()
_index_lock = threading.Lock()
_embedder_lock = threading.Lock()
_cached: tuple[float, "_Index"] | None = None


@dataclass(frozen=True)
class Prediction:
    tag: str
    confidence: float
    margin: float


@dataclass(frozen=True)
class IndexProgress:
    stage: str
    done: int
    total: int


@dataclass(frozen=True)
class ConfusedPair:
    expected: str
    predicted: str
    count: int


@dataclass(frozen=True)
class IndexResult:
    model: str
    samples: int
    intents: int
    accuracy: float
    confused_pairs: list[ConfusedPair]


@dataclass(frozen=True)
class Ranking:
    prediction: Prediction
    scores: list[tuple[str, float]]


@dataclass(frozen=True)
class Overlap:
    index: int
    other_text: str
    other_tag: str
    similarity: float


@dataclass(frozen=True)
class _Index:
    vectors: object
    tags: list[str]
    texts: list[str]


def ensure_available() -> None:
    if find_spec("sentence_transformers") is None or find_spec("numpy") is None:
        raise EngineUnavailable


@cache
def _embedder():
    ensure_available()
    from sentence_transformers import SentenceTransformer

    with _embedder_lock:
        return SentenceTransformer(settings.chatbot_model, device="cpu")


def _normalized(text: str) -> str:
    return " ".join(text.lower().split())


def encode(texts: Sequence[str], on_batch: Callable[[int], None] | None = None):
    import numpy as np

    embedder = _embedder()
    batches = []
    for start in range(0, len(texts), BATCH_SIZE):
        batch = [_normalized(text) for text in texts[start : start + BATCH_SIZE]]
        batches.append(embedder.encode(batch, normalize_embeddings=True, convert_to_numpy=True).astype(np.float32))
        if on_batch is not None:
            on_batch(start + len(batch))
    return np.vstack(batches) if batches else np.zeros((0, 0), dtype=np.float32)


def _unit(value: float) -> float:
    return min(max(value, 0.0), 1.0)


def _classify(vectors, tags: Sequence[str], query) -> Prediction:
    import numpy as np

    similarities = vectors @ query
    order = np.argsort(-similarities)
    nearest = order[:NEIGHBOURS]
    top = float(similarities[nearest[0]])
    votes: Counter[str] = Counter()
    best: dict[str, float] = {}
    for index in nearest:
        tag = tags[index]
        score = _unit(float(similarities[index]))
        votes[tag] += math.exp((float(similarities[index]) - top) / VOTE_TEMPERATURE)
        best[tag] = max(best.get(tag, -1.0), score)
    winner = votes.most_common(1)[0][0]
    runner_up = next((_unit(float(similarities[index])) for index in order if tags[index] != winner), 0.0)
    return Prediction(winner, best[winner], best[winner] - runner_up)


def _load() -> _Index:
    global _cached
    import numpy as np

    try:
        modified = INDEX_PATH.stat().st_mtime
    except FileNotFoundError as error:
        raise ModelNotTrained from error
    with _index_lock:
        if _cached is None or _cached[0] != modified:
            with np.load(INDEX_PATH) as data:
                if "texts" not in data:
                    raise ModelNotTrained
                _cached = (
                    modified,
                    _Index(data["vectors"], [str(tag) for tag in data["tags"]], [str(text) for text in data["texts"]]),
                )
        return _cached[1]


def predict(message: str) -> Prediction:
    ensure_available()
    index = _load()
    return _classify(index.vectors, index.tags, encode([message])[0])


def rank(message: str) -> Ranking:
    ensure_available()
    index = _load()
    query = encode([message])[0]
    similarities = index.vectors @ query
    best: dict[str, float] = {}
    for tag, similarity in zip(index.tags, similarities):
        best[tag] = max(best.get(tag, 0.0), _unit(float(similarity)))
    scores = sorted(best.items(), key=lambda item: -item[1])[:RANKED_INTENTS]
    return Ranking(_classify(index.vectors, index.tags, query), scores)


def overlaps(texts: Sequence[str], tag: str, threshold: float) -> list[Overlap]:
    import numpy as np

    ensure_available()
    index = _load()
    others = np.array([other != tag for other in index.tags])
    if not texts or not others.any():
        return []
    other_ids = np.where(others)[0]
    similarities = encode(texts) @ index.vectors[other_ids].T
    found = []
    for row, column in zip(*np.where(similarities >= threshold)):
        target = other_ids[column]
        found.append(Overlap(int(row), index.texts[target], index.tags[target], _unit(float(similarities[row, column]))))
    return sorted(found, key=lambda overlap: -overlap.similarity)


def reserve_training() -> bool:
    return _training_lock.acquire(blocking=False)


def release_training() -> None:
    _training_lock.release()


def _folds(tags: Sequence[str]) -> list[int]:
    seen: Counter[str] = Counter()
    fold_of = []
    for tag in tags:
        fold_of.append(seen[tag] % FOLDS)
        seen[tag] += 1
    return fold_of


def _evaluate(vectors, tags: Sequence[str], on_progress: Callable[[IndexProgress], None]) -> tuple[float, list[ConfusedPair]]:
    import numpy as np

    fold_of = np.array(_folds(tags))
    labels = np.array(tags)
    correct = 0
    confused: Counter[tuple[str, str]] = Counter()
    for fold in range(FOLDS):
        held_out = np.where(fold_of == fold)[0]
        kept = np.where(fold_of != fold)[0]
        kept_tags = list(labels[kept])
        for index in held_out:
            predicted = _classify(vectors[kept], kept_tags, vectors[index]).tag
            if predicted == tags[index]:
                correct += 1
            else:
                confused[(tags[index], predicted)] += 1
        on_progress(IndexProgress("evaluate", fold + 1, FOLDS))
    pairs = [ConfusedPair(expected, predicted, count) for (expected, predicted), count in confused.most_common(CONFUSED_PAIRS_SHOWN)]
    return correct / len(tags), pairs


def build_index(samples: Sequence[tuple[str, str]], on_progress: Callable[[IndexProgress], None]) -> IndexResult:
    import numpy as np

    texts = [pattern for pattern, _ in samples]
    tags = [tag for _, tag in samples]
    vectors = encode(texts, lambda done: on_progress(IndexProgress("encode", done, len(texts))))
    accuracy, pairs = _evaluate(vectors, tags, on_progress)

    temporary = INDEX_PATH.with_name("index.tmp.npz")
    with open(temporary, "wb") as handle:
        np.savez(handle, vectors=vectors, tags=np.array(tags), texts=np.array(texts))
    os.replace(temporary, INDEX_PATH)
    return IndexResult(settings.chatbot_model, len(samples), len(set(tags)), accuracy, pairs)
