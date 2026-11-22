from collections import defaultdict

from sqlalchemy.orm import Session

from server.database.models.content_warning import ContentWarning, WarningSeverity
from server.database.models.user import User
from server.database.schemas.content_warning import ContentWarningReportOut, ContentWarningSummary, ContentWarningsOut
from server.repositories import content_warning_repository
from server.services.reader_signal_views import can_vote

SEVERITY_ORDER = {severity: index for index, severity in enumerate(WarningSeverity)}


def _summary(warning: str, by_severity: dict[str, int]) -> ContentWarningSummary:
    dominant = max(by_severity, key=lambda severity: (by_severity[severity], SEVERITY_ORDER[severity]))
    return ContentWarningSummary(
        warning=ContentWarning(warning),
        severity=WarningSeverity(dominant),
        total=sum(by_severity.values()),
        minor=by_severity.get(WarningSeverity.MINOR, 0),
        moderate=by_severity.get(WarningSeverity.MODERATE, 0),
        graphic=by_severity.get(WarningSeverity.GRAPHIC, 0),
    )


def warnings_out(db: Session, book_id: int, user: User) -> ContentWarningsOut:
    grouped: dict[str, dict[str, int]] = defaultdict(dict)
    for warning, severity, count in content_warning_repository.counts(db, book_id):
        grouped[warning][severity] = count
    summaries = sorted(
        (_summary(warning, by_severity) for warning, by_severity in grouped.items()),
        key=lambda summary: (-SEVERITY_ORDER[summary.severity], -summary.total, summary.warning.value),
    )
    return ContentWarningsOut(
        warnings=summaries,
        reporters=content_warning_repository.reporters(db, book_id),
        mine=[ContentWarningReportOut.model_validate(report) for report in content_warning_repository.mine(db, user.id, book_id)],
        can_report=can_vote(db, user, book_id),
    )
