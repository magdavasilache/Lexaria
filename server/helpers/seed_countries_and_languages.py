from sqlalchemy.orm import Session
from server.database.models.country import Country
from server.database.models.language import Language

def seed_countries_and_languages(db: Session):
    # Languages
    spanish = Language(name="Spanish")
    french = Language(name="French")
    db.add_all([ spanish, french])
    db.flush()

    # Countries
    spain = Country(name="Spain", language_id=spanish.id)
    france = Country(name="France", language_id=french.id)
    db.add_all([spain, france])
    db.flush()
    print("Seeded countries and languages.")