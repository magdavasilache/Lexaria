from decimal import Decimal
from server.database.models.book import Book

def adjust_star_count(db_book: Book, rating_value: Decimal, delta: int):
    if rating_value == 0:
        db_book.zero_stars_count += delta
    elif rating_value in [1, 1.5]:
        db_book.one_stars_count += delta
    elif rating_value in [2, 2.5]:
        db_book.two_stars_count += delta
    elif rating_value in [3, 3.5]:
        db_book.three_stars_count += delta
    elif rating_value in [4, 4.5]:
        db_book.four_stars_count += delta
    elif rating_value == 5:
        db_book.five_stars_count += delta