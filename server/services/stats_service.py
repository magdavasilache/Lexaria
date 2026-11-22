from collections import Counter
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from server.database.models.reading import Reading
from server.database.models.reading_challenge import ReadingChallenge
from server.database.models.reading_session import ReadingSession
from server.database.models.user import User
from server.database.models.user_session import as_utc
from server.database.schemas.stats import (
    ChallengeMetric,
    ChallengeOut,
    ChallengeProgress,
    DayActivity,
    FormatSlice,
    GenreSlice,
    MonthBucket,
    PaceStatus,
    StatsOut,
    StatsQuery,
    StatsTotals,
    StreakOut,
    TargetProgress,
)
from server.repositories import challenge_repository, stats_repository
from server.services.challenge_service import YEARS_AHEAD

TOP_GENRES = 8
STREAK_STRIP_DAYS = 7
PACE_TOLERANCE = 0.02
SECONDS_PER_HOUR = 3600


def _year_window(year: int, zone: ZoneInfo) -> tuple[datetime, datetime]:
    start = datetime(year, 1, 1, tzinfo=zone).astimezone(timezone.utc)
    end = datetime(year + 1, 1, 1, tzinfo=zone).astimezone(timezone.utc)
    return start, end


def _local(moment: datetime, zone: ZoneInfo) -> datetime:
    return as_utc(moment).astimezone(zone)


def session_pages(session: ReadingSession) -> int:
    if session.start_page is not None and session.end_page is not None:
        return session.end_page - session.start_page
    if session.start_percent is not None and session.end_percent is not None:
        edition = session.reading.edition
        if edition is not None and edition.pages:
            return round(float(session.end_percent - session.start_percent) / 100 * edition.pages)
    return 0


def _months(readings: list[Reading], sessions: list[ReadingSession], zone: ZoneInfo) -> list[MonthBucket]:
    books: Counter[int] = Counter(_local(reading.finished_at, zone).month for reading in readings)
    pages: Counter[int] = Counter()
    seconds: Counter[int] = Counter()
    for session in sessions:
        month = _local(session.started_at, zone).month
        pages[month] += session_pages(session)
        seconds[month] += session.duration_seconds or 0
    return [
        MonthBucket(month=month, books=books[month], pages=pages[month], minutes=seconds[month] // 60)
        for month in range(1, 13)
    ]


def _genres(readings: list[Reading]) -> list[GenreSlice]:
    counts: Counter[int] = Counter()
    names: dict[int, str] = {}
    for reading in readings:
        for genre in reading.book.genres:
            counts[genre.id] += 1
            names[genre.id] = genre.name
    ranked = sorted(counts, key=lambda genre_id: (-counts[genre_id], names[genre_id]))
    return [GenreSlice(genre_id=genre_id, name=names[genre_id], books=counts[genre_id]) for genre_id in ranked[:TOP_GENRES]]


def _formats(readings: list[Reading]) -> list[FormatSlice]:
    counts = Counter(reading.edition.format if reading.edition else None for reading in readings)
    return [
        FormatSlice(format=edition_format, books=books)
        for edition_format, books in sorted(counts.items(), key=lambda item: (-item[1], item[0] or ""))
    ]


def _run(days: set[date], first: date, step: int) -> int:
    length = 0
    while first + timedelta(days=length * step) in days:
        length += 1
    return length


def _streak(seconds_by_day: Counter[date], today: date) -> StreakOut:
    days = set(seconds_by_day)
    anchor = today if today in days else today - timedelta(days=1)
    starts = (day for day in days if day - timedelta(days=1) not in days)
    strip = [today - timedelta(days=offset) for offset in reversed(range(STREAK_STRIP_DAYS))]
    return StreakOut(
        current=_run(days, anchor, -1),
        longest=max((_run(days, day, 1) for day in starts), default=0),
        last_days=[DayActivity(day=day, minutes=seconds_by_day[day] // 60) for day in strip],
    )


def pace(metric: ChallengeMetric, target: int, value: float, elapsed: float, finished_year: bool) -> TargetProgress:
    expected = target * elapsed
    if value >= target:
        status = PaceStatus.COMPLETED
    elif finished_year:
        status = PaceStatus.MISSED
    elif abs(value - expected) <= target * PACE_TOLERANCE:
        status = PaceStatus.ON_TRACK
    else:
        status = PaceStatus.AHEAD if value > expected else PaceStatus.BEHIND
    return TargetProgress(metric=metric, target=target, value=round(value, 2), expected=round(expected, 2), status=status)


def _elapsed(year: int, today: date) -> float:
    if year < today.year:
        return 1.0
    if year > today.year:
        return 0.0
    days_in_year = (date(year + 1, 1, 1) - date(year, 1, 1)).days
    return ((today - date(year, 1, 1)).days + 1) / days_in_year


def _progress(
    challenge: ReadingChallenge, totals: StatsTotals, seconds: int, today: date
) -> ChallengeProgress:
    elapsed = _elapsed(challenge.year, today)
    finished_year = challenge.year < today.year
    values = (
        (ChallengeMetric.BOOKS, challenge.books_target, float(totals.books)),
        (ChallengeMetric.PAGES, challenge.pages_target, float(totals.pages)),
        (ChallengeMetric.HOURS, challenge.hours_target, seconds / SECONDS_PER_HOUR),
    )
    return ChallengeProgress(
        challenge=ChallengeOut.model_validate(challenge),
        targets=[
            pace(metric, target, value, elapsed, finished_year) for metric, target, value in values if target is not None
        ],
    )


def _available_years(db: Session, user_id: int, zone: ZoneInfo, today: date, year: int) -> list[int]:
    first = stats_repository.first_activity(db, user_id)
    first_year = min(_local(first, zone).year, today.year) if first else today.year
    last_year = today.year + YEARS_AHEAD
    years = set(range(first_year, last_year + 1)) | set(challenge_repository.years(db, user_id)) | {year}
    return sorted(years, reverse=True)


def get_stats(db: Session, query: StatsQuery, user: User) -> StatsOut:
    zone = ZoneInfo(query.tz)
    today = datetime.now(zone).date()
    year = query.year or today.year
    start, end = _year_window(year, zone)

    readings = list(stats_repository.finished_readings(db, user.id, start, end))
    sessions = list(stats_repository.ended_sessions(db, user.id, start, end))
    seconds_by_day: Counter[date] = Counter()
    for started_at, duration in stats_repository.session_days(db, user.id):
        seconds_by_day[_local(started_at, zone).date()] += duration or 0

    ratings = stats_repository.own_ratings(db, user.id, {reading.book_id for reading in readings})
    seconds = sum(session.duration_seconds or 0 for session in sessions)
    totals = StatsTotals(
        books=len(readings),
        pages=sum(session_pages(session) for session in sessions),
        minutes=seconds // 60,
        sessions=len(sessions),
        reading_days=sum(1 for day in seconds_by_day if day.year == year),
        average_rating=round(float(sum(ratings)) / len(ratings), 2) if ratings else None,
    )
    challenge = challenge_repository.get_for_year(db, user.id, year)
    return StatsOut(
        year=year,
        today=today,
        available_years=_available_years(db, user.id, zone, today, year),
        totals=totals,
        all_time_books=stats_repository.all_time_books(db, user.id),
        months=_months(readings, sessions, zone),
        genres=_genres(readings),
        formats=_formats(readings),
        streak=_streak(seconds_by_day, today),
        challenge=_progress(challenge, totals, seconds, today) if challenge else None,
    )
