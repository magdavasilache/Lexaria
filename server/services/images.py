from collections.abc import Iterable, Sequence
from enum import StrEnum
from pathlib import Path
from uuid import uuid4

from starlette.datastructures import UploadFile

from server.core.errors import ValidationAppError
from server.core.message_keys import MessageKey

STATIC_DIR = (Path(__file__).resolve().parents[1] / "static").resolve()
STATIC_URL_PREFIX = "/static"
IMAGE_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}
IMAGE_MAX_BYTES = 5 * 1024 * 1024
IMAGE_CHUNK_BYTES = 64 * 1024


class ImageFolder(StrEnum):
    BOOKS = "books"
    AUTHORS = "author"


def _directory(folder: ImageFolder) -> Path:
    return STATIC_DIR / folder.value


def image_url(folder: ImageFolder, name: str) -> str:
    return f"{STATIC_URL_PREFIX}/{folder.value}/{name}"


def save_image(image: UploadFile, folder: ImageFolder, field: str) -> str:
    filename = image.filename or ""
    extension = Path(filename).suffix.lower()
    if extension not in IMAGE_TYPES or image.content_type != IMAGE_TYPES[extension]:
        raise ValidationAppError(MessageKey.UNSUPPORTED_IMAGE, params={"filename": filename}, field=field)

    directory = _directory(folder)
    directory.mkdir(parents=True, exist_ok=True)
    file_path = directory / f"{uuid4().hex}{extension}"
    written = 0
    try:
        with file_path.open("wb") as buffer:
            while chunk := image.file.read(IMAGE_CHUNK_BYTES):
                written += len(chunk)
                if written > IMAGE_MAX_BYTES:
                    raise ValidationAppError(
                        MessageKey.IMAGE_TOO_LARGE,
                        params={"filename": filename, "max_mb": IMAGE_MAX_BYTES // (1024 * 1024)},
                        field=field,
                    )
                buffer.write(chunk)
    except BaseException:
        file_path.unlink(missing_ok=True)
        raise
    return file_path.name


def save_images(images: Sequence[UploadFile], folder: ImageFolder, field: str) -> list[str]:
    saved: list[str] = []
    try:
        for image in images:
            saved.append(save_image(image, folder, field))
    except BaseException:
        delete_images(saved, folder)
        raise
    return saved


def delete_images(names: Iterable[str | None], folder: ImageFolder) -> None:
    directory = _directory(folder)
    for name in names:
        if name and Path(name).name == name:
            (directory / name).unlink(missing_ok=True)
