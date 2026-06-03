from dataclasses import dataclass, field
from pydantic import BaseModel, field_validator


class PromoteUnknownBody(BaseModel):
    intent_id: int

class MessageRequest(BaseModel):
    message: str
    conversation_id: int | None = None


class MessageResponse(BaseModel):
    response: str
    intent: str | None
    confidence: float
    fallback: bool
    conversation_id: int

class PatternOut(BaseModel):
    id: int
    pattern: str

    class Config:
        from_attributes = True  # allows Pydantic to read SQLAlchemy model attributes


class ResponseOut(BaseModel):
    id: int
    response: str

    class Config:
        from_attributes = True


class IntentOut(BaseModel):
    id: int
    tag: str
    type: str
    patterns: list[PatternOut] = []
    responses: list[ResponseOut] = []

    class Config:
        from_attributes = True


class IntentCreate(BaseModel):
    tag: str
    type: str

    @field_validator("tag")
    @classmethod
    def tag_must_be_slug(cls, v: str) -> str:
        # Enforce snake_case/slug format for tags so they're clean training labels.
        # "Book Search" → reject; "book_search" → accept.
        # You can relax this if you want spaces, but consistent formatting
        # makes the model's vocabulary cleaner.
        v = v.strip().lower().replace(" ", "_")
        if not v:
            raise ValueError("Tag cannot be empty")
        return v

    @field_validator("type")
    @classmethod
    def type_must_be_valid(cls, v: str) -> str:
        allowed = {"informational", "action", "fallback"}
        if v not in allowed:
            raise ValueError(f"Type must be one of: {', '.join(allowed)}")
        return v


class IntentUpdate(BaseModel):
    # Both fields optional — client sends only what changed (PATCH semantics)
    tag: str | None = None
    type: str | None = None


class PatternCreate(BaseModel):
    pattern: str

    @field_validator("pattern")
    @classmethod
    def pattern_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Pattern cannot be empty")
        return v


class PatternUpdate(BaseModel):
    pattern: str


class ResponseCreate(BaseModel):
    response: str

    @field_validator("response")
    @classmethod
    def response_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Response cannot be empty")
        return v


class ResponseUpdate(BaseModel):
    response: str


@dataclass
class InferenceContext:
    message: str
    intent: str
    confidence: float
    
    entities: dict = field(default_factory=dict)
    
    modifiers: dict = field(default_factory=dict)
    
    matched_books: list = field(default_factory=list)
    matched_authors: list = field(default_factory=list)
    matched_genres: list = field(default_factory=list)
    
    user_read_book_ids: set = field(default_factory=set)
    user_avg_rating: float = 0.0
    conversation_history: list = field(default_factory=list)