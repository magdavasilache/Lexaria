from typing import Annotated

from pydantic import Field, field_validator

from server.core.message_keys import MessageKey, key_error
from server.database.models.content_warning import ContentWarning, WarningSeverity
from server.database.schemas.base import InputSchema, OutputSchema


class ContentWarningReport(InputSchema):
    warning: ContentWarning
    severity: WarningSeverity


class ContentWarningsUpdate(InputSchema):
    warnings: Annotated[
        list[ContentWarningReport],
        Field(min_length=1, max_length=len(ContentWarning), description="Each warning once, with how graphic it is."),
    ]

    @field_validator("warnings")
    @classmethod
    def each_warning_once(cls, value: list[ContentWarningReport]) -> list[ContentWarningReport]:
        if len({report.warning for report in value}) != len(value):
            raise key_error(MessageKey.CONTENT_WARNING_DUPLICATE)
        return value


class ContentWarningReportOut(OutputSchema):
    warning: ContentWarning
    severity: WarningSeverity


class ContentWarningSummary(OutputSchema):
    warning: ContentWarning
    severity: WarningSeverity
    total: int
    minor: int
    moderate: int
    graphic: int


class ContentWarningsOut(OutputSchema):
    warnings: list[ContentWarningSummary]
    reporters: int
    mine: list[ContentWarningReportOut]
    can_report: bool
