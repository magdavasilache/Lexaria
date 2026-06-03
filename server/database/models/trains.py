from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY

from server.database.database import Base

class ChatbotTrains(Base):
    __tablename__ = "chatbot_trains"

    id = Column(Integer, primary_key=True, index=True)
    tag = Column(String, nullable=False)
    patterns = Column(ARRAY(String), nullable=False)
    responses = Column(ARRAY(String), nullable=False)