from server.database.models.book import Book


def calculate_books_reviews_count(book: Book) -> int:
    return (
        (book.zero_stars_count or 0)
        + (book.one_stars_count or 0)
        + (book.two_stars_count or 0)
        + (book.three_stars_count or 0)
        + (book.four_stars_count or 0)
        + (book.five_stars_count or 0)
    )