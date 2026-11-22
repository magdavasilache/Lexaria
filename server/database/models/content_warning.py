from datetime import datetime
from enum import StrEnum

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column

from server.database.database import Base


class ContentWarning(StrEnum):
    ADDICTION = "addiction"
    ANIMAL_CRUELTY = "animal_cruelty"
    BODY_HORROR = "body_horror"
    BULLYING = "bullying"
    CANCER = "cancer"
    CHILD_ABUSE = "child_abuse"
    DEATH = "death"
    DEATH_OF_PARENT = "death_of_parent"
    DOMESTIC_ABUSE = "domestic_abuse"
    EATING_DISORDER = "eating_disorder"
    GORE = "gore"
    GUN_VIOLENCE = "gun_violence"
    HOMOPHOBIA = "homophobia"
    INFIDELITY = "infidelity"
    KIDNAPPING = "kidnapping"
    MENTAL_ILLNESS = "mental_illness"
    MISOGYNY = "misogyny"
    PREGNANCY_LOSS = "pregnancy_loss"
    RACISM = "racism"
    SELF_HARM = "self_harm"
    SEXUAL_ASSAULT = "sexual_assault"
    SEXUAL_CONTENT = "sexual_content"
    SUICIDE = "suicide"
    TERMINAL_ILLNESS = "terminal_illness"
    TORTURE = "torture"
    TRANSPHOBIA = "transphobia"
    VIOLENCE = "violence"
    WAR = "war"


class WarningSeverity(StrEnum):
    MINOR = "minor"
    MODERATE = "moderate"
    GRAPHIC = "graphic"


CONTENT_WARNING_MAX_LENGTH = 20
WARNING_SEVERITY_MAX_LENGTH = 10


def _values_sql(enum: type[StrEnum]) -> str:
    return ", ".join(repr(member.value) for member in enum)


class BookContentWarning(Base):
    __tablename__ = "book_content_warnings"
    __table_args__ = (
        CheckConstraint(f"warning IN ({_values_sql(ContentWarning)})", name="ck_book_content_warnings_warning_valid"),
        CheckConstraint(
            f"severity IN ({_values_sql(WarningSeverity)})", name="ck_book_content_warnings_severity_valid"
        ),
        Index("ix_book_content_warnings_book_id", "book_id"),
        Index("ix_book_content_warnings_warning_book_id", "warning", "book_id"),
    )

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    warning: Mapped[str] = mapped_column(String(CONTENT_WARNING_MAX_LENGTH), primary_key=True)
    severity: Mapped[str] = mapped_column(String(WARNING_SEVERITY_MAX_LENGTH), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
