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
}
