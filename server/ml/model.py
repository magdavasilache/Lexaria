from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from server.database.database import Base

import torch.nn as nn

class NeuralNet(nn.Module):
    def __init__(
        self,
        input_size: int,
        hidden_size: int,
        num_classes: int
    ):
        
        super().__init__()

        self.l1 = nn.Linear(input_size, hidden_size)
        self.l2 = nn.Linear(hidden_size, hidden_size)
        self.l3 = nn.Linear(hidden_size, num_classes)

        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.relu(self.l1(x))
        x = self.relu(self.l2(x))
        x = self.l3(x)

        return x

class ChatbotIntent(Base):
    __tablename__ = "chatbot_intents"

    id = Column(Integer, primary_key=True, index=True)
    tag = Column(String, unique=True, nullable=False)
    type = Column(String, nullable=False)

    patterns = relationship(
        "ChatbotPattern",
        back_populates="intent",
        cascade="all, delete-orphan"
    )

    responses = relationship(
        "ChatbotResponse",
        back_populates="intent",
        cascade="all, delete-orphan"
    )

class ChatbotPattern(Base):
    __tablename__ = "chatbot_patterns"

    id = Column(Integer, primary_key=True, index=True)
    pattern = Column(String, nullable=False)

    intent_id = Column(
        Integer,
        ForeignKey("chatbot_intents.id", ondelete="CASCADE"),
        nullable=False
    )

    intent = relationship(
        "ChatbotIntent",
        back_populates="patterns"
    )

class ChatbotResponse(Base):
    __tablename__ = "chatbot_responses"

    id = Column(Integer, primary_key=True, index=True)
    response = Column(String, nullable=False)

    intent_id = Column(
        Integer,
        ForeignKey("chatbot_intents.id", ondelete="CASCADE"),
        nullable=False
    )

    intent = relationship(
        "ChatbotIntent",
        back_populates="responses"
    )
    
class ChatbotConversation(Base):
    __tablename__ = "chatbot_conversations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship(
        "ChatbotMessage",
        back_populates="conversation",
        cascade="all, delete-orphan"
    )

class ChatbotMessage(Base):
    __tablename__ = "chatbot_messages"

    id = Column(Integer, primary_key=True, index=True)

    conversation_id = Column(
        Integer,
        ForeignKey("chatbot_conversations.id", ondelete="CASCADE"),
        nullable=False
    )

    role = Column(String, nullable=False)
    message = Column(String, nullable=False)

    predicted_intent_id = Column(
        Integer,
        ForeignKey("chatbot_intents.id"),
        nullable=True
    )

    confidence = Column(Float,nullable=True)

    created_at = Column(DateTime, default=datetime.now)

    conversation = relationship(
        "ChatbotConversation",
        back_populates="messages"
    )

    predicted_intent = relationship("ChatbotIntent")


class ChatbotUnknownMessage(Base):
    __tablename__ = "chatbot_unknown_messages"

    id = Column(Integer, primary_key=True, index=True)

    message = Column(String, nullable=False)

    confidence = Column(Float, nullable=False)

    created_at = Column(DateTime, default=datetime.now)

class ChatbotTraining(Base):
    __tablename__ = "chatbot_trainings"

    id = Column(Integer, primary_key=True, index=True)

    epochs = Column(Integer, nullable=False)

    success = Column(Boolean, nullable=False)

    created_at = Column(DateTime, default=datetime.now)