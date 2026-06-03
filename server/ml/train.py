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
        on_log("[INFO] Loading intents from database...")
        intents = db.query(ChatbotIntent).all()

        if not intents:
            raise ValueError("No intents found in database. Add some before training.")

        all_words, tags, xy = [], [], []
        ignore_words = ["?", ".", "!", ","]

        for intent in intents:
            tags.append(intent.tag)
            patterns: list[ChatbotPattern] = intent.patterns
            for pattern in patterns:
                tokens = tokenize(pattern.pattern)
                all_words.extend(tokens)
                xy.append((tokens, intent.tag))

        all_words = sorted(set([
            stem(w) for w in all_words if w not in ignore_words
        ]))
        tags = sorted(set(tags))

        on_log(f"[INFO] Vocabulary size: {len(all_words)} words, {len(tags)} tags")

        X_train = np.array([bag_of_words(s, all_words) for s, _ in xy])
        y_train = np.array([tags.index(tag) for _, tag in xy])
        X_train = torch.from_numpy(X_train)
        y_train = torch.from_numpy(y_train).type(torch.LongTensor)

        input_size, hidden_size, output_size = len(all_words), 8, len(tags)
        model = NeuralNet(input_size=input_size, hidden_size=hidden_size, num_classes=output_size)
        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

        on_log(f"[INFO] Starting training for {epochs} epochs...")

        log_every = max(1, epochs // 20)  
        for epoch in range(1, epochs + 1):
            outputs = model(X_train)
            loss = criterion(outputs, y_train)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            if epoch % log_every == 0 or epoch == epochs:
                on_log(f"[Epoch {epoch}/{epochs}] loss: {loss.item():.4f}")

        torch.save({
            "model_state": model.state_dict(),
            "input_size": input_size,
            "hidden_size": hidden_size,
            "output_size": output_size,
            "all_words": all_words,
            "tags": tags,
        }, "server/ml/chatbot.pth")

        on_log("[✓] Model saved to ml/chatbot.pth")
        return {"success": True, "epochs": epochs, "vocab_size": len(all_words)}

    except Exception as e:
        on_log(f"[ERROR] Training failed: {e}")
        return {"success": False, "epochs": epochs, "error": str(e)}
    finally:
        db.close()