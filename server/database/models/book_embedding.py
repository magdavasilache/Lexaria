from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, LargeBinary, String, func
from sqlalchemy.orm import Mapped, mapped_column

from server.database.database import Base

EMBEDDING_MODEL_MAX_LENGTH = 200
EMBEDDING_HASH_LENGTH = 64


class BookEmbedding(Base):
    __tablename__ = "book_embeddings"
    __table_args__ = (CheckConstraint("dimensions > 0", name="ck_book_embeddings_dimensions_positive"),)

    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    model: Mapped[str] = mapped_column(String(EMBEDDING_MODEL_MAX_LENGTH), nullable=False)
    text_hash: Mapped[str] = mapped_column(String(EMBEDDING_HASH_LENGTH), nullable=False)
    dimensions: Mapped[int] = mapped_column(Integer, nullable=False)
    vector: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
