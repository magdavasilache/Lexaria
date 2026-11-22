from fastapi import APIRouter
from server.database.routes.audit_log import router as audit_log_router
from server.database.routes.auth import router as auth_router
from server.database.routes.book import router as book_router
from server.database.routes.reader_signal import router as reader_signal_router
from server.database.routes.recommendation import router as recommendation_router
from server.database.routes.content_warning import router as content_warning_router
from server.database.routes.edition import router as edition_router
from server.database.routes.reading import router as reading_router
from server.database.routes.stats import router as stats_router
from server.database.routes.imports import router as imports_router
from server.database.routes.author import router as author_router
from server.database.routes.user_book_status import router as user_book_status_router
from server.database.routes.review import router as review_router
from server.database.routes.language import router as language_router
from server.database.routes.country import router as country_router
from server.database.routes.genre import router as genre_router
from server.database.routes.award import router as award_router
from server.database.routes.chatbot import router as chatbot_router
from server.database.routes.user import router as user_router

main_router = APIRouter()

main_router.include_router(auth_router)
main_router.include_router(user_router)
main_router.include_router(audit_log_router)
main_router.include_router(book_router)
main_router.include_router(reader_signal_router)
main_router.include_router(recommendation_router)
main_router.include_router(content_warning_router)
main_router.include_router(edition_router)
main_router.include_router(reading_router)
main_router.include_router(stats_router)
main_router.include_router(imports_router)
main_router.include_router(author_router)
main_router.include_router(user_book_status_router)
main_router.include_router(review_router)
main_router.include_router(language_router)
main_router.include_router(country_router)
main_router.include_router(genre_router)
main_router.include_router(award_router)
main_router.include_router(chatbot_router)