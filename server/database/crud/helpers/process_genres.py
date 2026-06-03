from typing import Any
from sqlalchemy import insert, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from fastapi import HTTPException
from server.database.models.genres import Genre, user_genres
from server.utils.logger import logger

def process_genres(db: Session, genres_list: list[str], user_id: int) -> None:
    try:
        existing_genres = (
            db.execute(select(Genre).where(Genre.name.in_(genres_list)))
            .scalars()
            .all()
        )
        existing_names = {g.name for g in existing_genres}

        for genre_name in genres_list:
            if genre_name in existing_names:
                genre = next(g for g in existing_genres if g.name == genre_name)
            else:
                genre = Genre(name=genre_name)
                db.add(genre)
                db.flush() 
                existing_names.add(genre_name)
                existing_genres.append(genre)

            stmt = insert(user_genres).values(user_id=user_id, genre_id=genre.id)
            db.execute(stmt)

        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error while processing genres for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        db.rollback()
        logger.exception("Unexpected error while processing genres")
        raise HTTPException(status_code=500, detail="Unexpected error")
