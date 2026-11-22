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
    ACCOUNT_LOCKED = "users.accountLocked"
    ACCOUNT_BANNED = "users.accountBanned"
    ACCOUNT_SUSPENDED = "users.accountSuspended"
    USER_NOT_FOUND = "users.userNotFound"
    CANNOT_BAN_SELF = "users.cannotBanSelf"
    CANNOT_BAN_ADMIN = "users.cannotBanAdmin"

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
    DATE_IN_FUTURE = "validation.dateInFuture"
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
    READER_VOTE_EMPTY = "books.readerVoteEmpty"
    READER_VOTE_NOT_ALLOWED = "books.readerVoteNotAllowed"
    PAGES_RANGE_INVALID = "books.pagesRangeInvalid"
    RECOMMEND_BECAUSE_LIKED = "books.recommendBecauseLiked"
    RECOMMEND_SAME_AUTHOR = "books.recommendSameAuthor"
    RECOMMEND_FAVOURITE_GENRE = "books.recommendFavouriteGenre"
    RECOMMEND_TASTE = "books.recommendTaste"
    RECOMMEND_POPULAR = "books.recommendPopular"
    CONTENT_WARNING_DUPLICATE = "books.contentWarningDuplicate"
    CONTENT_WARNING_NOT_ALLOWED = "books.contentWarningNotAllowed"
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
    EDITION_NOT_FOUND = "reading.editionNotFound"
    EDITION_NOT_CREATOR = "reading.editionNotCreator"
    ISBN_EXISTS = "reading.isbnExists"
    EDITION_NOT_ON_BOOK = "reading.editionNotOnBook"
    SESSION_NOT_FOUND = "reading.sessionNotFound"
    SESSION_ALREADY_ACTIVE = "reading.sessionAlreadyActive"
    SESSION_ALREADY_ACTIVE_HINT = "reading.sessionAlreadyActiveHint"
    SESSION_NOT_ACTIVE = "reading.sessionNotActive"
    SESSION_ALREADY_PAUSED = "reading.sessionAlreadyPaused"
    SESSION_NOT_PAUSED = "reading.sessionNotPaused"
    READING_NOT_FOUND = "reading.readingNotFound"
    NOTE_NOT_FOUND = "reading.noteNotFound"
    PROGRESS_USE_PAGE = "reading.progressUsePage"
    PROGRESS_USE_PERCENT = "reading.progressUsePercent"
    PAGE_OUT_OF_RANGE = "reading.pageOutOfRange"
    PERCENT_OUT_OF_RANGE = "reading.percentOutOfRange"
    ENDED_BEFORE_START = "reading.endedBeforeStart"
    FINISHED_WHILE_ACTIVE = "reading.finishedWhileActive"
    TIMEZONE_INVALID = "reading.timezoneInvalid"

    CHALLENGE_EMPTY = "stats.challengeEmpty"
    CHALLENGE_NOT_FOUND = "stats.challengeNotFound"
    CHALLENGE_YEAR_TOO_FAR = "stats.challengeYearTooFar"

    GENRE_NOT_FOUND = "catalog.genreNotFound"
    AWARD_NOT_FOUND = "catalog.awardNotFound"
    LANGUAGE_EXISTS = "catalog.languageExists"
    COUNTRY_EXISTS = "catalog.countryExists"
    GENRE_EXISTS = "catalog.genreExists"
    AWARD_EXISTS = "catalog.awardExists"
    AWARD_YEAR_IN_FUTURE = "catalog.awardYearInFuture"

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
    IMPORT_ISBN_NOT_FOUND = "imports.isbnNotFound"
    IMPORT_SOURCE_UNAVAILABLE = "imports.sourceUnavailable"
    IMPORT_COVER_SKIPPED = "imports.coverSkipped"

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
    AUDIT_ACTION_BOOK_IMPORT = "audit.actions.bookImport"
    AUDIT_BOOK_IMPORTED = "audit.descriptions.bookImported"
    AUDIT_BOOK_IMPORT_FAILED = "audit.descriptions.bookImportFailed"
    AUDIT_ACTION_READER_VOTE_SET = "audit.actions.readerVoteSet"
    AUDIT_ACTION_READER_VOTE_REMOVE = "audit.actions.readerVoteRemove"
    AUDIT_READER_VOTE_SAVED = "audit.descriptions.readerVoteSaved"
    AUDIT_READER_VOTE_SAVE_FAILED = "audit.descriptions.readerVoteSaveFailed"
    AUDIT_READER_VOTE_REMOVED = "audit.descriptions.readerVoteRemoved"
    AUDIT_READER_VOTE_REMOVE_FAILED = "audit.descriptions.readerVoteRemoveFailed"
    AUDIT_ACTION_CONTENT_WARNINGS_SET = "audit.actions.contentWarningsSet"
    AUDIT_ACTION_CONTENT_WARNINGS_REMOVE = "audit.actions.contentWarningsRemove"
    AUDIT_CONTENT_WARNINGS_SAVED = "audit.descriptions.contentWarningsSaved"
    AUDIT_CONTENT_WARNINGS_SAVE_FAILED = "audit.descriptions.contentWarningsSaveFailed"
    AUDIT_CONTENT_WARNINGS_REMOVED = "audit.descriptions.contentWarningsRemoved"
    AUDIT_CONTENT_WARNINGS_REMOVE_FAILED = "audit.descriptions.contentWarningsRemoveFailed"
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
    AUDIT_ACTION_EDITION_CREATE = "audit.actions.editionCreate"
    AUDIT_EDITION_CREATED = "audit.descriptions.editionCreated"
    AUDIT_EDITION_CREATE_FAILED = "audit.descriptions.editionCreateFailed"
    AUDIT_ACTION_EDITION_UPDATE = "audit.actions.editionUpdate"
    AUDIT_EDITION_UPDATED = "audit.descriptions.editionUpdated"
    AUDIT_EDITION_UPDATE_FAILED = "audit.descriptions.editionUpdateFailed"
    AUDIT_ACTION_EDITION_DELETE = "audit.actions.editionDelete"
    AUDIT_EDITION_DELETED = "audit.descriptions.editionDeleted"
    AUDIT_EDITION_DELETE_FAILED = "audit.descriptions.editionDeleteFailed"
    AUDIT_ACTION_READING_SESSION_START = "audit.actions.readingSessionStart"
    AUDIT_READING_SESSION_STARTED = "audit.descriptions.readingSessionStarted"
    AUDIT_READING_SESSION_START_FAILED = "audit.descriptions.readingSessionStartFailed"
    AUDIT_ACTION_READING_SESSION_PAUSE = "audit.actions.readingSessionPause"
    AUDIT_READING_SESSION_PAUSED = "audit.descriptions.readingSessionPaused"
    AUDIT_READING_SESSION_PAUSE_FAILED = "audit.descriptions.readingSessionPauseFailed"
    AUDIT_ACTION_READING_SESSION_RESUME = "audit.actions.readingSessionResume"
    AUDIT_READING_SESSION_RESUMED = "audit.descriptions.readingSessionResumed"
    AUDIT_READING_SESSION_RESUME_FAILED = "audit.descriptions.readingSessionResumeFailed"
    AUDIT_ACTION_READING_SESSION_END = "audit.actions.readingSessionEnd"
    AUDIT_READING_SESSION_ENDED = "audit.descriptions.readingSessionEnded"
    AUDIT_READING_SESSION_END_FAILED = "audit.descriptions.readingSessionEndFailed"
    AUDIT_ACTION_READING_SESSION_DISCARD = "audit.actions.readingSessionDiscard"
    AUDIT_READING_SESSION_DISCARDED = "audit.descriptions.readingSessionDiscarded"
    AUDIT_READING_SESSION_DISCARD_FAILED = "audit.descriptions.readingSessionDiscardFailed"
    AUDIT_ACTION_READING_UPDATE = "audit.actions.readingUpdate"
    AUDIT_READING_UPDATED = "audit.descriptions.readingUpdated"
    AUDIT_READING_UPDATE_FAILED = "audit.descriptions.readingUpdateFailed"
    AUDIT_ACTION_READING_DELETE = "audit.actions.readingDelete"
    AUDIT_READING_DELETED = "audit.descriptions.readingDeleted"
    AUDIT_READING_DELETE_FAILED = "audit.descriptions.readingDeleteFailed"
    AUDIT_ACTION_READING_NOTE_CREATE = "audit.actions.readingNoteCreate"
    AUDIT_READING_NOTE_CREATED = "audit.descriptions.readingNoteCreated"
    AUDIT_READING_NOTE_CREATE_FAILED = "audit.descriptions.readingNoteCreateFailed"
    AUDIT_ACTION_READING_NOTE_UPDATE = "audit.actions.readingNoteUpdate"
    AUDIT_READING_NOTE_UPDATED = "audit.descriptions.readingNoteUpdated"
    AUDIT_READING_NOTE_UPDATE_FAILED = "audit.descriptions.readingNoteUpdateFailed"
    AUDIT_ACTION_READING_NOTE_DELETE = "audit.actions.readingNoteDelete"
    AUDIT_READING_NOTE_DELETED = "audit.descriptions.readingNoteDeleted"
    AUDIT_READING_NOTE_DELETE_FAILED = "audit.descriptions.readingNoteDeleteFailed"
    AUDIT_ACTION_READING_GOAL_SET = "audit.actions.readingGoalSet"
    AUDIT_READING_GOAL_SET = "audit.descriptions.readingGoalSet"
    AUDIT_READING_GOAL_SET_FAILED = "audit.descriptions.readingGoalSetFailed"
    AUDIT_ACTION_CHALLENGE_SET = "audit.actions.challengeSet"
    AUDIT_CHALLENGE_SET = "audit.descriptions.challengeSet"
    AUDIT_CHALLENGE_SET_FAILED = "audit.descriptions.challengeSetFailed"
    AUDIT_ACTION_CHALLENGE_DELETE = "audit.actions.challengeDelete"
    AUDIT_CHALLENGE_DELETED = "audit.descriptions.challengeDeleted"
    AUDIT_CHALLENGE_DELETE_FAILED = "audit.descriptions.challengeDeleteFailed"
    AUDIT_ACTION_AUTHOR_CREATE = "audit.actions.authorCreate"
    AUDIT_AUTHOR_CREATED = "audit.descriptions.authorCreated"
    AUDIT_AUTHOR_CREATE_FAILED = "audit.descriptions.authorCreateFailed"
    AUDIT_ACTION_AUTHOR_UPDATE = "audit.actions.authorUpdate"
    AUDIT_AUTHOR_UPDATED = "audit.descriptions.authorUpdated"
    AUDIT_AUTHOR_UPDATE_FAILED = "audit.descriptions.authorUpdateFailed"
    AUDIT_ACTION_AUTHOR_DELETE = "audit.actions.authorDelete"
    AUDIT_AUTHOR_DELETED = "audit.descriptions.authorDeleted"
    AUDIT_AUTHOR_DELETE_FAILED = "audit.descriptions.authorDeleteFailed"
    AUDIT_ACTION_LANGUAGE_CREATE = "audit.actions.languageCreate"
    AUDIT_LANGUAGE_CREATED = "audit.descriptions.languageCreated"
    AUDIT_LANGUAGE_CREATE_FAILED = "audit.descriptions.languageCreateFailed"
    AUDIT_ACTION_LANGUAGE_UPDATE = "audit.actions.languageUpdate"
    AUDIT_LANGUAGE_UPDATED = "audit.descriptions.languageUpdated"
    AUDIT_LANGUAGE_UPDATE_FAILED = "audit.descriptions.languageUpdateFailed"
    AUDIT_ACTION_LANGUAGE_DELETE = "audit.actions.languageDelete"
    AUDIT_LANGUAGE_DELETED = "audit.descriptions.languageDeleted"
    AUDIT_LANGUAGE_DELETE_FAILED = "audit.descriptions.languageDeleteFailed"
    AUDIT_ACTION_COUNTRY_CREATE = "audit.actions.countryCreate"
    AUDIT_COUNTRY_CREATED = "audit.descriptions.countryCreated"
    AUDIT_COUNTRY_CREATE_FAILED = "audit.descriptions.countryCreateFailed"
    AUDIT_ACTION_COUNTRY_UPDATE = "audit.actions.countryUpdate"
    AUDIT_COUNTRY_UPDATED = "audit.descriptions.countryUpdated"
    AUDIT_COUNTRY_UPDATE_FAILED = "audit.descriptions.countryUpdateFailed"
    AUDIT_ACTION_COUNTRY_DELETE = "audit.actions.countryDelete"
    AUDIT_COUNTRY_DELETED = "audit.descriptions.countryDeleted"
    AUDIT_COUNTRY_DELETE_FAILED = "audit.descriptions.countryDeleteFailed"
    AUDIT_ACTION_GENRE_CREATE = "audit.actions.genreCreate"
    AUDIT_GENRE_CREATED = "audit.descriptions.genreCreated"
    AUDIT_GENRE_CREATE_FAILED = "audit.descriptions.genreCreateFailed"
    AUDIT_ACTION_GENRE_UPDATE = "audit.actions.genreUpdate"
    AUDIT_GENRE_UPDATED = "audit.descriptions.genreUpdated"
    AUDIT_GENRE_UPDATE_FAILED = "audit.descriptions.genreUpdateFailed"
    AUDIT_ACTION_GENRE_DELETE = "audit.actions.genreDelete"
    AUDIT_GENRE_DELETED = "audit.descriptions.genreDeleted"
    AUDIT_GENRE_DELETE_FAILED = "audit.descriptions.genreDeleteFailed"
    AUDIT_ACTION_AWARD_CREATE = "audit.actions.awardCreate"
    AUDIT_AWARD_CREATED = "audit.descriptions.awardCreated"
    AUDIT_AWARD_CREATE_FAILED = "audit.descriptions.awardCreateFailed"
    AUDIT_ACTION_AWARD_UPDATE = "audit.actions.awardUpdate"
    AUDIT_AWARD_UPDATED = "audit.descriptions.awardUpdated"
    AUDIT_AWARD_UPDATE_FAILED = "audit.descriptions.awardUpdateFailed"
    AUDIT_ACTION_AWARD_DELETE = "audit.actions.awardDelete"
    AUDIT_AWARD_DELETED = "audit.descriptions.awardDeleted"
    AUDIT_AWARD_DELETE_FAILED = "audit.descriptions.awardDeleteFailed"

    INTENT_NOT_FOUND = "chatbot.intentNotFound"
    INTENT_EXISTS = "chatbot.intentExists"
    INTENT_TAG_PATTERN = "chatbot.tagPattern"
    PATTERN_NOT_FOUND = "chatbot.patternNotFound"
    PATTERN_EXISTS = "chatbot.patternExists"
    RESPONSE_NOT_FOUND = "chatbot.responseNotFound"
    RESPONSE_EXISTS = "chatbot.responseExists"
    UNKNOWN_MESSAGE_NOT_FOUND = "chatbot.unknownNotFound"
    CONVERSATION_NOT_FOUND = "chatbot.conversationNotFound"
    MESSAGE_NOT_FOUND = "chatbot.messageNotFound"
    FEEDBACK_NOT_FOUND = "chatbot.feedbackNotFound"
    FEEDBACK_NO_QUESTION = "chatbot.feedbackNoQuestion"
    CHATBOT_NOT_TRAINED = "chatbot.notTrained"
    CHATBOT_NOT_TRAINED_HINT = "chatbot.notTrainedHint"
    CHATBOT_UNAVAILABLE = "chatbot.unavailable"
    TRAINING_IN_PROGRESS = "chatbot.trainingInProgress"
    TRAINING_NOT_ENOUGH_INTENTS = "chatbot.trainingNotEnoughIntents"
    TRAINING_FAILED = "chatbot.trainingFailed"
    REPLY_FALLBACK_REPHRASE = "chatbot.replies.fallbackRephrase"
    REPLY_FALLBACK_TOPICS = "chatbot.replies.fallbackTopics"
    REPLY_FALLBACK_LEARNING = "chatbot.replies.fallbackLearning"
    REPLY_NO_RESPONSE = "chatbot.replies.noResponse"
    REPLY_SIMILAR_ASK = "chatbot.replies.similarAsk"
    REPLY_SIMILAR_NONE = "chatbot.replies.similarNone"
    REPLY_SIMILAR_NONE_UNREAD = "chatbot.replies.similarNoneUnread"
    REPLY_SIMILAR_FOUND = "chatbot.replies.similarFound"
    REPLY_SIMILAR_FOUND_MOOD = "chatbot.replies.similarFoundMood"
    REPLY_GENRE_ASK = "chatbot.replies.genreAsk"
    REPLY_GENRE_MISSING = "chatbot.replies.genreMissing"
    REPLY_GENRE_NONE = "chatbot.replies.genreNone"
    REPLY_GENRE_FOUND = "chatbot.replies.genreFound"
    REPLY_GENRE_FOUND_MOOD = "chatbot.replies.genreFoundMood"
    REPLY_MOOD_ASK = "chatbot.replies.moodAsk"
    REPLY_MOOD_NONE = "chatbot.replies.moodNone"
    REPLY_MOOD_FOUND = "chatbot.replies.moodFound"
    REPLY_AUTHOR_ASK = "chatbot.replies.authorAsk"
    REPLY_AUTHOR_NO_BOOKS = "chatbot.replies.authorNoBooks"
    REPLY_AUTHOR_BOOKS = "chatbot.replies.authorBooks"
    REPLY_AUTHOR_RATING = "chatbot.replies.authorRating"
    REPLY_BOOK_ASK = "chatbot.replies.bookAsk"
    REPLY_BOOK_INFO = "chatbot.replies.bookInfo"
    REPLY_BOOK_INFO_NO_AUTHOR = "chatbot.replies.bookInfoNoAuthor"
    REPLY_BOOK_GENRES = "chatbot.replies.bookGenres"
    REPLY_BOOK_RATING = "chatbot.replies.bookRating"
    REPLY_BOOK_TRAITS = "chatbot.replies.bookTraits"
    REPLY_SEARCH_ASK = "chatbot.replies.searchAsk"
    REPLY_UNREAD_NO_HISTORY = "chatbot.replies.unreadNoHistory"
    REPLY_UNREAD_NONE = "chatbot.replies.unreadNone"
    REPLY_UNREAD_FOUND = "chatbot.replies.unreadFound"
    REPLY_TOP_RATED_NONE = "chatbot.replies.topRatedNone"
    REPLY_TOP_RATED_FOUND = "chatbot.replies.topRatedFound"
    REPLY_TOP_RATED_GENRE_FOUND = "chatbot.replies.topRatedGenreFound"
    REPLY_BY_AUTHOR_ASK = "chatbot.replies.byAuthorAsk"
    REPLY_BY_AUTHOR_UNREAD = "chatbot.replies.byAuthorUnread"
    REPLY_BY_AUTHOR_NONE = "chatbot.replies.byAuthorNone"
    REPLY_BY_AUTHOR_SIMILAR = "chatbot.replies.byAuthorSimilar"
    TRAIT_DARK = "chatbot.traits.dark"
    TRAIT_SLOW_BURN = "chatbot.traits.slowBurn"
    TRAIT_FOUND_FAMILY = "chatbot.traits.foundFamily"
    TRAIT_FAST_PACED = "chatbot.traits.fastPaced"
    TRAIT_LYRICAL_PROSE = "chatbot.traits.lyricalProse"
    TRAIT_MORALLY_GREY = "chatbot.traits.morallyGrey"
    TRAIT_HARD_SCI_FI = "chatbot.traits.hardSciFi"
    AUDIT_ACTION_CHATBOT_INTENT_CREATE = "audit.actions.chatbotIntentCreate"
    AUDIT_CHATBOT_INTENT_CREATE_DONE = "audit.descriptions.chatbotIntentCreated"
    AUDIT_CHATBOT_INTENT_CREATE_FAILED = "audit.descriptions.chatbotIntentCreateFailed"
    AUDIT_ACTION_CHATBOT_INTENT_UPDATE = "audit.actions.chatbotIntentUpdate"
    AUDIT_CHATBOT_INTENT_UPDATE_DONE = "audit.descriptions.chatbotIntentUpdated"
    AUDIT_CHATBOT_INTENT_UPDATE_FAILED = "audit.descriptions.chatbotIntentUpdateFailed"
    AUDIT_ACTION_CHATBOT_INTENT_DELETE = "audit.actions.chatbotIntentDelete"
    AUDIT_CHATBOT_INTENT_DELETE_DONE = "audit.descriptions.chatbotIntentDeleted"
    AUDIT_CHATBOT_INTENT_DELETE_FAILED = "audit.descriptions.chatbotIntentDeleteFailed"
    AUDIT_ACTION_CHATBOT_PATTERN_CREATE = "audit.actions.chatbotPatternCreate"
    AUDIT_CHATBOT_PATTERN_CREATE_DONE = "audit.descriptions.chatbotPatternCreated"
    AUDIT_CHATBOT_PATTERN_CREATE_FAILED = "audit.descriptions.chatbotPatternCreateFailed"
    AUDIT_ACTION_CHATBOT_PATTERN_UPDATE = "audit.actions.chatbotPatternUpdate"
    AUDIT_CHATBOT_PATTERN_UPDATE_DONE = "audit.descriptions.chatbotPatternUpdated"
    AUDIT_CHATBOT_PATTERN_UPDATE_FAILED = "audit.descriptions.chatbotPatternUpdateFailed"
    AUDIT_ACTION_CHATBOT_PATTERN_DELETE = "audit.actions.chatbotPatternDelete"
    AUDIT_CHATBOT_PATTERN_DELETE_DONE = "audit.descriptions.chatbotPatternDeleted"
    AUDIT_CHATBOT_PATTERN_DELETE_FAILED = "audit.descriptions.chatbotPatternDeleteFailed"
    AUDIT_ACTION_CHATBOT_RESPONSE_CREATE = "audit.actions.chatbotResponseCreate"
    AUDIT_CHATBOT_RESPONSE_CREATE_DONE = "audit.descriptions.chatbotResponseCreated"
    AUDIT_CHATBOT_RESPONSE_CREATE_FAILED = "audit.descriptions.chatbotResponseCreateFailed"
    AUDIT_ACTION_CHATBOT_RESPONSE_UPDATE = "audit.actions.chatbotResponseUpdate"
    AUDIT_CHATBOT_RESPONSE_UPDATE_DONE = "audit.descriptions.chatbotResponseUpdated"
    AUDIT_CHATBOT_RESPONSE_UPDATE_FAILED = "audit.descriptions.chatbotResponseUpdateFailed"
    AUDIT_ACTION_CHATBOT_RESPONSE_DELETE = "audit.actions.chatbotResponseDelete"
    AUDIT_CHATBOT_RESPONSE_DELETE_DONE = "audit.descriptions.chatbotResponseDeleted"
    AUDIT_CHATBOT_RESPONSE_DELETE_FAILED = "audit.descriptions.chatbotResponseDeleteFailed"
    AUDIT_ACTION_CHATBOT_UNKNOWN_DELETE = "audit.actions.chatbotUnknownDelete"
    AUDIT_CHATBOT_UNKNOWN_DELETE_DONE = "audit.descriptions.chatbotUnknownDeleted"
    AUDIT_CHATBOT_UNKNOWN_DELETE_FAILED = "audit.descriptions.chatbotUnknownDeleteFailed"
    AUDIT_ACTION_CHATBOT_UNKNOWN_PROMOTE = "audit.actions.chatbotUnknownPromote"
    AUDIT_CHATBOT_UNKNOWN_PROMOTE_DONE = "audit.descriptions.chatbotUnknownPromoted"
    AUDIT_CHATBOT_UNKNOWN_PROMOTE_FAILED = "audit.descriptions.chatbotUnknownPromoteFailed"
    AUDIT_ACTION_CHATBOT_TRAIN = "audit.actions.chatbotTrain"
    AUDIT_CHATBOT_TRAIN_DONE = "audit.descriptions.chatbotTrained"
    AUDIT_CHATBOT_TRAIN_FAILED = "audit.descriptions.chatbotTrainFailed"
    REPLY_SHORT_FOUND = "chatbot.replies.shortFound"
    REPLY_SHORT_NONE = "chatbot.replies.shortNone"
    REPLY_SERIES_FOUND = "chatbot.replies.seriesFound"
    REPLY_SERIES_GENRE_FOUND = "chatbot.replies.seriesGenreFound"
    REPLY_SERIES_NONE = "chatbot.replies.seriesNone"
    REPLY_LENGTH_ASK = "chatbot.replies.lengthAsk"
    REPLY_LENGTH = "chatbot.replies.length"
    REPLY_LENGTH_UNKNOWN = "chatbot.replies.lengthUnknown"
    REPLY_GENRE_INFO = "chatbot.replies.genreInfo"
    REPLY_GENRE_INFO_EMPTY = "chatbot.replies.genreInfoEmpty"
    REPLY_SHELVES = "chatbot.replies.shelves"
    REPLY_SHELVES_READING = "chatbot.replies.shelvesReading"
    REPLY_SHELVES_NEXT = "chatbot.replies.shelvesNext"
    REPLY_SHELVES_EMPTY = "chatbot.replies.shelvesEmpty"
    AUDIT_ACTION_CHATBOT_SEED = "audit.actions.chatbotSeed"
    AUDIT_CHATBOT_SEED_DONE = "audit.descriptions.chatbotSeeded"
    AUDIT_CHATBOT_SEED_FAILED = "audit.descriptions.chatbotSeedFailed"
    REPLY_NO_MORE = "chatbot.replies.noMore"
    REPLY_FOLLOW_UP_NOTHING = "chatbot.replies.followUpNothing"
    REPLY_MORE_FOUND = "chatbot.replies.moreFound"
    SUGGEST_MORE = "chatbot.suggestions.more"
    SUGGEST_SHORTER = "chatbot.suggestions.shorter"
    SUGGEST_RECOMMEND = "chatbot.suggestions.recommend"
    SUGGEST_HELP = "chatbot.suggestions.help"
    SUGGEST_SHELVES = "chatbot.suggestions.shelves"
    SUGGEST_GENRE = "chatbot.suggestions.genre"
    SUGGEST_MOOD_DARK = "chatbot.suggestions.moodDark"
    SUGGEST_MOOD_FUNNY = "chatbot.suggestions.moodFunny"
    SUGGEST_MOOD_EMOTIONAL = "chatbot.suggestions.moodEmotional"
    SUGGEST_MOOD_TENSE = "chatbot.suggestions.moodTense"
    SUGGEST_STATS = "chatbot.suggestions.stats"
    REPLY_TASTE_FOUND = "chatbot.replies.tasteFound"
    REPLY_TASTE_NONE = "chatbot.replies.tasteNone"
    REPLY_TASTE_EMPTY = "chatbot.replies.tasteEmpty"
    REPLY_STATS_EMPTY = "chatbot.replies.statsEmpty"
    REPLY_STATS_YEAR = "chatbot.replies.statsYear"
    REPLY_STATS_CHALLENGE = "chatbot.replies.statsChallenge"
    REPLY_STATS_NO_CHALLENGE = "chatbot.replies.statsNoChallenge"
    REPLY_STATS_STREAK = "chatbot.replies.statsStreak"
    REPLY_STATS_GENRE = "chatbot.replies.statsGenre"
    STATS_METRIC_BOOKS = "chatbot.metrics.books"
    STATS_METRIC_PAGES = "chatbot.metrics.pages"
    STATS_METRIC_HOURS = "chatbot.metrics.hours"
    STATS_PACE_AHEAD = "chatbot.pace.ahead"
    STATS_PACE_ON_TRACK = "chatbot.pace.onTrack"
    STATS_PACE_BEHIND = "chatbot.pace.behind"
    STATS_PACE_COMPLETED = "chatbot.pace.completed"
    STATS_PACE_MISSED = "chatbot.pace.missed"
    AUDIT_ACTION_CHATBOT_CONVERSATION_DELETE = "audit.actions.chatbotConversationDelete"
    AUDIT_CHATBOT_CONVERSATION_DELETE_DONE = "audit.descriptions.chatbotConversationDeleted"
    AUDIT_CHATBOT_CONVERSATION_DELETE_FAILED = "audit.descriptions.chatbotConversationDeleteFailed"
    AUDIT_ACTION_CHATBOT_FEEDBACK = "audit.actions.chatbotFeedback"
    AUDIT_CHATBOT_FEEDBACK_DONE = "audit.descriptions.chatbotFeedbackGiven"
    AUDIT_CHATBOT_FEEDBACK_FAILED = "audit.descriptions.chatbotFeedbackFailed"
    AUDIT_ACTION_CHATBOT_FEEDBACK_PROMOTE = "audit.actions.chatbotFeedbackPromote"
    AUDIT_CHATBOT_FEEDBACK_PROMOTE_DONE = "audit.descriptions.chatbotFeedbackPromoted"
    AUDIT_CHATBOT_FEEDBACK_PROMOTE_FAILED = "audit.descriptions.chatbotFeedbackPromoteFailed"
    AUDIT_ACTION_CHATBOT_FEEDBACK_DISMISS = "audit.actions.chatbotFeedbackDismiss"
    AUDIT_CHATBOT_FEEDBACK_DISMISS_DONE = "audit.descriptions.chatbotFeedbackDismissed"
    AUDIT_CHATBOT_FEEDBACK_DISMISS_FAILED = "audit.descriptions.chatbotFeedbackDismissFailed"
    AUDIT_ACTION_CHATBOT_IMPORT = "audit.actions.chatbotImport"
    AUDIT_CHATBOT_IMPORT_DONE = "audit.descriptions.chatbotImported"
    AUDIT_CHATBOT_IMPORT_FAILED = "audit.descriptions.chatbotImportFailed"
    AUDIT_ACTION_USER_AVATAR_UPDATE = "audit.actions.userAvatarUpdate"
    AUDIT_USER_AVATAR_UPDATE_DONE = "audit.descriptions.userAvatarUpdated"
    AUDIT_USER_AVATAR_UPDATE_FAILED = "audit.descriptions.userAvatarUpdateFailed"
    AUDIT_ACTION_USER_AVATAR_REMOVE = "audit.actions.userAvatarRemove"
    AUDIT_USER_AVATAR_REMOVE_DONE = "audit.descriptions.userAvatarRemoved"
    AUDIT_USER_AVATAR_REMOVE_FAILED = "audit.descriptions.userAvatarRemoveFailed"
    AUDIT_ACTION_USER_BAN = "audit.actions.userBan"
    AUDIT_USER_BAN_DONE = "audit.descriptions.userBanned"
    AUDIT_USER_BAN_FAILED = "audit.descriptions.userBanFailed"
    AUDIT_ACTION_USER_UNBAN = "audit.actions.userUnban"
    AUDIT_USER_UNBAN_DONE = "audit.descriptions.userUnbanned"
    AUDIT_USER_UNBAN_FAILED = "audit.descriptions.userUnbanFailed"


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
    MessageKey.ACCOUNT_LOCKED: "Too many failed login attempts. Try again in {minutes} min.",
    MessageKey.ACCOUNT_BANNED: "Your account has been banned. Reason: {reason}",
    MessageKey.ACCOUNT_SUSPENDED: "Your account is suspended until {until}. Reason: {reason}",
    MessageKey.USER_NOT_FOUND: "This user doesn't exist.",
    MessageKey.CANNOT_BAN_SELF: "You can't ban your own account.",
    MessageKey.CANNOT_BAN_ADMIN: "Administrators can't be banned.",
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
    MessageKey.DATE_IN_FUTURE: "The date can't be in the future.",
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
    MessageKey.READER_VOTE_EMPTY: "Choose at least one mood or a pace.",
    MessageKey.READER_VOTE_NOT_ALLOWED: "Mark the book as currently reading, read or did not finish before describing its mood and pace.",
    MessageKey.PAGES_RANGE_INVALID: "The maximum number of pages must be at least the minimum.",
    MessageKey.RECOMMEND_BECAUSE_LIKED: "Because you enjoyed \"{title}\"",
    MessageKey.RECOMMEND_SAME_AUTHOR: "More from {name}",
    MessageKey.RECOMMEND_FAVOURITE_GENRE: "One of your favourite genres: {genre}",
    MessageKey.RECOMMEND_TASTE: "Matches what you've enjoyed",
    MessageKey.RECOMMEND_POPULAR: "Popular with readers",
    MessageKey.CONTENT_WARNING_DUPLICATE: "Report each content warning only once.",
    MessageKey.CONTENT_WARNING_NOT_ALLOWED: "Mark the book as currently reading, read or did not finish before reporting content warnings.",
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
    MessageKey.EDITION_NOT_FOUND: "This edition doesn't exist or was removed.",
    MessageKey.EDITION_NOT_CREATOR: "Only the person who added this edition or an admin can change it.",
    MessageKey.ISBN_EXISTS: "Another edition already uses this ISBN.",
    MessageKey.EDITION_NOT_ON_BOOK: "This edition belongs to another book.",
    MessageKey.SESSION_NOT_FOUND: "This reading session doesn't exist or was removed.",
    MessageKey.SESSION_ALREADY_ACTIVE: "You already have a reading session running.",
    MessageKey.SESSION_ALREADY_ACTIVE_HINT: "End or discard it before starting a new one.",
    MessageKey.SESSION_NOT_ACTIVE: "This reading session has already ended.",
    MessageKey.SESSION_ALREADY_PAUSED: "This reading session is already paused.",
    MessageKey.SESSION_NOT_PAUSED: "This reading session isn't paused.",
    MessageKey.READING_NOT_FOUND: "This read-through doesn't exist or was removed.",
    MessageKey.NOTE_NOT_FOUND: "This note doesn't exist or was removed.",
    MessageKey.PROGRESS_USE_PAGE: "This edition tracks progress by page.",
    MessageKey.PROGRESS_USE_PERCENT: "This edition tracks progress as a percentage.",
    MessageKey.PAGE_OUT_OF_RANGE: "Enter a page between {min} and {max}.",
    MessageKey.PERCENT_OUT_OF_RANGE: "Enter a percentage between {min} and {max}.",
    MessageKey.ENDED_BEFORE_START: "The end time can't be before the session started.",
    MessageKey.FINISHED_WHILE_ACTIVE: "This read-through is still in progress. Mark the book as read to set a finish date.",
    MessageKey.TIMEZONE_INVALID: "Use a time zone such as Europe/Bucharest.",
    MessageKey.CHALLENGE_EMPTY: "Set at least one target: books, pages or hours.",
    MessageKey.CHALLENGE_NOT_FOUND: "You have no reading challenge for {year}.",
    MessageKey.CHALLENGE_YEAR_TOO_FAR: "You can set a challenge up to {max}.",
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
    MessageKey.IMPORT_ISBN_NOT_FOUND: "Open Library has no book with ISBN {isbn}.",
    MessageKey.IMPORT_SOURCE_UNAVAILABLE: "Open Library could not be reached. Try again in a moment.",
    MessageKey.IMPORT_COVER_SKIPPED: "The cover could not be downloaded, so the book was added without it.",
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
    MessageKey.AUDIT_ACTION_BOOK_IMPORT: "Book imported by ISBN",
    MessageKey.AUDIT_BOOK_IMPORTED: "{username} imported \"{title}\" (ISBN {isbn}) from Open Library.",
    MessageKey.AUDIT_BOOK_IMPORT_FAILED: "{username} could not import ISBN {isbn}: {reason}",
    MessageKey.AUDIT_ACTION_READER_VOTE_SET: "Mood and pace vote",
    MessageKey.AUDIT_ACTION_READER_VOTE_REMOVE: "Mood and pace vote removed",
    MessageKey.AUDIT_READER_VOTE_SAVED: "{username} described the mood and pace of \"{title}\".",
    MessageKey.AUDIT_READER_VOTE_SAVE_FAILED: "{username} could not describe the mood and pace of book #{book_id}: {reason}",
    MessageKey.AUDIT_READER_VOTE_REMOVED: "{username} removed their mood and pace vote for \"{title}\".",
    MessageKey.AUDIT_READER_VOTE_REMOVE_FAILED: "{username} could not remove their mood and pace vote for book #{book_id}: {reason}",
    MessageKey.AUDIT_ACTION_CONTENT_WARNINGS_SET: "Content warnings reported",
    MessageKey.AUDIT_ACTION_CONTENT_WARNINGS_REMOVE: "Content warnings removed",
    MessageKey.AUDIT_CONTENT_WARNINGS_SAVED: "{username} reported content warnings for \"{title}\".",
    MessageKey.AUDIT_CONTENT_WARNINGS_SAVE_FAILED: "{username} could not report content warnings for book #{book_id}: {reason}",
    MessageKey.AUDIT_CONTENT_WARNINGS_REMOVED: "{username} removed their content warnings for \"{title}\".",
    MessageKey.AUDIT_CONTENT_WARNINGS_REMOVE_FAILED: "{username} could not remove their content warnings for book #{book_id}: {reason}",
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
    MessageKey.AUDIT_ACTION_EDITION_CREATE: "Edition added",
    MessageKey.AUDIT_EDITION_CREATED: "{username} added edition #{edition_id} of \"{title}\".",
    MessageKey.AUDIT_EDITION_CREATE_FAILED: "{username} could not add an edition of book #{book_id}: {reason}",
    MessageKey.AUDIT_ACTION_EDITION_UPDATE: "Edition edited",
    MessageKey.AUDIT_EDITION_UPDATED: "{username} edited edition #{edition_id} of \"{title}\".",
    MessageKey.AUDIT_EDITION_UPDATE_FAILED: "{username} could not edit edition #{edition_id}: {reason}",
    MessageKey.AUDIT_ACTION_EDITION_DELETE: "Edition deleted",
    MessageKey.AUDIT_EDITION_DELETED: "{username} deleted edition #{edition_id} of \"{title}\".",
    MessageKey.AUDIT_EDITION_DELETE_FAILED: "{username} could not delete edition #{edition_id}: {reason}",
    MessageKey.AUDIT_ACTION_READING_SESSION_START: "Reading session started",
    MessageKey.AUDIT_READING_SESSION_STARTED: "{username} started a reading session of \"{title}\".",
    MessageKey.AUDIT_READING_SESSION_START_FAILED: "{username} could not start a reading session of book #{book_id}: {reason}",
    MessageKey.AUDIT_ACTION_READING_SESSION_PAUSE: "Reading session paused",
    MessageKey.AUDIT_READING_SESSION_PAUSED: "{username} paused reading session #{session_id} of \"{title}\".",
    MessageKey.AUDIT_READING_SESSION_PAUSE_FAILED: "{username} could not pause reading session #{session_id}: {reason}",
    MessageKey.AUDIT_ACTION_READING_SESSION_RESUME: "Reading session resumed",
    MessageKey.AUDIT_READING_SESSION_RESUMED: "{username} resumed reading session #{session_id} of \"{title}\".",
    MessageKey.AUDIT_READING_SESSION_RESUME_FAILED: "{username} could not resume reading session #{session_id}: {reason}",
    MessageKey.AUDIT_ACTION_READING_SESSION_END: "Reading session ended",
    MessageKey.AUDIT_READING_SESSION_ENDED: "{username} ended reading session #{session_id} of \"{title}\".",
    MessageKey.AUDIT_READING_SESSION_END_FAILED: "{username} could not end reading session #{session_id}: {reason}",
    MessageKey.AUDIT_ACTION_READING_SESSION_DISCARD: "Reading session discarded",
    MessageKey.AUDIT_READING_SESSION_DISCARDED: "{username} discarded reading session #{session_id} of \"{title}\".",
    MessageKey.AUDIT_READING_SESSION_DISCARD_FAILED: "{username} could not discard reading session #{session_id}: {reason}",
    MessageKey.AUDIT_ACTION_READING_UPDATE: "Read-through edited",
    MessageKey.AUDIT_READING_UPDATED: "{username} edited read-through #{reading_id} of \"{title}\".",
    MessageKey.AUDIT_READING_UPDATE_FAILED: "{username} could not edit read-through #{reading_id}: {reason}",
    MessageKey.AUDIT_ACTION_READING_DELETE: "Read-through deleted",
    MessageKey.AUDIT_READING_DELETED: "{username} deleted read-through #{reading_id} of \"{title}\".",
    MessageKey.AUDIT_READING_DELETE_FAILED: "{username} could not delete read-through #{reading_id}: {reason}",
    MessageKey.AUDIT_ACTION_READING_NOTE_CREATE: "Reading note added",
    MessageKey.AUDIT_READING_NOTE_CREATED: "{username} added a note to read-through #{reading_id} of \"{title}\".",
    MessageKey.AUDIT_READING_NOTE_CREATE_FAILED: "{username} could not add a note to read-through #{reading_id}: {reason}",
    MessageKey.AUDIT_ACTION_READING_NOTE_UPDATE: "Reading note edited",
    MessageKey.AUDIT_READING_NOTE_UPDATED: "{username} edited note #{note_id} on \"{title}\".",
    MessageKey.AUDIT_READING_NOTE_UPDATE_FAILED: "{username} could not edit note #{note_id}: {reason}",
    MessageKey.AUDIT_ACTION_READING_NOTE_DELETE: "Reading note deleted",
    MessageKey.AUDIT_READING_NOTE_DELETED: "{username} deleted note #{note_id} on \"{title}\".",
    MessageKey.AUDIT_READING_NOTE_DELETE_FAILED: "{username} could not delete note #{note_id}: {reason}",
    MessageKey.AUDIT_ACTION_READING_GOAL_SET: "Daily reading goal changed",
    MessageKey.AUDIT_READING_GOAL_SET: "{username} changed their daily reading goal.",
    MessageKey.AUDIT_READING_GOAL_SET_FAILED: "{username} could not change their daily reading goal: {reason}",
    MessageKey.AUDIT_ACTION_CHALLENGE_SET: "Reading challenge set",
    MessageKey.AUDIT_CHALLENGE_SET: "{username} set their {year} reading challenge.",
    MessageKey.AUDIT_CHALLENGE_SET_FAILED: "{username} could not set their {year} reading challenge: {reason}",
    MessageKey.AUDIT_ACTION_CHALLENGE_DELETE: "Reading challenge deleted",
    MessageKey.AUDIT_CHALLENGE_DELETED: "{username} deleted their {year} reading challenge.",
    MessageKey.AUDIT_CHALLENGE_DELETE_FAILED: "{username} could not delete their {year} reading challenge: {reason}",
    MessageKey.AUDIT_ACTION_AUTHOR_CREATE: "Author added",
    MessageKey.AUDIT_AUTHOR_CREATED: "{username} added the author \"{name}\".",
    MessageKey.AUDIT_AUTHOR_CREATE_FAILED: "{username} could not add the author \"{name}\": {reason}",
    MessageKey.AUDIT_ACTION_AUTHOR_UPDATE: "Author edited",
    MessageKey.AUDIT_AUTHOR_UPDATED: "{username} edited the author \"{name}\".",
    MessageKey.AUDIT_AUTHOR_UPDATE_FAILED: "{username} could not edit author #{author_id}: {reason}",
    MessageKey.AUDIT_ACTION_AUTHOR_DELETE: "Author deleted",
    MessageKey.AUDIT_AUTHOR_DELETED: "{username} deleted the author \"{name}\".",
    MessageKey.AUDIT_AUTHOR_DELETE_FAILED: "{username} could not delete author #{author_id}: {reason}",
    MessageKey.AUDIT_ACTION_LANGUAGE_CREATE: "Language added",
    MessageKey.AUDIT_LANGUAGE_CREATED: "{username} added the language \"{name}\".",
    MessageKey.AUDIT_LANGUAGE_CREATE_FAILED: "{username} could not add the language \"{name}\": {reason}",
    MessageKey.AUDIT_ACTION_LANGUAGE_UPDATE: "Language edited",
    MessageKey.AUDIT_LANGUAGE_UPDATED: "{username} edited the language \"{name}\".",
    MessageKey.AUDIT_LANGUAGE_UPDATE_FAILED: "{username} could not edit language #{language_id}: {reason}",
    MessageKey.AUDIT_ACTION_LANGUAGE_DELETE: "Language deleted",
    MessageKey.AUDIT_LANGUAGE_DELETED: "{username} deleted the language \"{name}\".",
    MessageKey.AUDIT_LANGUAGE_DELETE_FAILED: "{username} could not delete language #{language_id}: {reason}",
    MessageKey.AUDIT_ACTION_COUNTRY_CREATE: "Country added",
    MessageKey.AUDIT_COUNTRY_CREATED: "{username} added the country \"{name}\".",
    MessageKey.AUDIT_COUNTRY_CREATE_FAILED: "{username} could not add the country \"{name}\": {reason}",
    MessageKey.AUDIT_ACTION_COUNTRY_UPDATE: "Country edited",
    MessageKey.AUDIT_COUNTRY_UPDATED: "{username} edited the country \"{name}\".",
    MessageKey.AUDIT_COUNTRY_UPDATE_FAILED: "{username} could not edit country #{country_id}: {reason}",
    MessageKey.AUDIT_ACTION_COUNTRY_DELETE: "Country deleted",
    MessageKey.AUDIT_COUNTRY_DELETED: "{username} deleted the country \"{name}\".",
    MessageKey.AUDIT_COUNTRY_DELETE_FAILED: "{username} could not delete country #{country_id}: {reason}",
    MessageKey.AUDIT_ACTION_GENRE_CREATE: "Genre added",
    MessageKey.AUDIT_GENRE_CREATED: "{username} added the genre \"{name}\".",
    MessageKey.AUDIT_GENRE_CREATE_FAILED: "{username} could not add the genre \"{name}\": {reason}",
    MessageKey.AUDIT_ACTION_GENRE_UPDATE: "Genre edited",
    MessageKey.AUDIT_GENRE_UPDATED: "{username} edited the genre \"{name}\".",
    MessageKey.AUDIT_GENRE_UPDATE_FAILED: "{username} could not edit genre #{genre_id}: {reason}",
    MessageKey.AUDIT_ACTION_GENRE_DELETE: "Genre deleted",
    MessageKey.AUDIT_GENRE_DELETED: "{username} deleted the genre \"{name}\".",
    MessageKey.AUDIT_GENRE_DELETE_FAILED: "{username} could not delete genre #{genre_id}: {reason}",
    MessageKey.AUDIT_ACTION_AWARD_CREATE: "Award added",
    MessageKey.AUDIT_AWARD_CREATED: "{username} added the award \"{name}\".",
    MessageKey.AUDIT_AWARD_CREATE_FAILED: "{username} could not add the award \"{name}\": {reason}",
    MessageKey.AUDIT_ACTION_AWARD_UPDATE: "Award edited",
    MessageKey.AUDIT_AWARD_UPDATED: "{username} edited the award \"{name}\".",
    MessageKey.AUDIT_AWARD_UPDATE_FAILED: "{username} could not edit award #{award_id}: {reason}",
    MessageKey.AUDIT_ACTION_AWARD_DELETE: "Award deleted",
    MessageKey.AUDIT_AWARD_DELETED: "{username} deleted the award \"{name}\".",
    MessageKey.AUDIT_AWARD_DELETE_FAILED: "{username} could not delete award #{award_id}: {reason}",
    MessageKey.GENRE_NOT_FOUND: "This genre doesn't exist or was removed.",
    MessageKey.AWARD_NOT_FOUND: "This award doesn't exist or was removed.",
    MessageKey.LANGUAGE_EXISTS: "The language \"{name}\" already exists.",
    MessageKey.COUNTRY_EXISTS: "The country \"{name}\" already exists.",
    MessageKey.GENRE_EXISTS: "The genre \"{name}\" already exists.",
    MessageKey.AWARD_EXISTS: "The award \"{name}\" already exists for this year.",
    MessageKey.AWARD_YEAR_IN_FUTURE: "The year can't be in the future.",
    MessageKey.INTENT_NOT_FOUND: "This chatbot intent doesn't exist or was removed.",
    MessageKey.INTENT_EXISTS: "The intent \"{tag}\" already exists.",
    MessageKey.INTENT_TAG_PATTERN: "Use lowercase letters, numbers and underscores, starting with a letter.",
    MessageKey.PATTERN_NOT_FOUND: "This pattern doesn't exist or was removed.",
    MessageKey.PATTERN_EXISTS: "This pattern is already used by the intent \"{tag}\".",
    MessageKey.RESPONSE_NOT_FOUND: "This response doesn't exist or was removed.",
    MessageKey.RESPONSE_EXISTS: "This intent already has this response.",
    MessageKey.UNKNOWN_MESSAGE_NOT_FOUND: "This unknown message doesn't exist or was already handled.",
    MessageKey.CONVERSATION_NOT_FOUND: "This conversation doesn't exist. Start a new one.",
    MessageKey.MESSAGE_NOT_FOUND: "This chat message doesn't exist or can't be rated.",
    MessageKey.FEEDBACK_NOT_FOUND: "This feedback doesn't exist or was already reviewed.",
    MessageKey.FEEDBACK_NO_QUESTION: "The question behind this reply is no longer available.",
    MessageKey.CHATBOT_NOT_TRAINED: "The chatbot hasn't been trained yet.",
    MessageKey.CHATBOT_NOT_TRAINED_HINT: "An administrator can train it from the admin panel.",
    MessageKey.CHATBOT_UNAVAILABLE: "The chatbot is unavailable right now. Try again later.",
    MessageKey.TRAINING_IN_PROGRESS: "A training run is already in progress. Wait for it to finish.",
    MessageKey.TRAINING_NOT_ENOUGH_INTENTS: "Add patterns to at least {min} intents before training.",
    MessageKey.TRAINING_FAILED: "Training failed on the server.",
    MessageKey.REPLY_FALLBACK_REPHRASE: "I'm not sure I understood that. Could you rephrase?",
    MessageKey.REPLY_FALLBACK_TOPICS: "Hmm, I didn't quite catch that. Try asking about books, authors or recommendations!",
    MessageKey.REPLY_FALLBACK_LEARNING: "I'm still learning! Could you ask me something about books?",
    MessageKey.REPLY_NO_RESPONSE: "I know what you mean, but I don't have an answer for that yet.",
    MessageKey.REPLY_SIMILAR_ASK: "Which book would you like recommendations similar to? Just name a title!",
    MessageKey.REPLY_SIMILAR_NONE: "I found \"{title}\" but couldn't find similar books. Try browsing by genre!",
    MessageKey.REPLY_SIMILAR_NONE_UNREAD: "I found \"{title}\" but couldn't find similar books you haven't read yet. Try browsing by genre!",
    MessageKey.REPLY_SIMILAR_FOUND: "If you liked \"{title}\", you might enjoy these:",
    MessageKey.REPLY_SIMILAR_FOUND_MOOD: "If you liked \"{title}\", you might enjoy these, with a {moods} feel:",
    MessageKey.REPLY_GENRE_ASK: "Which genre are you in the mood for? Fantasy, sci-fi, horror, thriller…?",
    MessageKey.REPLY_GENRE_MISSING: "I don't have a \"{genre}\" genre in the catalogue yet. Try fantasy, sci-fi or horror!",
    MessageKey.REPLY_GENRE_NONE: "I don't have any {genre} books that match right now.",
    MessageKey.REPLY_GENRE_FOUND: "Here are some {genre} recommendations:",
    MessageKey.REPLY_GENRE_FOUND_MOOD: "Here are some {genre} recommendations on the {moods} side:",
    MessageKey.REPLY_MOOD_ASK: "What kind of mood are you going for? Dark and gritty, uplifting, funny, tense…?",
    MessageKey.REPLY_MOOD_NONE: "I couldn't find books tagged as {moods} yet. Try browsing by genre instead!",
    MessageKey.REPLY_MOOD_FOUND: "For something {moods}, you might like these:",
    MessageKey.REPLY_AUTHOR_ASK: "Which author would you like to know about?",
    MessageKey.REPLY_AUTHOR_NO_BOOKS: "{name} has no books in the catalogue yet.",
    MessageKey.REPLY_AUTHOR_BOOKS: "Here are the top books by {name} in the catalogue:",
    MessageKey.REPLY_AUTHOR_RATING: "Their books average {rating}★.",
    MessageKey.REPLY_BOOK_ASK: "Which book would you like to know about? Just give me the title.",
    MessageKey.REPLY_BOOK_INFO: "\"{title}\" by {author}.",
    MessageKey.REPLY_BOOK_INFO_NO_AUTHOR: "Here is \"{title}\".",
    MessageKey.REPLY_BOOK_GENRES: "Genres: {genres}.",
    MessageKey.REPLY_BOOK_RATING: "Readers rate it {rating}★ on average.",
    MessageKey.REPLY_BOOK_TRAITS: "Readers say it {traits}.",
    MessageKey.REPLY_SEARCH_ASK: "What are you looking for? Give me a title, an author or a genre.",
    MessageKey.REPLY_UNREAD_NO_HISTORY: "I don't know your reading history yet. Mark some books as read and I'll leave them out!",
    MessageKey.REPLY_UNREAD_NONE: "You've read a lot! I couldn't find unread books that match.",
    MessageKey.REPLY_UNREAD_FOUND: "Here are some books you haven't read yet:",
    MessageKey.REPLY_TOP_RATED_NONE: "I couldn't find top-rated books that match right now.",
    MessageKey.REPLY_TOP_RATED_FOUND: "Our highest-rated books are:",
    MessageKey.REPLY_TOP_RATED_GENRE_FOUND: "Our highest-rated {genre} books are:",
    MessageKey.REPLY_BY_AUTHOR_ASK: "Which author's style do you enjoy? Name them and I'll find similar writers.",
    MessageKey.REPLY_BY_AUTHOR_UNREAD: "You may not have read all of {name}'s work yet:",
    MessageKey.REPLY_BY_AUTHOR_NONE: "I couldn't find authors similar to {name} yet. More reviews will help!",
    MessageKey.REPLY_BY_AUTHOR_SIMILAR: "If you enjoy {name}'s style, you might also like:",
    MessageKey.TRAIT_DARK: "has a dark tone",
    MessageKey.TRAIT_SLOW_BURN: "is a slow burn",
    MessageKey.TRAIT_FOUND_FAMILY: "features a found family",
    MessageKey.TRAIT_FAST_PACED: "is fast-paced",
    MessageKey.TRAIT_LYRICAL_PROSE: "has beautiful prose",
    MessageKey.TRAIT_MORALLY_GREY: "has a morally complex main character",
    MessageKey.TRAIT_HARD_SCI_FI: "is grounded in hard science",
    MessageKey.AUDIT_ACTION_CHATBOT_INTENT_CREATE: "Chatbot intent added",
    MessageKey.AUDIT_CHATBOT_INTENT_CREATE_DONE: "{username} added the chatbot intent \"{tag}\".",
    MessageKey.AUDIT_CHATBOT_INTENT_CREATE_FAILED: "{username} could not add the chatbot intent \"{tag}\": {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_INTENT_UPDATE: "Chatbot intent edited",
    MessageKey.AUDIT_CHATBOT_INTENT_UPDATE_DONE: "{username} edited the chatbot intent \"{tag}\".",
    MessageKey.AUDIT_CHATBOT_INTENT_UPDATE_FAILED: "{username} could not edit chatbot intent #{intent_id}: {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_INTENT_DELETE: "Chatbot intent deleted",
    MessageKey.AUDIT_CHATBOT_INTENT_DELETE_DONE: "{username} deleted the chatbot intent \"{tag}\".",
    MessageKey.AUDIT_CHATBOT_INTENT_DELETE_FAILED: "{username} could not delete chatbot intent #{intent_id}: {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_PATTERN_CREATE: "Chatbot pattern added",
    MessageKey.AUDIT_CHATBOT_PATTERN_CREATE_DONE: "{username} added a pattern to the chatbot intent \"{tag}\".",
    MessageKey.AUDIT_CHATBOT_PATTERN_CREATE_FAILED: "{username} could not add a pattern to chatbot intent #{intent_id}: {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_PATTERN_UPDATE: "Chatbot pattern edited",
    MessageKey.AUDIT_CHATBOT_PATTERN_UPDATE_DONE: "{username} edited a pattern of the chatbot intent \"{tag}\".",
    MessageKey.AUDIT_CHATBOT_PATTERN_UPDATE_FAILED: "{username} could not edit chatbot pattern #{pattern_id}: {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_PATTERN_DELETE: "Chatbot pattern deleted",
    MessageKey.AUDIT_CHATBOT_PATTERN_DELETE_DONE: "{username} deleted a pattern from the chatbot intent \"{tag}\".",
    MessageKey.AUDIT_CHATBOT_PATTERN_DELETE_FAILED: "{username} could not delete chatbot pattern #{pattern_id}: {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_RESPONSE_CREATE: "Chatbot response added",
    MessageKey.AUDIT_CHATBOT_RESPONSE_CREATE_DONE: "{username} added a response to the chatbot intent \"{tag}\".",
    MessageKey.AUDIT_CHATBOT_RESPONSE_CREATE_FAILED: "{username} could not add a response to chatbot intent #{intent_id}: {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_RESPONSE_UPDATE: "Chatbot response edited",
    MessageKey.AUDIT_CHATBOT_RESPONSE_UPDATE_DONE: "{username} edited a response of the chatbot intent \"{tag}\".",
    MessageKey.AUDIT_CHATBOT_RESPONSE_UPDATE_FAILED: "{username} could not edit chatbot response #{response_id}: {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_RESPONSE_DELETE: "Chatbot response deleted",
    MessageKey.AUDIT_CHATBOT_RESPONSE_DELETE_DONE: "{username} deleted a response from the chatbot intent \"{tag}\".",
    MessageKey.AUDIT_CHATBOT_RESPONSE_DELETE_FAILED: "{username} could not delete chatbot response #{response_id}: {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_UNKNOWN_DELETE: "Unknown chatbot message dismissed",
    MessageKey.AUDIT_CHATBOT_UNKNOWN_DELETE_DONE: "{username} dismissed unknown chatbot message #{message_id}.",
    MessageKey.AUDIT_CHATBOT_UNKNOWN_DELETE_FAILED: "{username} could not dismiss unknown chatbot message #{message_id}: {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_UNKNOWN_PROMOTE: "Unknown chatbot message added as pattern",
    MessageKey.AUDIT_CHATBOT_UNKNOWN_PROMOTE_DONE: "{username} added unknown chatbot message #{message_id} as a pattern of \"{tag}\".",
    MessageKey.AUDIT_CHATBOT_UNKNOWN_PROMOTE_FAILED: "{username} could not add unknown chatbot message #{message_id} as a pattern: {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_TRAIN: "Chatbot index rebuilt",
    MessageKey.AUDIT_CHATBOT_TRAIN_DONE: "{username} rebuilt the chatbot index from {samples} patterns.",
    MessageKey.AUDIT_CHATBOT_TRAIN_FAILED: "{username} could not rebuild the chatbot index: {reason}",
    MessageKey.REPLY_SHORT_FOUND: "Here are some shorter reads, up to {pages} pages:",
    MessageKey.REPLY_SHORT_NONE: "I couldn't find books of up to {pages} pages that match right now.",
    MessageKey.REPLY_SERIES_FOUND: "Here are some series worth starting:",
    MessageKey.REPLY_SERIES_GENRE_FOUND: "Here are some {genre} series worth starting:",
    MessageKey.REPLY_SERIES_NONE: "I don't have any series that match right now.",
    MessageKey.REPLY_LENGTH_ASK: "Which book? Give me the title and I'll tell you how long it is.",
    MessageKey.REPLY_LENGTH: "Number of pages in \"{title}\": {pages}.",
    MessageKey.REPLY_LENGTH_UNKNOWN: "I don't know how long \"{title}\" is yet.",
    MessageKey.REPLY_GENRE_INFO: "{genre} books in the catalogue: {count}. The top-rated ones:",
    MessageKey.REPLY_GENRE_INFO_EMPTY: "There are no {genre} books in the catalogue yet.",
    MessageKey.REPLY_SHELVES: "Your shelves: read {read}, reading now {reading}, want to read {want}.",
    MessageKey.REPLY_SHELVES_READING: "You're currently reading:",
    MessageKey.REPLY_SHELVES_NEXT: "Next on your list:",
    MessageKey.REPLY_SHELVES_EMPTY: "Your shelves are empty. Open a book and pick a shelf to get started.",
    MessageKey.AUDIT_ACTION_CHATBOT_SEED: "Chatbot seeded",
    MessageKey.AUDIT_CHATBOT_SEED_DONE: "The chatbot was seeded with {intents} intents, {patterns} patterns and {responses} responses.",
    MessageKey.AUDIT_CHATBOT_SEED_FAILED: "The chatbot could not be seeded: {reason}",
    MessageKey.REPLY_NO_MORE: "That's everything I have for that. Try another genre or mood!",
    MessageKey.REPLY_FOLLOW_UP_NOTHING: "Ask me for a recommendation first, then I can find more like it.",
    MessageKey.REPLY_MORE_FOUND: "Here are a few more:",
    MessageKey.SUGGEST_MORE: "Show me more",
    MessageKey.SUGGEST_SHORTER: "Something shorter",
    MessageKey.SUGGEST_RECOMMEND: "Recommend me a book",
    MessageKey.SUGGEST_HELP: "What can you do?",
    MessageKey.SUGGEST_SHELVES: "What's on my shelves?",
    MessageKey.SUGGEST_GENRE: "Recommend a {genre} book",
    MessageKey.SUGGEST_MOOD_DARK: "Something dark",
    MessageKey.SUGGEST_MOOD_FUNNY: "Something funny",
    MessageKey.SUGGEST_MOOD_EMOTIONAL: "Something emotional",
    MessageKey.SUGGEST_MOOD_TENSE: "Something tense",
    MessageKey.SUGGEST_STATS: "How is my reading going?",
    MessageKey.REPLY_TASTE_FOUND: "Picked for you, based on what you've enjoyed:",
    MessageKey.REPLY_TASTE_NONE: "I couldn't find new books that match your taste right now. Try asking for a genre or a mood!",
    MessageKey.REPLY_TASTE_EMPTY: "I don't know your taste yet. Rate a few books 4★ or higher and I'll pick books for you.",
    MessageKey.REPLY_STATS_EMPTY: "You haven't logged any reading in {year} yet. Books finished all time: {total}.",
    MessageKey.REPLY_STATS_YEAR: "Your {year} so far: books finished {finished}, pages read {pages}.",
    MessageKey.REPLY_STATS_CHALLENGE: "Challenge {metric}: {value} of {target}, {status}.",
    MessageKey.REPLY_STATS_NO_CHALLENGE: "You haven't set a reading challenge for {year}; you can set one on the stats page.",
    MessageKey.REPLY_STATS_STREAK: "Current reading streak in days: {days}.",
    MessageKey.REPLY_STATS_GENRE: "Your top genre this year: {genre}.",
    MessageKey.STATS_METRIC_BOOKS: "books",
    MessageKey.STATS_METRIC_PAGES: "pages",
    MessageKey.STATS_METRIC_HOURS: "hours",
    MessageKey.STATS_PACE_AHEAD: "ahead of pace",
    MessageKey.STATS_PACE_ON_TRACK: "on track",
    MessageKey.STATS_PACE_BEHIND: "behind pace",
    MessageKey.STATS_PACE_COMPLETED: "completed",
    MessageKey.STATS_PACE_MISSED: "missed",
    MessageKey.AUDIT_ACTION_CHATBOT_CONVERSATION_DELETE: "Chat conversation deleted",
    MessageKey.AUDIT_CHATBOT_CONVERSATION_DELETE_DONE: "{username} deleted chat conversation #{conversation_id}.",
    MessageKey.AUDIT_CHATBOT_CONVERSATION_DELETE_FAILED: "{username} could not delete chat conversation #{conversation_id}: {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_FEEDBACK: "Chatbot reply rated",
    MessageKey.AUDIT_CHATBOT_FEEDBACK_DONE: "{username} rated chatbot reply #{message_id}.",
    MessageKey.AUDIT_CHATBOT_FEEDBACK_FAILED: "{username} could not rate chatbot reply #{message_id}: {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_FEEDBACK_PROMOTE: "Rated chatbot question added as pattern",
    MessageKey.AUDIT_CHATBOT_FEEDBACK_PROMOTE_DONE: "{username} added the question behind chatbot reply #{message_id} as a pattern of \"{tag}\".",
    MessageKey.AUDIT_CHATBOT_FEEDBACK_PROMOTE_FAILED: "{username} could not add the question behind chatbot reply #{message_id} as a pattern: {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_FEEDBACK_DISMISS: "Chatbot feedback dismissed",
    MessageKey.AUDIT_CHATBOT_FEEDBACK_DISMISS_DONE: "{username} dismissed the feedback on chatbot reply #{message_id}.",
    MessageKey.AUDIT_CHATBOT_FEEDBACK_DISMISS_FAILED: "{username} could not dismiss the feedback on chatbot reply #{message_id}: {reason}",
    MessageKey.AUDIT_ACTION_CHATBOT_IMPORT: "Chatbot intents imported",
    MessageKey.AUDIT_CHATBOT_IMPORT_DONE: "{username} imported {intents} intents, {patterns} patterns and {responses} responses.",
    MessageKey.AUDIT_CHATBOT_IMPORT_FAILED: "{username} could not import chatbot intents: {reason}",
    MessageKey.AUDIT_ACTION_USER_AVATAR_UPDATE: "Profile picture changed",
    MessageKey.AUDIT_USER_AVATAR_UPDATE_DONE: "{username} changed their profile picture.",
    MessageKey.AUDIT_USER_AVATAR_UPDATE_FAILED: "{username} could not change their profile picture: {reason}",
    MessageKey.AUDIT_ACTION_USER_AVATAR_REMOVE: "Profile picture removed",
    MessageKey.AUDIT_USER_AVATAR_REMOVE_DONE: "{username} removed their profile picture.",
    MessageKey.AUDIT_USER_AVATAR_REMOVE_FAILED: "{username} could not remove their profile picture: {reason}",
    MessageKey.AUDIT_ACTION_USER_BAN: "User banned",
    MessageKey.AUDIT_USER_BAN_DONE: "{username} banned {target}.",
    MessageKey.AUDIT_USER_BAN_FAILED: "{username} could not ban user #{user_id}: {reason}",
    MessageKey.AUDIT_ACTION_USER_UNBAN: "User unbanned",
    MessageKey.AUDIT_USER_UNBAN_DONE: "{username} lifted the ban on {target}.",
    MessageKey.AUDIT_USER_UNBAN_FAILED: "{username} could not lift the ban on user #{user_id}: {reason}",
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
