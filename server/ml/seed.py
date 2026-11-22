import argparse
import json
from pathlib import Path

from pydantic import TypeAdapter

import server.models
from server.database.database import SessionLocal
from server.database.schemas.chatbot import (
    SeedIntent,
    TrainingDoneEvent,
    TrainingErrorEvent,
    TrainingProgressEvent,
    TrainingStartedEvent,
)
from server.services import chatbot_service

SEED_FILE = Path(__file__).resolve().parent / "seed" / "intents.json"
OPERATOR = "seed"


def _report(event: object) -> None:
    if isinstance(event, TrainingStartedEvent):
        print(f"indexing {event.samples} patterns from {event.intents} intents with {event.model}")
    elif isinstance(event, TrainingProgressEvent) and event.done == event.total:
        print(f"{event.stage}: done")
    elif isinstance(event, TrainingDoneEvent):
        training = event.training
        print(f"index saved, training #{training.id}, cross-validated accuracy {training.accuracy:.1%}")
        for pair in training.confused_pairs or []:
            print(f"  {pair.expected} -> {pair.predicted}: {pair.count}")
    elif isinstance(event, TrainingErrorEvent):
        print(f"training failed: {event.error.message}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Load chatbot intents, patterns and responses from a JSON seed file.")
    parser.add_argument("--file", type=Path, default=SEED_FILE)
    parser.add_argument("--merge", action="store_true", help="keep existing intents and add what is missing")
    parser.add_argument("--train", action="store_true", help="rebuild the chatbot index after seeding")
    args = parser.parse_args()

    intents = TypeAdapter(list[SeedIntent]).validate_python(json.loads(args.file.read_text(encoding="utf-8")))
    with SessionLocal() as db:
        summary = chatbot_service.seed_intents(db, intents, replace=not args.merge)
        print(f"seeded {summary.intents} intents, {summary.patterns} patterns, {summary.responses} responses")
        if args.train:
            chatbot_service.train_now(db, OPERATOR, _report)


if __name__ == "__main__":
    main()
