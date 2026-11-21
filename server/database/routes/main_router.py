from fastapi import APIRouter
from server.database.routes.audit_log import router as audit_log_router
from server.database.routes.auth import router as auth_router
from server.database.routes.book import router as book_router
from server.database.routes.imports import router as imports_router
from server.database.routes.author import router as author_router
from server.database.routes.user_book_status import router as user_book_status_router
from server.database.routes.review import router as review_router
from server.database.routes.language import router as language_router
from server.database.routes.country import router as country_router
from server.ml.chatbot import router as chatbot_router
from server.ml.chatbot_inference import router as chatbot_inference_router

main_router = APIRouter()

main_router.include_router(auth_router)
main_router.include_router(audit_log_router)
main_router.include_router(book_router)
main_router.include_router(imports_router)
main_router.include_router(author_router)
main_router.include_router(user_book_status_router)
main_router.include_router(review_router)
main_router.include_router(language_router)
main_router.include_router(country_router)
main_router.include_router(chatbot_router)
main_router.include_router(chatbot_inference_router)