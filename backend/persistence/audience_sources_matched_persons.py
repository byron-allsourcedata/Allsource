import logging
from typing import List, Tuple
from uuid import UUID

from db_dependencies import Db
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from models.enrichment.enrichment_users import EnrichmentUser
from resolver import injectable

logger = logging.getLogger(__name__)

@injectable
class AudienceSourcesMatchedPersonsPersistence:    
    def __init__(self, db: Db):
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

    def by_source_id(self, source_id: UUID):
        return (
            self.db
            .query(AudienceSourcesMatchedPerson.enrichment_user_id)
            .filter(AudienceSourcesMatchedPerson.source_id == source_id)
            .all()
        )
    
    