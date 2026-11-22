from dataclasses import dataclass

from server.core.message_keys import MessageKey
from server.database.models.audit_log import AuditAction, AuditOutcome


@dataclass(frozen=True)
class AuditActionSpec:
    label: MessageKey
    success: MessageKey
    failure: MessageKey

    def description(self, outcome: AuditOutcome) -> MessageKey:
        return self.success if outcome == AuditOutcome.SUCCESS else self.failure


AUDIT_ACTIONS: dict[AuditAction, AuditActionSpec] = {
    AuditAction.USER_REGISTER: AuditActionSpec(
        MessageKey.AUDIT_ACTION_USER_REGISTER, MessageKey.AUDIT_USER_REGISTERED, MessageKey.AUDIT_REGISTER_FAILED
    ),
    AuditAction.USER_LOGIN: AuditActionSpec(
        MessageKey.AUDIT_ACTION_USER_LOGIN, MessageKey.AUDIT_USER_LOGGED_IN, MessageKey.AUDIT_LOGIN_FAILED
    ),
    AuditAction.TOKEN_REFRESH: AuditActionSpec(
        MessageKey.AUDIT_ACTION_TOKEN_REFRESH, MessageKey.AUDIT_TOKEN_REFRESHED, MessageKey.AUDIT_TOKEN_REFRESH_FAILED
    ),
    AuditAction.ACCESS_DENIED: AuditActionSpec(
        MessageKey.AUDIT_ACTION_ACCESS_DENIED, MessageKey.AUDIT_ACCESS_DENIED, MessageKey.AUDIT_ACCESS_DENIED
    ),
    AuditAction.USER_LOGOUT: AuditActionSpec(
        MessageKey.AUDIT_ACTION_USER_LOGOUT, MessageKey.AUDIT_USER_LOGGED_OUT, MessageKey.AUDIT_LOGOUT_FAILED
    ),
    AuditAction.USER_LOGOUT_ALL: AuditActionSpec(
        MessageKey.AUDIT_ACTION_USER_LOGOUT_ALL, MessageKey.AUDIT_USER_LOGGED_OUT_ALL, MessageKey.AUDIT_LOGOUT_ALL_FAILED
    ),
    AuditAction.SESSION_REUSE_DETECTED: AuditActionSpec(
        MessageKey.AUDIT_ACTION_SESSION_REUSE, MessageKey.AUDIT_SESSION_REUSE, MessageKey.AUDIT_SESSION_REUSE
    ),
    AuditAction.BOOK_CREATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_BOOK_CREATE, MessageKey.AUDIT_BOOK_CREATED, MessageKey.AUDIT_BOOK_CREATE_FAILED
    ),
    AuditAction.BOOK_UPDATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_BOOK_UPDATE, MessageKey.AUDIT_BOOK_UPDATED, MessageKey.AUDIT_BOOK_UPDATE_FAILED
    ),
    AuditAction.BOOK_DELETE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_BOOK_DELETE, MessageKey.AUDIT_BOOK_DELETED, MessageKey.AUDIT_BOOK_DELETE_FAILED
    ),
    AuditAction.GOODREADS_IMPORT: AuditActionSpec(
        MessageKey.AUDIT_ACTION_GOODREADS_IMPORT,
        MessageKey.AUDIT_GOODREADS_IMPORTED,
        MessageKey.AUDIT_GOODREADS_IMPORT_FAILED,
    ),
    AuditAction.REVIEW_CREATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_REVIEW_CREATE, MessageKey.AUDIT_REVIEW_CREATED, MessageKey.AUDIT_REVIEW_CREATE_FAILED
    ),
    AuditAction.REVIEW_UPDATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_REVIEW_UPDATE, MessageKey.AUDIT_REVIEW_UPDATED, MessageKey.AUDIT_REVIEW_UPDATE_FAILED
    ),
    AuditAction.REVIEW_DELETE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_REVIEW_DELETE, MessageKey.AUDIT_REVIEW_DELETED, MessageKey.AUDIT_REVIEW_DELETE_FAILED
    ),
    AuditAction.COMMENT_CREATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_COMMENT_CREATE, MessageKey.AUDIT_COMMENT_CREATED, MessageKey.AUDIT_COMMENT_CREATE_FAILED
    ),
    AuditAction.COMMENT_UPDATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_COMMENT_UPDATE, MessageKey.AUDIT_COMMENT_UPDATED, MessageKey.AUDIT_COMMENT_UPDATE_FAILED
    ),
    AuditAction.COMMENT_DELETE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_COMMENT_DELETE, MessageKey.AUDIT_COMMENT_DELETED, MessageKey.AUDIT_COMMENT_DELETE_FAILED
    ),
    AuditAction.REVIEW_LIKE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_REVIEW_LIKE, MessageKey.AUDIT_REVIEW_LIKED, MessageKey.AUDIT_REVIEW_LIKE_FAILED
    ),
    AuditAction.REVIEW_UNLIKE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_REVIEW_UNLIKE, MessageKey.AUDIT_REVIEW_UNLIKED, MessageKey.AUDIT_REVIEW_UNLIKE_FAILED
    ),
    AuditAction.COMMENT_LIKE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_COMMENT_LIKE, MessageKey.AUDIT_COMMENT_LIKED, MessageKey.AUDIT_COMMENT_LIKE_FAILED
    ),
    AuditAction.COMMENT_UNLIKE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_COMMENT_UNLIKE, MessageKey.AUDIT_COMMENT_UNLIKED, MessageKey.AUDIT_COMMENT_UNLIKE_FAILED
    ),
    AuditAction.READING_STATUS_SET: AuditActionSpec(
        MessageKey.AUDIT_ACTION_READING_STATUS_SET, MessageKey.AUDIT_READING_STATUS_SET, MessageKey.AUDIT_READING_STATUS_SET_FAILED
    ),
    AuditAction.READING_STATUS_REMOVE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_READING_STATUS_REMOVE,
        MessageKey.AUDIT_READING_STATUS_REMOVED,
        MessageKey.AUDIT_READING_STATUS_REMOVE_FAILED,
    ),
    AuditAction.EDITION_CREATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_EDITION_CREATE, MessageKey.AUDIT_EDITION_CREATED, MessageKey.AUDIT_EDITION_CREATE_FAILED
    ),
    AuditAction.EDITION_UPDATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_EDITION_UPDATE, MessageKey.AUDIT_EDITION_UPDATED, MessageKey.AUDIT_EDITION_UPDATE_FAILED
    ),
    AuditAction.EDITION_DELETE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_EDITION_DELETE, MessageKey.AUDIT_EDITION_DELETED, MessageKey.AUDIT_EDITION_DELETE_FAILED
    ),
    AuditAction.READING_SESSION_START: AuditActionSpec(
        MessageKey.AUDIT_ACTION_READING_SESSION_START,
        MessageKey.AUDIT_READING_SESSION_STARTED,
        MessageKey.AUDIT_READING_SESSION_START_FAILED,
    ),
    AuditAction.READING_SESSION_PAUSE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_READING_SESSION_PAUSE,
        MessageKey.AUDIT_READING_SESSION_PAUSED,
        MessageKey.AUDIT_READING_SESSION_PAUSE_FAILED,
    ),
    AuditAction.READING_SESSION_RESUME: AuditActionSpec(
        MessageKey.AUDIT_ACTION_READING_SESSION_RESUME,
        MessageKey.AUDIT_READING_SESSION_RESUMED,
        MessageKey.AUDIT_READING_SESSION_RESUME_FAILED,
    ),
    AuditAction.READING_SESSION_END: AuditActionSpec(
        MessageKey.AUDIT_ACTION_READING_SESSION_END,
        MessageKey.AUDIT_READING_SESSION_ENDED,
        MessageKey.AUDIT_READING_SESSION_END_FAILED,
    ),
    AuditAction.READING_SESSION_DISCARD: AuditActionSpec(
        MessageKey.AUDIT_ACTION_READING_SESSION_DISCARD,
        MessageKey.AUDIT_READING_SESSION_DISCARDED,
        MessageKey.AUDIT_READING_SESSION_DISCARD_FAILED,
    ),
    AuditAction.READING_UPDATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_READING_UPDATE,
        MessageKey.AUDIT_READING_UPDATED,
        MessageKey.AUDIT_READING_UPDATE_FAILED,
    ),
    AuditAction.READING_DELETE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_READING_DELETE,
        MessageKey.AUDIT_READING_DELETED,
        MessageKey.AUDIT_READING_DELETE_FAILED,
    ),
    AuditAction.READING_NOTE_CREATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_READING_NOTE_CREATE,
        MessageKey.AUDIT_READING_NOTE_CREATED,
        MessageKey.AUDIT_READING_NOTE_CREATE_FAILED,
    ),
    AuditAction.READING_NOTE_UPDATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_READING_NOTE_UPDATE,
        MessageKey.AUDIT_READING_NOTE_UPDATED,
        MessageKey.AUDIT_READING_NOTE_UPDATE_FAILED,
    ),
    AuditAction.READING_NOTE_DELETE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_READING_NOTE_DELETE,
        MessageKey.AUDIT_READING_NOTE_DELETED,
        MessageKey.AUDIT_READING_NOTE_DELETE_FAILED,
    ),
    AuditAction.READING_GOAL_SET: AuditActionSpec(
        MessageKey.AUDIT_ACTION_READING_GOAL_SET,
        MessageKey.AUDIT_READING_GOAL_SET,
        MessageKey.AUDIT_READING_GOAL_SET_FAILED,
    ),
    AuditAction.CHALLENGE_SET: AuditActionSpec(
        MessageKey.AUDIT_ACTION_CHALLENGE_SET,
        MessageKey.AUDIT_CHALLENGE_SET,
        MessageKey.AUDIT_CHALLENGE_SET_FAILED,
    ),
    AuditAction.CHALLENGE_DELETE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_CHALLENGE_DELETE,
        MessageKey.AUDIT_CHALLENGE_DELETED,
        MessageKey.AUDIT_CHALLENGE_DELETE_FAILED,
    ),
    AuditAction.AUTHOR_CREATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_AUTHOR_CREATE,
        MessageKey.AUDIT_AUTHOR_CREATED,
        MessageKey.AUDIT_AUTHOR_CREATE_FAILED,
    ),
    AuditAction.AUTHOR_UPDATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_AUTHOR_UPDATE,
        MessageKey.AUDIT_AUTHOR_UPDATED,
        MessageKey.AUDIT_AUTHOR_UPDATE_FAILED,
    ),
    AuditAction.AUTHOR_DELETE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_AUTHOR_DELETE,
        MessageKey.AUDIT_AUTHOR_DELETED,
        MessageKey.AUDIT_AUTHOR_DELETE_FAILED,
    ),
    AuditAction.LANGUAGE_CREATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_LANGUAGE_CREATE,
        MessageKey.AUDIT_LANGUAGE_CREATED,
        MessageKey.AUDIT_LANGUAGE_CREATE_FAILED,
    ),
    AuditAction.LANGUAGE_UPDATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_LANGUAGE_UPDATE,
        MessageKey.AUDIT_LANGUAGE_UPDATED,
        MessageKey.AUDIT_LANGUAGE_UPDATE_FAILED,
    ),
    AuditAction.LANGUAGE_DELETE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_LANGUAGE_DELETE,
        MessageKey.AUDIT_LANGUAGE_DELETED,
        MessageKey.AUDIT_LANGUAGE_DELETE_FAILED,
    ),
    AuditAction.COUNTRY_CREATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_COUNTRY_CREATE,
        MessageKey.AUDIT_COUNTRY_CREATED,
        MessageKey.AUDIT_COUNTRY_CREATE_FAILED,
    ),
    AuditAction.COUNTRY_UPDATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_COUNTRY_UPDATE,
        MessageKey.AUDIT_COUNTRY_UPDATED,
        MessageKey.AUDIT_COUNTRY_UPDATE_FAILED,
    ),
    AuditAction.COUNTRY_DELETE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_COUNTRY_DELETE,
        MessageKey.AUDIT_COUNTRY_DELETED,
        MessageKey.AUDIT_COUNTRY_DELETE_FAILED,
    ),
    AuditAction.GENRE_CREATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_GENRE_CREATE,
        MessageKey.AUDIT_GENRE_CREATED,
        MessageKey.AUDIT_GENRE_CREATE_FAILED,
    ),
    AuditAction.GENRE_UPDATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_GENRE_UPDATE,
        MessageKey.AUDIT_GENRE_UPDATED,
        MessageKey.AUDIT_GENRE_UPDATE_FAILED,
    ),
    AuditAction.GENRE_DELETE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_GENRE_DELETE,
        MessageKey.AUDIT_GENRE_DELETED,
        MessageKey.AUDIT_GENRE_DELETE_FAILED,
    ),
    AuditAction.AWARD_CREATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_AWARD_CREATE,
        MessageKey.AUDIT_AWARD_CREATED,
        MessageKey.AUDIT_AWARD_CREATE_FAILED,
    ),
    AuditAction.AWARD_UPDATE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_AWARD_UPDATE,
        MessageKey.AUDIT_AWARD_UPDATED,
        MessageKey.AUDIT_AWARD_UPDATE_FAILED,
    ),
    AuditAction.AWARD_DELETE: AuditActionSpec(
        MessageKey.AUDIT_ACTION_AWARD_DELETE,
        MessageKey.AUDIT_AWARD_DELETED,
        MessageKey.AUDIT_AWARD_DELETE_FAILED,
    ),
}
