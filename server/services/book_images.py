from collections.abc import Iterable, Sequence
from pathlib import Path
from uuid import uuid4

from starlette.datastructures import UploadFile

from server.core.errors import ValidationAppError
from server.core.message_keys import MessageKey

BOOK_IMAGE_DIR = (Path(__file__).resolve().parents[1] / "static" / "books").resolve()
BOOK_IMAGE_URL_PREFIX = "/static/books/"
BOOK_IMAGE_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}
BOOK_IMAGE_MAX_BYTES = 5 * 1024 * 1024
BOOK_IMAGE_CHUNK_BYTES = 64 * 1024


def image_url(name: str) -> str:
    return f"{BOOK_IMAGE_URL_PREFIX}{name}"


def save_book_image(image: UploadFile, base_dir: Path | None = None) -> str:
    base_dir = base_dir or BOOK_IMAGE_DIR
    filename = image.filename or ""
    extension = Path(filename).suffix.lower()
    if extension not in BOOK_IMAGE_TYPES or image.content_type != BOOK_IMAGE_TYPES[extension]:
        raise ValidationAppError(MessageKey.UNSUPPORTED_IMAGE, params={"filename": filename}, field="images")

    base_dir.mkdir(parents=True, exist_ok=True)
    file_path = base_dir / f"{uuid4().hex}{extension}"
    written = 0
    try:
        with file_path.open("wb") as buffer:
            while chunk := image.file.read(BOOK_IMAGE_CHUNK_BYTES):
                written += len(chunk)
                if written > BOOK_IMAGE_MAX_BYTES:
                    raise ValidationAppError(
                        MessageKey.IMAGE_TOO_LARGE,
                        params={"filename": filename, "max_mb": BOOK_IMAGE_MAX_BYTES // (1024 * 1024)},
                        field="images",
                    )
                buffer.write(chunk)
    except BaseException:
        file_path.unlink(missing_ok=True)
        raise
    return file_path.name


def save_book_images(images: Sequence[UploadFile], base_dir: Path | None = None) -> list[str]:
    saved: list[str] = []
    try:
        for image in images:
            saved.append(save_book_image(image, base_dir))
    except BaseException:
        delete_book_images(saved, base_dir)
        raise
    return saved


def delete_book_images(names: Iterable[str], base_dir: Path | None = None) -> None:
    base_dir = base_dir or BOOK_IMAGE_DIR
    for name in names:
        if Path(name).name == name:
            (base_dir / name).unlink(missing_ok=True)
