from sqlalchemy.orm import Session

from server.ml.model import ChatbotIntent

def get_intents(db: Session):
    db_intents = (
        db.query(ChatbotIntent)
    )