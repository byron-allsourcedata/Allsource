import logging
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Tuple
from models.five_x_five_users import FiveXFiveUser
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson

logger = logging.getLogger(__name__)

class AudienceSourcesMatchedPersonsPersistence:    
    def __init__(self, db: Session):
        self.db = db

    def get_audience_sources_matched_persons_by_source_id(self, *, audience_source_id: UUID) -> Tuple[List[AudienceSourcesMatchedPerson], List[FiveXFiveUser]]:
        query = (
            self.db.query(AudienceSourcesMatchedPerson, FiveXFiveUser)
            .outerjoin(FiveXFiveUser, AudienceSourcesMatchedPerson.five_x_five_user_id == FiveXFiveUser.id)
            .filter(AudienceSourcesMatchedPerson.source_id == audience_source_id)
        )
        results = query.all()

        matched_persons = [row[0] for row in results]
        five_x_five_persons = [row[1] for row in results]

        return matched_persons, five_x_five_persons
    
    