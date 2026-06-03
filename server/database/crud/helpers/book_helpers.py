from pathlib import Path
import shutil
from uuid import uuid4

from fastapi import UploadFile


BOOK_IMAGE_DIR = Path("server/static/books")
BOOK_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

def save_book_image(image: UploadFile | None) -> str | None:
    if not image or not image.filename:
        return None

    extension = Path(image.filename).suffix
    filename = f"{uuid4().hex}{extension}"
    file_path = BOOK_IMAGE_DIR / filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    return filename