import logging
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Tuple

from models.enrichment_users import EnrichmentUser
from models.five_x_five_users import FiveXFiveUser
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson

logger = logging.getLogger(__name__)

class AudienceSourcesMatchedPersonsPersistence:    
    def __init__(self, db: Session):
        self.db = db

    def get_audience_sources_matched_persons_by_source_id(self, *, audience_source_id: UUID) -> Tuple[List[AudienceSourcesMatchedPerson], List[EnrichmentUser]]:
        query = (
            self.db.query(AudienceSourcesMatchedPerson, EnrichmentUser)
            .outerjoin(EnrichmentUser, AudienceSourcesMatchedPerson.enrichment_user_id == EnrichmentUser.id)
            .filter(AudienceSourcesMatchedPerson.source_id == audience_source_id)
        )
        results = query.all()

        matched_persons = [row[0] for row in results]
        enrichment_persons = [row[1] for row in results]

        return matched_persons, enrichment_persons
    
    