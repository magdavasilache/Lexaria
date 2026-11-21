from fastapi import UploadFile

from server.database.schemas.base import InputSchema, OutputSchema

IMPORT_FILE_MAX_BYTES = 10 * 1024 * 1024


class GoodreadsImportForm(InputSchema):
    favorite_genres: UploadFile
    reviews: UploadFile


class GoodreadsImportSummary(OutputSchema):
    books_created: int
    genres_added: int
    statuses_saved: int
    ratings_added: int
    rows_skipped: int
