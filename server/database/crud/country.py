from sqlalchemy.orm import Session
from sqlalchemy import func

from server.database.crud.helpers.name_checks import is_similar, normalize
from server.database.crud.user import get_user_by_id
from server.database.models.country import Country
from server.database.schemas.country import CountryCreateSchema, FormCountryOut
from server.utils.errors import raise_http_error


def create_new_country(db: Session, country_create: CountryCreateSchema) -> Country:
    normalized_name = normalize(country_create.name)

    existing = db.query(Country).filter(
        func.lower(Country.name) == normalized_name
    ).first()

    if existing:
        raise_http_error(400, "Country exists")

    similar = db.query(Country.name).all()

    for (name,) in similar:
        if is_similar(normalized_name, normalize(name)):
            raise_http_error(400, "Similar country exists")

    new_country = Country(
        name=country_create.name.strip(),
        language_id=country_create.language_id
    )

    db.add(new_country)
    db.commit()
    db.refresh(new_country)
    return new_country

def get_countries_for_forms(db: Session):
    countries = db.query(Country).all()
    result = []

    for country in countries:
        result.append(FormCountryOut(id=country.id, name=country.name))

    return result

