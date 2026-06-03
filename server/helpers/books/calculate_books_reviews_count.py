from server.database.models.book import Book


def calculate_books_reviews_count(book: Book):
    zero_stars = book.zero_stars_count if book.zero_stars_count else 0
    one_stars = book.one_stars_count if book.one_stars_count else 0
    two_stars = book.one_stars_count if book.one_stars_count else 0
    three_stars = book.one_stars_count if book.one_stars_count else 0
    four_stars = book.one_stars_count if book.one_stars_count else 0
    five_stars = book.one_stars_count if book.one_stars_count else 0

    total_count = zero_stars + one_stars + two_stars + three_stars + four_stars + five_stars
    return total_count