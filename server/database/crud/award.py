from server.database.crud.user import get_user_by_id
from server.database.models.award import Award
from sqlalchemy.orm import Session

from server.database.schemas.award import AwardCreate, AwardFromSearch, AwardUOut
from server.utils.errors import raise_http_error

def create_award(db: Session, award_create: AwardCreate) -> AwardUOut:
    name = award_create.name
    year = award_create.year
    image = award_create.image
    description = award_create.description
    try:
        existing_award = (
            db.query(Award)
            .filter(
                Award.name == name, 
                Award.year == year
            )
            .first()
        )

        if existing_award:
            return AwardUOut.model_validate(existing_award)
        award = Award(name=name, year=year, image=image, description=description)
        db.add(award)
        db.commit()
        db.refresh(award)
        return AwardUOut.model_validate(award)
    except Exception as e:
        db.rollback()
        raise e
    
def search_for_award(db: Session, input: str) -> Award | None:
    query = (
        db.query(Award)
        .filter(Award.name.ilike(f"%{input}%")
        )
        .all
    )
    results = []
    for award in query:
        results.append(AwardFromSearch.model_validate(award))

    return results