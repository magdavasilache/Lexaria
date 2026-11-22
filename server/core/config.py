from functools import lru_cache
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    database_url: str = Field(min_length=1)
    secret_key: str = Field(min_length=16)
    algorithm: str = "HS256"
    access_token_ttl_minutes: int = Field(default=15, ge=1)
    session_idle_ttl_days: int = Field(default=7, ge=1)
    session_absolute_ttl_days: int = Field(default=30, ge=1)
    refresh_grace_seconds: int = Field(default=30, ge=0)
    login_max_attempts: int = Field(default=3, ge=1)
    login_lock_minutes: int = Field(default=15, ge=1)
    refresh_cookie_name: str = "lexaria_refresh"
    refresh_cookie_path: str = "/auth"
    cookie_secure: bool = False
    cookie_samesite: Literal["strict", "lax", "none"] = "strict"
    cors_origins: list[str] = ["http://localhost:5173"]
    chatbot_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    chatbot_min_similarity: float = Field(default=0.6, ge=0, le=1)
    chatbot_min_margin: float = Field(default=0.02, ge=0, le=1)
    chatbot_overlap_similarity: float = Field(default=0.9, ge=0, le=1)
    warm_up_embeddings: bool = True
    open_library_url: str = "https://openlibrary.org"
    open_library_covers_url: str = "https://covers.openlibrary.org"
    open_library_timeout_seconds: float = Field(default=10, gt=0, le=60)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
