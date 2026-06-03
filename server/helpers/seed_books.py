from datetime import datetime, date
from sqlalchemy.orm import Session

from server.database.models.author import Author
from server.database.models.book import Book
from server.database.models.country import Country
from server.database.models.genres import Genre
from server.database.models.language import Language

def seed_books(db: Session):
    # Languages
    english = Language(name="English")
    polish = Language(name="Polish")
    db.add_all([english, polish])
    db.flush()

    # Countries
    uk = Country(name="United Kingdom", language_id=english.id)
    usa = Country(name="United States", language_id=english.id)
    poland = Country(name="Poland", language_id=polish.id)
    db.add_all([uk, usa, poland])
    db.flush()

    # Genres
    dystopia = Genre(name="Dystopia")
    graphic_novel = Genre(name="Graphic Novel")
    political = Genre(name="Political")
    short_stories = Genre(name="Short Stories")
    nonfiction = Genre(name="Nonfiction")
    literary = Genre(name="Literary")
    crime = Genre(name="Crime")
    mystery = Genre(name="Mystery")
    thriller = Genre(name="Thriller")
    classic = Genre(name="Classic")
    family = Genre(name="Family")
    drama = Genre(name="Drama")

    db.add_all([
        dystopia, graphic_novel, political,
        short_stories, nonfiction, literary,
        crime, mystery, thriller,
        classic, family, drama
    ])
    db.flush()

    # Authors
    alan_moore = Author(first_name="Alan", last_name="Moore", country_id=uk.id)
    truman_capote = Author(first_name="Truman", last_name="Capote", country_id=usa.id)
    robert_galbraith = Author(first_name="Robert", last_name="Galbraith", country_id=uk.id)
    henryk_sienkiewicz = Author(first_name="Henryk", last_name="Sienkiewicz", country_id=poland.id)
    db.add_all([alan_moore, truman_capote, robert_galbraith, henryk_sienkiewicz])
    db.flush()

    # Books
    books = [
        Book(
            title="V for Vendetta",
            author_id=alan_moore.id,
            country_id=uk.id,
            images=["books/vendetta-coperta.jpg", "books/vendetta-spet.jpg", "books/vendetta-pagina.jpg"],
            pages=296,
            language_id=english.id,
            published_at=date(1988, 1, 1),
            created_at=datetime.now(),
            synopsis="A dystopian graphic novel about a masked vigilante opposing totalitarian rule.",
            awards=[],
            settings=["London"],
            characters=["V", "Evey Hammond"],
            user_id=9,
            genres=[dystopia, graphic_novel, political]
        ),
        Book(
            title="Music for Chameleons",
            author_id=truman_capote.id,
            country_id=usa.id,
            images=["books/muzica-pentru-cameleoni-coperta.jpg", "books/muzica-pentru-cameleoni-spate.jpg", "books/muzica-pentru-cameleoni-pagina.jpg"],
            pages=262,
            language_id=english.id,
            published_at=date(1980, 1, 1),
            created_at=datetime.now(),
            synopsis="A collection of short stories and personal narratives blending fiction and nonfiction.",
            awards=[],
            settings=[],
            characters=[],
            user_id=9,
            genres=[short_stories, nonfiction, literary]
        ),
        Book(
            title="The Silkworm",
            author_id=robert_galbraith.id,
            country_id=uk.id,
            images=["books/viermele-de-matase-coperta.jpg", "books/viermele-de-matase-spate.jpg", "books/viermele-de-matase-pagina.jpeg"],
            pages=455,
            language_id=english.id,
            published_at=date(2014, 1, 1),
            created_at=datetime.now(),
            synopsis="A detective investigates the murder of a novelist whose manuscript may have led to his death.",
            awards=[],
            settings=["London"],
            characters=["Cormoran Strike", "Robin Ellacott"],
            user_id=9,
            genres=[crime, mystery, thriller]
        ),
        Book(
            title="The Polaniecki Family",
            author_id=henryk_sienkiewicz.id,
            country_id=poland.id,
            images=["books/familia-polanieki-coperta.jpg", "books/familia-polanieki-spate.jpg", "books/familia-polanieki-pagina.jpg"],
            pages=510,
            language_id=polish.id,
            published_at=date(1895, 1, 1),
            created_at=datetime.now(),
            synopsis="A novel exploring family, love, and business in Polish society.",
            awards=[],
            settings=["Warsaw"],
            characters=["Stanislaw Polaniecki", "Marynia"],
            user_id=9,
            genres=[classic, family, drama]
        ),
    ]

    db.add_all(books)
    db.commit()
