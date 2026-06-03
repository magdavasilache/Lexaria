import sys
import os
from fastapi import FastAPI
from server.database.database import Base, get_db
import server.models
from server.utils.logger import logger
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from server.database.routes.main_router import main_router

target_metadata = Base.metadata

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "server")))
logger.info(os.getcwd())
app = FastAPI(title="Lexaria Backend")

static_path = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_path), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)

app.include_router(main_router)

db_generator = get_db()
db = next(db_generator)

@app.get('/')
def read_root():
    return {"message": "The server is up and running!!!"}