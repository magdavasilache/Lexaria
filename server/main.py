from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import server.models
from server.core.config import settings
from server.core.exception_handlers import register_exception_handlers
from server.core.middleware import RequestContextMiddleware
from server.core.responses import ApiResponse, ok
from server.database.routes.main_router import main_router
from server.services import book_embeddings


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    if settings.warm_up_embeddings:
        book_embeddings.start_warm_up()
    yield


app = FastAPI(title="Lexaria Backend", lifespan=lifespan)

app.mount("/static", StaticFiles(directory=Path(__file__).parent / "static"), name="static")

register_exception_handlers(app)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

app.include_router(main_router)


@app.get("/", response_model=ApiResponse[dict[str, str]])
def read_root() -> ApiResponse[dict[str, str]]:
    return ok({"status": "up"})
