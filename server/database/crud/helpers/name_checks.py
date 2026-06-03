
from difflib import SequenceMatcher


def normalize(value: str) -> str:
    return " ".join(value.strip().lower().split())

def is_similar(a: str, b: str, threshold: float = 0.85) -> bool:
    return SequenceMatcher(None, a, b).ratio() >= threshold