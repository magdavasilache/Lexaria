import numpy as np
import torch
import torch.nn as nn
from typing import Callable
from sqlalchemy.orm import Session
from server.ml.model import ChatbotIntent, ChatbotPattern, NeuralNet
from server.ml.utils import bag_of_words, stem, tokenize
from server.database.database import SessionLocal

def run_training(epochs: int = 1000, on_log: Callable[[str], None] = print) -> dict:
    db: Session = SessionLocal()

    try:
        on_log("=" * 80)
        on_log("CHATBOT TRAINING STARTED")
        on_log("=" * 80)

        on_log("")
        on_log("[STEP 1] Loading intents from database...")

        intents = db.query(ChatbotIntent).all()

        if not intents:
            raise ValueError("No intents found in database. Add some before training.")

        on_log(f"[INFO] Found {len(intents)} intents.")

        all_words = []
        tags = []
        xy = []

        ignore_words = ["?", ".", "!", ","]

        on_log("")
        on_log("[STEP 2] Processing intents and patterns")

        total_patterns = 0

        for intent in intents:
            tags.append(intent.tag)

            patterns: list[ChatbotPattern] = intent.patterns

            on_log("")
            on_log(f"Intent: {intent.tag}")
            on_log(f"Patterns: {len(patterns)}")

            total_patterns += len(patterns)

            for pattern in patterns:
                tokens = tokenize(pattern.pattern)

                on_log(f"   Pattern : {pattern.pattern}")
                on_log(f"   Tokens  : {tokens}")

                all_words.extend(tokens)
                xy.append((tokens, intent.tag))

        on_log("")
        on_log("=" * 80)
        on_log("[STEP 3] Building vocabulary")
        on_log("=" * 80)

        on_log(f"Total collected words (with duplicates): {len(all_words)}")

        all_words = sorted(
            set(
                stem(w)
                for w in all_words
                if w not in ignore_words
            )
        )

        tags = sorted(set(tags))

        on_log(f"Unique vocabulary size: {len(all_words)}")
        on_log(f"Number of intent classes: {len(tags)}")
        on_log(f"Total training samples: {len(xy)}")

        on_log("")
        on_log("Intent classes:")

        for index, tag in enumerate(tags):
            on_log(f"   {index:2d} -> {tag}")

        on_log("")
        on_log("Vocabulary preview (first 50 words):")

        for word in all_words[:50]:
            on_log(f"   {word}")

        on_log("")
        on_log("=" * 80)
        on_log("[STEP 4] Creating training dataset")
        on_log("=" * 80)

        X_train = np.array([
            bag_of_words(sentence, all_words)
            for sentence, _ in xy
        ])

        y_train = np.array([
            tags.index(tag)
            for _, tag in xy
        ])

        X_train = torch.from_numpy(X_train)
        y_train = torch.from_numpy(y_train).type(torch.LongTensor)

        on_log(f"X_train shape: {tuple(X_train.shape)}")
        on_log(f"y_train shape: {tuple(y_train.shape)}")

        on_log("")
        on_log("Sample training data:")

        preview_count = min(5, len(xy))

        for i in range(preview_count):
            sentence, tag = xy[i]

            vector = X_train[i].numpy()

            active_words = [
                all_words[index]
                for index, value in enumerate(vector)
                if value == 1
            ]

            on_log("")
            on_log(f"Sample #{i + 1}")
            on_log(f"Original sentence : {' '.join(sentence)}")
            on_log(f"Target intent     : {tag}")
            on_log(f"Detected words    : {active_words}")
            on_log(f"Vector            : {vector.astype(int).tolist()}")

        on_log("")
        on_log("=" * 80)
        on_log("[STEP 5] Creating Neural Network")
        on_log("=" * 80)

        input_size = len(all_words)
        hidden_size = 8
        output_size = len(tags)

        on_log(f"Input neurons  : {input_size}")
        on_log(f"Hidden neurons : {hidden_size}")
        on_log(f"Output neurons : {output_size}")

        model = NeuralNet(
            input_size=input_size,
            hidden_size=hidden_size,
            num_classes=output_size,
        )

        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.Adam(
            model.parameters(),
            lr=0.001,
        )

        on_log("")
        on_log("=" * 80)
        on_log("[STEP 6] Training model")
        on_log("=" * 80)

        on_log(f"Epochs: {epochs}")

        log_every = max(1, epochs // 20)

        for epoch in range(1, epochs + 1):
            outputs = model(X_train)

            loss = criterion(outputs, y_train)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            if epoch % log_every == 0 or epoch == epochs:
                with torch.no_grad():
                    predictions = torch.argmax(outputs, dim=1)

                    accuracy = (
                        (predictions == y_train)
                        .float()
                        .mean()
                        .item()
                        * 100
                    )

                on_log(
                    f"Epoch {epoch:4d}/{epochs} | "
                    f"Loss: {loss.item():.4f} | "
                    f"Accuracy: {accuracy:.2f}%"
                )

        on_log("")
        on_log("=" * 80)
        on_log("[STEP 7] Saving model")
        on_log("=" * 80)

        torch.save(
            {
                "model_state": model.state_dict(),
                "input_size": input_size,
                "hidden_size": hidden_size,
                "output_size": output_size,
                "all_words": all_words,
                "tags": tags,
            },
            "server/ml/chatbot.pth",
        )

        on_log("")
        on_log("=" * 80)
        on_log("TRAINING FINISHED SUCCESSFULLY")
        on_log("=" * 80)

        on_log(f"Vocabulary size : {len(all_words)}")
        on_log(f"Intent classes  : {len(tags)}")
        on_log(f"Training samples: {len(xy)}")
        on_log(f"Epochs          : {epochs}")
        on_log(f"Final Loss      : {loss.item():.4f}")
        on_log(f"Final Accuracy  : {accuracy:.2f}%")
        on_log("")
        on_log("Model saved to:")
        on_log("server/ml/chatbot.pth")

        return {
            "success": True,
            "epochs": epochs,
            "vocab_size": len(all_words),
        }

    except Exception as e:
        on_log("")
        on_log("=" * 80)
        on_log("TRAINING FAILED")
        on_log("=" * 80)
        on_log(str(e))

        return {
            "success": False,
            "epochs": epochs,
            "error": str(e),
        }

    finally:
        db.close()      