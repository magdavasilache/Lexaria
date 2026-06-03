from sqlalchemy.orm import Session
from sqlalchemy import func

from server.database.models.book import Book
from server.database.models.genres import BookTag, Genre


import random
from sqlalchemy.orm import Session

from server.ml.schemas import InferenceContext

def _format_books(books: list, include_rating: bool = True) -> str:
    if not books:
        return None
    parts = []
    for b in books[:3]:
        part = f"'{b.title}' by {b.author.name}"
        if include_rating and b.average_rating:
            part += f" ({b.average_rating:.1f}★)"
        parts.append(part)
    return ", ".join(parts)


def _filter_unread(books: list, ctx: InferenceContext) -> list:
    if not ctx.user_read_book_ids:
        return books
    return [b for b in books if b.id not in ctx.user_read_book_ids]


def _find_books_by_tags(tags: list[str], exclude_ids: set, db: Session, limit: int = 20) -> list:
    if not tags:
        return []
    rows = (
        db.query(BookTag.book_id, func.count(BookTag.id).label("matches"))
        .filter(BookTag.tag.in_(tags))
        .filter(BookTag.book_id.notin_(exclude_ids or {-1}))
        .group_by(BookTag.book_id)
        .order_by(func.count(BookTag.id).desc())
        .limit(limit)
        .all()
    )
    return [db.get(Book, row.book_id) for row in rows]


def handle_recommend_similar(ctx: InferenceContext, db: Session) -> str:
    base_book = next(iter(ctx.matched_books), None)

    if not base_book and ctx.modifiers.get("similar_to"):
        base_book = (
            db.query(Book)
            .filter(Book.title.ilike(f"%{ctx.modifiers['similar_to']}%"))
            .first()
        )

    if not base_book:
        return "Which book would you like recommendations similar to? Just name a title!"

    base_tags = [t.tag for t in base_book.tags]

    if not base_tags:
        genre_ids = [g.id for g in base_book.genres]
        candidates = (
            db.query(Book)
            .join(Book.genres)
            .filter(Genre.id.in_(genre_ids))
            .filter(Book.id != base_book.id)
            .order_by(Book.average_rating.desc())
            .limit(5)
            .all()
        )
    else:
        candidates = _find_books_by_tags(base_tags, {base_book.id}, db)

        mood_tags = ctx.modifiers.get("moods", [])
        if mood_tags:
            mood_matches = {
                row.book_id: row.matches
                for row in db.query(BookTag.book_id, func.count(BookTag.id).label("matches"))
                .filter(BookTag.tag.in_(mood_tags))
                .group_by(BookTag.book_id)
                .all()
            }
            candidates.sort(
                key=lambda b: mood_matches.get(b.id, 0),
                reverse=True
            )

    candidates = _filter_unread(candidates, ctx)

    if not candidates:
        already_read_note = " (excluding books you've already read)" if ctx.user_read_book_ids else ""
        return f"I found '{base_book.title}' but couldn't find similar books{already_read_note}. Try browsing by genre!"

    result = _format_books(candidates[:3])
    mood_note = f" with a {'and '.join(ctx.modifiers['moods'])} feel" if ctx.modifiers.get("moods") else ""
    return f"If you liked '{base_book.title}', you might enjoy{mood_note}: {result}."


def handle_recommend_by_genre(ctx: InferenceContext, db: Session) -> str:
    genre = next(iter(ctx.matched_genres), None)

    if not genre:
        genre_name = next(iter(ctx.modifiers.get("genres", [])), None)
        if not genre_name:
            return "Which genre are you in the mood for? Fantasy, sci-fi, horror, thriller...?"
        return f"I don't have a '{genre_name}' genre in our catalogue yet. Try fantasy, sci-fi, or horror!"

    query = (
        db.query(Book)
        .join(Book.genres)
        .filter(Genre.id == genre.id)
    )

    if ctx.modifiers.get("highly_rated"):
        query = query.filter(Book.average_rating >= 4.0)
    if ctx.modifiers.get("series_only"):
        query = query.filter(Book.is_series == True)
    if ctx.modifiers.get("standalone_only"):
        query = query.filter(Book.is_series == False)

    books = query.order_by(Book.average_rating.desc()).limit(10).all()

    mood_tags = ctx.modifiers.get("moods", [])
    if mood_tags and books:
        book_ids = [b.id for b in books]
        mood_scores = {
            row.book_id: row.matches
            for row in db.query(BookTag.book_id, func.count(BookTag.id).label("matches"))
            .filter(BookTag.book_id.in_(book_ids), BookTag.tag.in_(mood_tags))
            .group_by(BookTag.book_id)
            .all()
        }
        books.sort(key=lambda b: mood_scores.get(b.id, 0), reverse=True)

    books = _filter_unread(books, ctx)

    if not books:
        return f"I don't have any {genre.name} books available right now that match your criteria."

    result = _format_books(books[:3])
    mood_note = f" on the {'and '.join(mood_tags)} side" if mood_tags else ""
    return f"Here are some {genre.name} recommendations{mood_note}: {result}."


def handle_recommend_by_mood(ctx: InferenceContext, db: Session) -> str:
    mood_tags = ctx.modifiers.get("moods", [])

    if not mood_tags:
        return "What kind of mood are you going for? Dark and gritty, uplifting, funny, tense...?"

    books = _find_books_by_tags(mood_tags, ctx.user_read_book_ids, db)

    if ctx.matched_genres and books:
        genre_ids = {g.id for g in ctx.matched_genres}
        genre_filtered = [
            b for b in books
            if any(g.id in genre_ids for g in b.genres)
        ]
        if genre_filtered:
            books = genre_filtered

    if not books:
        mood_str = " and ".join(mood_tags)
        return f"I couldn't find books tagged as '{mood_str}' yet. Try browsing by genre instead!"

    mood_str = " and ".join(mood_tags)
    result = _format_books(books[:3])
    return f"For something {mood_str}, you might like: {result}."


def handle_author_info(ctx: InferenceContext, db: Session) -> str:
    author = next(iter(ctx.matched_authors), None)

    if not author:
        return "Which author would you like to know about?"

    book_count = len(author.books)
    top_books = sorted(author.books, key=lambda b: b.average_rating or 0, reverse=True)[:3]
    top_titles = ", ".join(f"'{b.title}'" for b in top_books)

    avg_rating = (
        db.query(func.avg(Book.average_rating))
        .filter(Book.author_id == author.id)
        .scalar()
    )

    parts = [f"{author.first_name} {author.last_name} has {book_count} book{'s' if book_count != 1 else ''} in our catalogue."]
    if top_titles:
        parts.append(f"Their top titles are: {top_titles}.")
    if avg_rating:
        parts.append(f"They average {avg_rating:.1f}★ across all reviews.")

    return " ".join(parts)


def handle_book_info(ctx: InferenceContext) -> str:
    book = next(iter(ctx.matched_books), None)

    if not book:
        return "Which book would you like to know about? Just give me the title."

    parts = [f"'{book.title}' by {book.author.first_name} {book.author.last_name}."]

    if book.genres:
        genre_names = ", ".join(g.name for g in book.genres)
        parts.append(f"Genre: {genre_names}.")

    if book.average_rating:
        parts.append(f"Rated {book.average_rating:.1f}★ from {book.five_stars_count + book.four_stars_count + book.three_stars_count + book.two_stars_count + book.one_stars_count} reviews.")

    readable_tags = {
        "dark": "has a dark tone",
        "slow-burn": "is a slow burn",
        "found-family": "features a found family",
        "fast-paced": "is fast-paced",
        "lyrical-prose": "has beautiful prose",
        "morally-grey-protagonist": "has a morally complex main character",
        "hard-sci-fi": "is grounded in hard science",
    }
    book_tag_names = {t.tag for t in book.tags}
    descriptions = [v for k, v in readable_tags.items() if k in book_tag_names]
    if descriptions:
        parts.append(f"Readers say it {', '.join(descriptions[:3])}.")

    return " ".join(parts)



def handle_book_search(ctx: InferenceContext, db: Session) -> str:
    if ctx.matched_books:
        book = ctx.matched_books[0]
        return handle_book_info(ctx, db)  

    if ctx.matched_authors:
        author = ctx.matched_authors[0]
        titles = ", ".join(f"'{b.title}'" for b in author.books[:4])
        return f"Books by {author.name} in our catalogue: {titles}."

    if ctx.matched_genres or ctx.modifiers.get("moods"):
        return handle_recommend_by_genre(ctx, db)

    return "What are you looking for? Give me a title, author name, or genre."

def handle_filter_unread(ctx: InferenceContext, db: Session) -> str:
    if not ctx.user_read_book_ids:
        return "I don't have your reading history yet. Mark some books as read and I'll filter them out!"

    query = (
        db.query(Book)
        .filter(Book.id.notin_(ctx.user_read_book_ids))
        .filter(Book.average_rating >= 3.5)
        .order_by(Book.average_rating.desc())
        .limit(5)
    )

    books = query.all()
    if not books:
        return "You've read a lot! I couldn't find unread books matching your preferences."

    result = _format_books(books[:3])
    return f"Here are some books you haven't read yet: {result}."


def handle_filter_by_rating(ctx: InferenceContext, db: Session) -> str:
    query = (
        db.query(Book)
        .filter(Book.average_rating >= 4.2)
        .order_by(Book.average_rating.desc())
    )

    if ctx.matched_genres:
        genre_ids = [g.id for g in ctx.matched_genres]
        query = query.join(Book.genres).filter(Genre.id.in_(genre_ids))

    books = _filter_unread(query.limit(10).all(), ctx)[:3]

    if not books:
        return "I couldn't find top-rated books matching those filters right now."

    genre_note = f" {ctx.matched_genres[0].name}" if ctx.matched_genres else ""
    result = _format_books(books)
    return f"Our highest-rated{genre_note} books are: {result}."



def handle_recommend_by_author(ctx: InferenceContext, db: Session) -> str:
    author = next(iter(ctx.matched_authors), None)

    if not author:
        return "Which author's style do you enjoy? Name them and I'll find similar writers."

    unread_by_author = _filter_unread(author.books, ctx)
    if unread_by_author:
        result = _format_books(unread_by_author[:3])
        return f"You might not have read all of {author.first_name} {author.last_name}'s work yet: {result}."

    author_tag_names = list({
        tag.tag
        for book in author.books
        for tag in book.tags
    })

    similar_books = _find_books_by_tags(
        author_tag_names,
        {b.id for b in author.books},
        db
    )
    similar_books = _filter_unread(similar_books, ctx)

    if not similar_books:
        return f"I couldn't find authors similar to {author.first_name} {author.last_name} yet — more reviews will help!"

    result = _format_books(similar_books[:3])
    return f"If you enjoy {author.first_name} {author.last_name}'s style, you might also like: {result}."


INTENT_HANDLERS: dict = {
    "recommend_similar":    handle_recommend_similar,
    "recommend_by_genre":   handle_recommend_by_genre,
    "recommend_by_mood":    handle_recommend_by_mood,
    "recommend_by_author":  handle_recommend_by_author,
    "recommend_short":      handle_recommend_by_mood,   
    "recommend_series":     handle_recommend_by_genre,  
    "filter_by_rating":     handle_filter_by_rating,
    "filter_unread":        handle_filter_unread,
    "book_search":          handle_book_search,
    "book_info":            handle_book_info,
    "author_info":          handle_author_info,
}