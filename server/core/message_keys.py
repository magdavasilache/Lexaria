from enum import StrEnum
from typing import Any

from pydantic_core import PydanticCustomError

MessageParam = str | int | float | list[str]


class MessageKey(StrEnum):
    UNEXPECTED = "common.unexpected"
    TRY_LATER = "common.tryLater"
    REQUEST_FAILED = "common.requestFailed"
    BAD_REQUEST = "common.badRequest"
    NOT_FOUND = "common.notFound"
    METHOD_NOT_ALLOWED = "common.methodNotAllowed"
    CONFLICT = "common.conflict"
    FORBIDDEN = "common.forbidden"
    DATABASE = "common.database"

    NOT_AUTHENTICATED = "users.notAuthenticated"
    LOGIN_AND_RETRY = "users.loginAndRetry"
    LOGIN_AGAIN = "users.loginAgain"
    SESSION_EXPIRED = "users.sessionExpired"
    INVALID_TOKEN = "users.invalidToken"
    ACCOUNT_GONE = "users.accountGone"
    INVALID_CREDENTIALS = "users.invalidCredentials"
    INVALID_CREDENTIALS_HINT = "users.invalidCredentialsHint"
    USERNAME_EXISTS = "users.usernameExists"
    USERNAME_EXISTS_HINT = "users.usernameExistsHint"

    REQUIRED = "validation.required"
    NOT_ALLOWED = "validation.notAllowed"
    INVALID = "validation.invalid"
    TEXT = "validation.text"
    MIN_CHARS = "validation.minChars"
    MAX_CHARS = "validation.maxChars"
    PATTERN = "validation.pattern"
    WHOLE_NUMBER = "validation.wholeNumber"
    NUMBER = "validation.number"
    BOOLEAN = "validation.boolean"
    GREATER_THAN = "validation.greaterThan"
    AT_LEAST = "validation.atLeast"
    LESS_THAN = "validation.lessThan"
    AT_MOST = "validation.atMost"
    ONE_OF = "validation.oneOf"
    DATE = "validation.date"
    DATETIME = "validation.datetime"
    DATE_RANGE = "validation.dateRange"
    URL = "validation.url"
    LIST = "validation.list"
    MIN_ITEMS = "validation.minItems"
    MAX_ITEMS = "validation.maxItems"
    INVALID_JSON = "validation.invalidJson"
    JSON_OBJECT = "validation.jsonObject"
    OBJECT = "validation.object"
    USERNAME_PATTERN = "validation.usernamePattern"
    PASSWORD_MAX_BYTES = "validation.passwordMaxBytes"
    PASSWORD_MISSING = "validation.passwordMissing"
    PASSWORD_UPPERCASE = "validation.passwordRequirement.uppercase"
    PASSWORD_LOWERCASE = "validation.passwordRequirement.lowercase"
    PASSWORD_NUMBER = "validation.passwordRequirement.number"
    PASSWORD_SPECIAL = "validation.passwordRequirement.special"

    UNSUPPORTED_IMAGE = "books.unsupportedImage"
    IMAGE_TOO_LARGE = "books.imageTooLarge"
    BOOK_NOT_FOUND = "books.notFound"
    AUTHOR_NOT_FOUND = "books.authorNotFound"
    LANGUAGE_NOT_FOUND = "books.languageNotFound"
    COUNTRY_NOT_FOUND = "books.countryNotFound"
    GENRES_NOT_FOUND = "books.genresNotFound"
    AWARDS_NOT_FOUND = "books.awardsNotFound"
    TOO_MANY_IMAGES = "books.tooManyImages"
    IMAGE_NOT_ON_BOOK = "books.imageNotOnBook"
    PUBLISHED_TOO_FAR = "books.publishedTooFar"
    DESCRIPTION_LANGUAGE = "books.descriptionLanguage"
    DUPLICATE_DESCRIPTION = "books.duplicateDescription"
    READING_STATUS_WANT_TO_READ = "books.readingStatus.want_to_read"
    READING_STATUS_CURRENTLY_READING = "books.readingStatus.currently_reading"
    READING_STATUS_READ = "books.readingStatus.read"
    READING_STATUS_DID_NOT_FINISH = "books.readingStatus.did_not_finish"

    EDITION_PAGES_REQUIRED = "reading.editionPagesRequired"
    ISBN_INVALID = "reading.isbnInvalid"
    PROGRESS_ONE_OF = "reading.progressOneOf"
    READING_FUTURE_TIME = "reading.futureTime"

    IMPORT_FILE_TYPE = "imports.fileType"
    IMPORT_FILE_TOO_LARGE = "imports.fileTooLarge"
    IMPORT_INVALID_JSON = "imports.invalidJson"
    IMPORT_UNEXPECTED_STRUCTURE = "imports.unexpectedStructure"
    IMPORT_ROW_SKIPPED = "imports.rowSkipped"
    IMPORT_ROW_MISSING_TITLE = "imports.rowMissingTitle"
    IMPORT_ROW_INVALID_RATING = "imports.rowInvalidRating"
    IMPORT_ROW_INVALID_DATE = "imports.rowInvalidDate"
    IMPORT_ROW_INVALID_STATUS = "imports.rowInvalidStatus"
    IMPORT_ROW_REVIEW_TOO_LONG = "imports.rowReviewTooLong"

    REVIEW_NOT_FOUND = "reviews.notFound"
    REVIEW_EXISTS = "reviews.alreadyReviewed"
    REVIEW_EXISTS_HINT = "reviews.alreadyReviewedHint"
    REVIEW_EMPTY = "reviews.empty"
    REVIEW_NOT_AUTHOR = "reviews.notAuthor"
    REVIEW_FUTURE_DATE = "reviews.futureDate"
    REVIEW_RATING_STEP = "reviews.ratingStep"
    COMMENT_NOT_FOUND = "reviews.commentNotFound"
    COMMENT_NOT_AUTHOR = "reviews.commentNotAuthor"

    AUDIT_ACTION_USER_REGISTER = "audit.actions.userRegister"
    AUDIT_ACTION_USER_LOGIN = "audit.actions.userLogin"
    AUDIT_ACTION_TOKEN_REFRESH = "audit.actions.tokenRefresh"
    AUDIT_ACTION_ACCESS_DENIED = "audit.actions.accessDenied"
    AUDIT_ACTION_USER_LOGOUT = "audit.actions.userLogout"
    AUDIT_ACTION_USER_LOGOUT_ALL = "audit.actions.userLogoutAll"
    AUDIT_ACTION_SESSION_REUSE = "audit.actions.sessionReuse"
    AUDIT_USER_REGISTERED = "audit.descriptions.userRegistered"
    AUDIT_REGISTER_FAILED = "audit.descriptions.registerFailed"
    AUDIT_USER_LOGGED_IN = "audit.descriptions.userLoggedIn"
    AUDIT_LOGIN_FAILED = "audit.descriptions.loginFailed"
    AUDIT_TOKEN_REFRESHED = "audit.descriptions.tokenRefreshed"
    AUDIT_TOKEN_REFRESH_FAILED = "audit.descriptions.tokenRefreshFailed"
    AUDIT_ACCESS_DENIED = "audit.descriptions.accessDenied"
    AUDIT_USER_LOGGED_OUT = "audit.descriptions.userLoggedOut"
    AUDIT_LOGOUT_FAILED = "audit.descriptions.logoutFailed"
    AUDIT_USER_LOGGED_OUT_ALL = "audit.descriptions.userLoggedOutAll"
    AUDIT_LOGOUT_ALL_FAILED = "audit.descriptions.logoutAllFailed"
    AUDIT_SESSION_REUSE = "audit.descriptions.sessionReuse"
    AUDIT_ACTION_BOOK_CREATE = "audit.actions.bookCreate"
    AUDIT_ACTION_BOOK_UPDATE = "audit.actions.bookUpdate"
    AUDIT_ACTION_BOOK_DELETE = "audit.actions.bookDelete"
    AUDIT_ACTION_GOODREADS_IMPORT = "audit.actions.goodreadsImport"
    AUDIT_BOOK_CREATED = "audit.descriptions.bookCreated"
    AUDIT_BOOK_CREATE_FAILED = "audit.descriptions.bookCreateFailed"
    AUDIT_BOOK_UPDATED = "audit.descriptions.bookUpdated"
    AUDIT_BOOK_UPDATE_FAILED = "audit.descriptions.bookUpdateFailed"
    AUDIT_BOOK_DELETED = "audit.descriptions.bookDeleted"
    AUDIT_BOOK_DELETE_FAILED = "audit.descriptions.bookDeleteFailed"
    AUDIT_GOODREADS_IMPORTED = "audit.descriptions.goodreadsImported"
    AUDIT_GOODREADS_IMPORT_FAILED = "audit.descriptions.goodreadsImportFailed"
    AUDIT_ACTION_REVIEW_CREATE = "audit.actions.reviewCreate"
    AUDIT_REVIEW_CREATED = "audit.descriptions.reviewCreated"
    AUDIT_REVIEW_CREATE_FAILED = "audit.descriptions.reviewCreateFailed"
    AUDIT_ACTION_REVIEW_UPDATE = "audit.actions.reviewUpdate"
    AUDIT_REVIEW_UPDATED = "audit.descriptions.reviewUpdated"
    AUDIT_REVIEW_UPDATE_FAILED = "audit.descriptions.reviewUpdateFailed"
    AUDIT_ACTION_REVIEW_DELETE = "audit.actions.reviewDelete"
    AUDIT_REVIEW_DELETED = "audit.descriptions.reviewDeleted"
    AUDIT_REVIEW_DELETE_FAILED = "audit.descriptions.reviewDeleteFailed"
    AUDIT_ACTION_COMMENT_CREATE = "audit.actions.commentCreate"
    AUDIT_COMMENT_CREATED = "audit.descriptions.commentCreated"
    AUDIT_COMMENT_CREATE_FAILED = "audit.descriptions.commentCreateFailed"
    AUDIT_ACTION_COMMENT_UPDATE = "audit.actions.commentUpdate"
    AUDIT_COMMENT_UPDATED = "audit.descriptions.commentUpdated"
    AUDIT_COMMENT_UPDATE_FAILED = "audit.descriptions.commentUpdateFailed"
    AUDIT_ACTION_COMMENT_DELETE = "audit.actions.commentDelete"
    AUDIT_COMMENT_DELETED = "audit.descriptions.commentDeleted"
    AUDIT_COMMENT_DELETE_FAILED = "audit.descriptions.commentDeleteFailed"
    AUDIT_ACTION_REVIEW_LIKE = "audit.actions.reviewLike"
    AUDIT_REVIEW_LIKED = "audit.descriptions.reviewLiked"
    AUDIT_REVIEW_LIKE_FAILED = "audit.descriptions.reviewLikeFailed"
    AUDIT_ACTION_REVIEW_UNLIKE = "audit.actions.reviewUnlike"
    AUDIT_REVIEW_UNLIKED = "audit.descriptions.reviewUnliked"
    AUDIT_REVIEW_UNLIKE_FAILED = "audit.descriptions.reviewUnlikeFailed"
    AUDIT_ACTION_COMMENT_LIKE = "audit.actions.commentLike"
    AUDIT_COMMENT_LIKED = "audit.descriptions.commentLiked"
    AUDIT_COMMENT_LIKE_FAILED = "audit.descriptions.commentLikeFailed"
    AUDIT_ACTION_COMMENT_UNLIKE = "audit.actions.commentUnlike"
    AUDIT_COMMENT_UNLIKED = "audit.descriptions.commentUnliked"
    AUDIT_COMMENT_UNLIKE_FAILED = "audit.descriptions.commentUnlikeFailed"
    AUDIT_ACTION_READING_STATUS_SET = "audit.actions.readingStatusSet"
    AUDIT_READING_STATUS_SET = "audit.descriptions.readingStatusSet"
    AUDIT_READING_STATUS_SET_FAILED = "audit.descriptions.readingStatusSetFailed"
    AUDIT_ACTION_READING_STATUS_REMOVE = "audit.actions.readingStatusRemove"
    AUDIT_READING_STATUS_REMOVED = "audit.descriptions.readingStatusRemoved"
    AUDIT_READING_STATUS_REMOVE_FAILED = "audit.descriptions.readingStatusRemoveFailed"


ENGLISH: dict[MessageKey, str] = {
    MessageKey.UNEXPECTED: "Something went wrong on our side.",
    MessageKey.TRY_LATER: "Please try again later.",
    MessageKey.REQUEST_FAILED: "Request failed.",
    MessageKey.BAD_REQUEST: "Bad request.",
    MessageKey.NOT_FOUND: "Resource not found.",
    MessageKey.METHOD_NOT_ALLOWED: "This action is not allowed.",
    MessageKey.CONFLICT: "This change conflicts with existing data.",
    MessageKey.FORBIDDEN: "You don't have permission to do this.",
    MessageKey.DATABASE: "A database error occurred.",
    MessageKey.NOT_AUTHENTICATED: "You need to be logged in to do this.",
    MessageKey.LOGIN_AND_RETRY: "Please log in and try again.",
    MessageKey.LOGIN_AGAIN: "Please log in again.",
    MessageKey.SESSION_EXPIRED: "Your session has expired.",
    MessageKey.INVALID_TOKEN: "Invalid token.",
    MessageKey.ACCOUNT_GONE: "Your account no longer exists.",
    MessageKey.INVALID_CREDENTIALS: "Invalid username or password.",
    MessageKey.INVALID_CREDENTIALS_HINT: "Check your spelling, or register if you don't have an account yet.",
    MessageKey.USERNAME_EXISTS: "This username is already taken.",
    MessageKey.USERNAME_EXISTS_HINT: "Try another username.",
    MessageKey.REQUIRED: "This field is required.",
    MessageKey.NOT_ALLOWED: "This field is not allowed.",
    MessageKey.INVALID: "Invalid value.",
    MessageKey.TEXT: "Must be text.",
    MessageKey.MIN_CHARS: "Must be at least {min_length} characters.",
    MessageKey.MAX_CHARS: "Must be at most {max_length} characters.",
    MessageKey.PATTERN: "Contains characters that are not allowed.",
    MessageKey.WHOLE_NUMBER: "Must be a whole number.",
    MessageKey.NUMBER: "Must be a number.",
    MessageKey.BOOLEAN: "Must be true or false.",
    MessageKey.GREATER_THAN: "Must be greater than {gt}.",
    MessageKey.AT_LEAST: "Must be at least {ge}.",
    MessageKey.LESS_THAN: "Must be less than {lt}.",
    MessageKey.AT_MOST: "Must be at most {le}.",
    MessageKey.ONE_OF: "Must be one of: {expected}.",
    MessageKey.DATE: "Must be a valid date (YYYY-MM-DD).",
    MessageKey.DATETIME: "Must be a valid date and time.",
    MessageKey.DATE_RANGE: "The end date must be on or after the start date.",
    MessageKey.URL: "Must be a valid URL.",
    MessageKey.LIST: "Must be a list.",
    MessageKey.MIN_ITEMS: "Must contain at least {min_length} items.",
    MessageKey.MAX_ITEMS: "Must contain at most {max_length} items.",
    MessageKey.INVALID_JSON: "The request body is not valid JSON.",
    MessageKey.JSON_OBJECT: "The request body must be a JSON object.",
    MessageKey.OBJECT: "Must be an object.",
    MessageKey.USERNAME_PATTERN: "Username can only contain letters, numbers, dots, dashes and underscores.",
    MessageKey.PASSWORD_MAX_BYTES: "Password must be at most {max_bytes} bytes long.",
    MessageKey.PASSWORD_MISSING: "Password must contain {missing}.",
    MessageKey.PASSWORD_UPPERCASE: "an uppercase letter",
    MessageKey.PASSWORD_LOWERCASE: "a lowercase letter",
    MessageKey.PASSWORD_NUMBER: "a number",
    MessageKey.PASSWORD_SPECIAL: "a special character (e.g. !, @, #, ?)",
    MessageKey.UNSUPPORTED_IMAGE: "{filename} is not a supported image. Use JPG, PNG or WebP.",
    MessageKey.IMAGE_TOO_LARGE: "{filename} is larger than {max_mb} MB.",
    MessageKey.BOOK_NOT_FOUND: "This book doesn't exist or was removed.",
    MessageKey.AUTHOR_NOT_FOUND: "The selected author doesn't exist.",
    MessageKey.LANGUAGE_NOT_FOUND: "The selected language doesn't exist.",
    MessageKey.COUNTRY_NOT_FOUND: "The selected country doesn't exist.",
    MessageKey.GENRES_NOT_FOUND: "Some selected genres don't exist (ids: {ids}).",
    MessageKey.AWARDS_NOT_FOUND: "Some selected awards don't exist (ids: {ids}).",
    MessageKey.TOO_MANY_IMAGES: "A book can have at most {max} images.",
    MessageKey.IMAGE_NOT_ON_BOOK: "{filename} is not one of this book's images.",
    MessageKey.PUBLISHED_TOO_FAR: "The publication date can be at most one year from today.",
    MessageKey.DESCRIPTION_LANGUAGE: "Use a language code such as en, ro or pt-BR.",
    MessageKey.DUPLICATE_DESCRIPTION: "There is more than one description in {language}.",
    MessageKey.READING_STATUS_WANT_TO_READ: "Want to read",
    MessageKey.READING_STATUS_CURRENTLY_READING: "Currently reading",
    MessageKey.READING_STATUS_READ: "Read",
    MessageKey.READING_STATUS_DID_NOT_FINISH: "Did not finish",
    MessageKey.EDITION_PAGES_REQUIRED: "Printed editions need a page count.",
    MessageKey.ISBN_INVALID: "Enter a valid ISBN-10 or ISBN-13.",
    MessageKey.PROGRESS_ONE_OF: "Enter either a page or a percentage, not both.",
    MessageKey.READING_FUTURE_TIME: "Reading times can't be in the future.",
    MessageKey.IMPORT_FILE_TYPE: "{filename} must be a JSON file.",
    MessageKey.IMPORT_FILE_TOO_LARGE: "{filename} is larger than {max_mb} MB.",
    MessageKey.IMPORT_INVALID_JSON: "{filename} is not valid JSON.",
    MessageKey.IMPORT_UNEXPECTED_STRUCTURE: "{filename} doesn't look like a Goodreads export.",
    MessageKey.IMPORT_ROW_SKIPPED: "Row {row} was skipped: {reason}.",
    MessageKey.IMPORT_ROW_MISSING_TITLE: "the book title is missing",
    MessageKey.IMPORT_ROW_INVALID_RATING: "the rating is not between 0 and 5",
    MessageKey.IMPORT_ROW_INVALID_DATE: "the date is not valid",
    MessageKey.IMPORT_ROW_INVALID_STATUS: "the reading status is not recognised",
    MessageKey.IMPORT_ROW_REVIEW_TOO_LONG: "the review text is too long",
    MessageKey.REVIEW_NOT_FOUND: "This review doesn't exist or was removed.",
    MessageKey.REVIEW_EXISTS: "You have already reviewed this book.",
    MessageKey.REVIEW_EXISTS_HINT: "Edit your existing review instead.",
    MessageKey.REVIEW_EMPTY: "Add a rating or write a review.",
    MessageKey.REVIEW_NOT_AUTHOR: "You can only change your own reviews.",
    MessageKey.REVIEW_FUTURE_DATE: "Reading dates can't be in the future.",
    MessageKey.REVIEW_RATING_STEP: "Ratings go from {min} to {max} in half-star steps.",
    MessageKey.COMMENT_NOT_FOUND: "This comment doesn't exist or was removed.",
    MessageKey.COMMENT_NOT_AUTHOR: "You can only change your own comments.",
    MessageKey.AUDIT_ACTION_USER_REGISTER: "Registration",
    MessageKey.AUDIT_ACTION_USER_LOGIN: "Login",
    MessageKey.AUDIT_ACTION_TOKEN_REFRESH: "Session refresh",
    MessageKey.AUDIT_ACTION_ACCESS_DENIED: "Access denied",
    MessageKey.AUDIT_USER_REGISTERED: "{username} created an account.",
    MessageKey.AUDIT_REGISTER_FAILED: "Registration failed for {username}: {reason}",
    MessageKey.AUDIT_USER_LOGGED_IN: "{username} logged in.",
    MessageKey.AUDIT_LOGIN_FAILED: "Failed login attempt for {username}: {reason}",
    MessageKey.AUDIT_TOKEN_REFRESHED: "{username} refreshed their session.",
    MessageKey.AUDIT_TOKEN_REFRESH_FAILED: "Session refresh failed: {reason}",
    MessageKey.AUDIT_ACCESS_DENIED: "{username} tried to access {path} without permission.",
    MessageKey.AUDIT_ACTION_USER_LOGOUT: "Logout",
    MessageKey.AUDIT_ACTION_USER_LOGOUT_ALL: "Logout everywhere",
    MessageKey.AUDIT_ACTION_SESSION_REUSE: "Session token reuse",
    MessageKey.AUDIT_USER_LOGGED_OUT: "{username} logged out.",
    MessageKey.AUDIT_LOGOUT_FAILED: "Logout failed: {reason}",
    MessageKey.AUDIT_USER_LOGGED_OUT_ALL: "{username} logged out of every device.",
    MessageKey.AUDIT_LOGOUT_ALL_FAILED: "Logout from every device failed: {reason}",
    MessageKey.AUDIT_SESSION_REUSE: "An old session token for {username} was reused; the session was revoked.",
    MessageKey.AUDIT_ACTION_BOOK_CREATE: "Book added",
    MessageKey.AUDIT_ACTION_BOOK_UPDATE: "Book edited",
    MessageKey.AUDIT_ACTION_BOOK_DELETE: "Book deleted",
    MessageKey.AUDIT_ACTION_GOODREADS_IMPORT: "Goodreads import",
    MessageKey.AUDIT_BOOK_CREATED: "{username} added the book \"{title}\".",
    MessageKey.AUDIT_BOOK_CREATE_FAILED: "{username} could not add the book \"{title}\": {reason}",
    MessageKey.AUDIT_BOOK_UPDATED: "{username} edited the book \"{title}\".",
    MessageKey.AUDIT_BOOK_UPDATE_FAILED: "{username} could not edit book #{book_id}: {reason}",
    MessageKey.AUDIT_BOOK_DELETED: "{username} deleted the book \"{title}\".",
    MessageKey.AUDIT_BOOK_DELETE_FAILED: "{username} could not delete book #{book_id}: {reason}",
    MessageKey.AUDIT_GOODREADS_IMPORTED: "{username} imported {books} new books, {statuses} reading statuses and {reviews} ratings from Goodreads.",
    MessageKey.AUDIT_GOODREADS_IMPORT_FAILED: "Goodreads import failed for {username}: {reason}",
    MessageKey.AUDIT_ACTION_REVIEW_CREATE: "Review written",
    MessageKey.AUDIT_REVIEW_CREATED: "{username} reviewed \"{title}\".",
    MessageKey.AUDIT_REVIEW_CREATE_FAILED: "{username} could not review book #{book_id}: {reason}",
    MessageKey.AUDIT_ACTION_REVIEW_UPDATE: "Review edited",
    MessageKey.AUDIT_REVIEW_UPDATED: "{username} edited their review of \"{title}\".",
    MessageKey.AUDIT_REVIEW_UPDATE_FAILED: "{username} could not edit review #{review_id}: {reason}",
    MessageKey.AUDIT_ACTION_REVIEW_DELETE: "Review deleted",
    MessageKey.AUDIT_REVIEW_DELETED: "{username} deleted a review of \"{title}\".",
    MessageKey.AUDIT_REVIEW_DELETE_FAILED: "{username} could not delete review #{review_id}: {reason}",
    MessageKey.AUDIT_ACTION_COMMENT_CREATE: "Comment written",
    MessageKey.AUDIT_COMMENT_CREATED: "{username} commented on review #{review_id}.",
    MessageKey.AUDIT_COMMENT_CREATE_FAILED: "{username} could not comment on review #{review_id}: {reason}",
    MessageKey.AUDIT_ACTION_COMMENT_UPDATE: "Comment edited",
    MessageKey.AUDIT_COMMENT_UPDATED: "{username} edited comment #{comment_id}.",
    MessageKey.AUDIT_COMMENT_UPDATE_FAILED: "{username} could not edit comment #{comment_id}: {reason}",
    MessageKey.AUDIT_ACTION_COMMENT_DELETE: "Comment deleted",
    MessageKey.AUDIT_COMMENT_DELETED: "{username} deleted comment #{comment_id}.",
    MessageKey.AUDIT_COMMENT_DELETE_FAILED: "{username} could not delete comment #{comment_id}: {reason}",
    MessageKey.AUDIT_ACTION_REVIEW_LIKE: "Review liked",
    MessageKey.AUDIT_REVIEW_LIKED: "{username} liked review #{review_id}.",
    MessageKey.AUDIT_REVIEW_LIKE_FAILED: "{username} could not like review #{review_id}: {reason}",
    MessageKey.AUDIT_ACTION_REVIEW_UNLIKE: "Review like removed",
    MessageKey.AUDIT_REVIEW_UNLIKED: "{username} removed their like from review #{review_id}.",
    MessageKey.AUDIT_REVIEW_UNLIKE_FAILED: "{username} could not remove their like from review #{review_id}: {reason}",
    MessageKey.AUDIT_ACTION_COMMENT_LIKE: "Comment liked",
    MessageKey.AUDIT_COMMENT_LIKED: "{username} liked comment #{comment_id}.",
    MessageKey.AUDIT_COMMENT_LIKE_FAILED: "{username} could not like comment #{comment_id}: {reason}",
    MessageKey.AUDIT_ACTION_COMMENT_UNLIKE: "Comment like removed",
    MessageKey.AUDIT_COMMENT_UNLIKED: "{username} removed their like from comment #{comment_id}.",
    MessageKey.AUDIT_COMMENT_UNLIKE_FAILED: "{username} could not remove their like from comment #{comment_id}: {reason}",
    MessageKey.AUDIT_ACTION_READING_STATUS_SET: "Shelf changed",
    MessageKey.AUDIT_READING_STATUS_SET: "{username} put \"{title}\" on the shelf {status}.",
    MessageKey.AUDIT_READING_STATUS_SET_FAILED: "{username} could not change the shelf of book #{book_id}: {reason}",
    MessageKey.AUDIT_ACTION_READING_STATUS_REMOVE: "Removed from shelf",
    MessageKey.AUDIT_READING_STATUS_REMOVED: "{username} took \"{title}\" off their shelves.",
    MessageKey.AUDIT_READING_STATUS_REMOVE_FAILED: "{username} could not take book #{book_id} off their shelves: {reason}",
}

_KEYS = {key.value: key for key in MessageKey}


def as_message_key(value: str) -> MessageKey | None:
    return _KEYS.get(value)


def _english_param(value: MessageParam) -> str | int | float:
    if not isinstance(value, list):
        return value
    words = [ENGLISH[_KEYS[item]] if item in _KEYS else item for item in value]
    if len(words) <= 1:
        return "".join(words)
    return f"{', '.join(words[:-1])} and {words[-1]}"


def render_english(key: MessageKey, params: dict[str, MessageParam] | None = None) -> str:
    template = ENGLISH[key]
    if not params:
        return template
    try:
        return template.format(**{name: _english_param(value) for name, value in params.items()})
    except (KeyError, IndexError):
        return template


def clean_params(raw: dict[str, Any] | None) -> dict[str, MessageParam]:
    params: dict[str, MessageParam] = {}
    for name, value in (raw or {}).items():
        if isinstance(value, bool):
            params[name] = str(value).lower()
        elif isinstance(value, str | int | float):
            params[name] = value
        elif isinstance(value, list | tuple) and all(isinstance(item, str) for item in value):
            params[name] = list(value)
    return params


def key_error(key: MessageKey, **params: MessageParam) -> PydanticCustomError:
    return PydanticCustomError(key.value, render_english(key, params), {"params": params})
