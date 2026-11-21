from dataclasses import dataclass
import re

from server.utils.tags_vocabulary import NEGATION_WORDS, TAG_VOCABULARY

@dataclass
class TagMatch:
    tag: str
    confidence: float  

def _is_negated(text: str, match_start: int) -> bool:
    preceding = text[:match_start].split()[-4:]
    return bool(set(preceding) & NEGATION_WORDS)


def extract_tags(review_text: str, min_confidence: float = 0.0) -> list[TagMatch]:
    text = review_text.lower()
    results: list[TagMatch] = []

    for tag, phrases in TAG_VOCABULARY.items():
        hit_count = 0

        for phrase in phrases:
            pattern = r'\b' + re.escape(phrase) + r'\b'
            match = re.search(pattern, text)

            if match and not _is_negated(text, match.start()):
                hit_count += 1

        if hit_count == 0:
            continue
        
        if hit_count >= 3:
            confidence = 1.0
        elif hit_count == 2:
            confidence = 0.8
        else:
            confidence = 0.6

        if confidence >= min_confidence:
            results.append(TagMatch(tag=tag, confidence=confidence))

    return sorted(results, key=lambda x: x.confidence, reverse=True)