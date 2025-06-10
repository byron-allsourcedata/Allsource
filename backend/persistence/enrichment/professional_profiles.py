from typing import List
from uuid import UUID

from db_dependencies import Db
from models import AudienceSourcesMatchedPerson, EnrichmentProfessionalProfile, EnrichmentUser
from resolver import injectable


@injectable
class ProfessionalProfilesPersistence:
    def __init__(self, db: Db):
        self.db = db


    def fetch(self, matched_ids: List[UUID]):
        return (
            self.db.query(
                AudienceSourcesMatchedPerson.id.label("mp_id"),
                EnrichmentProfessionalProfile.job_level,
                EnrichmentProfessionalProfile.department,
                EnrichmentProfessionalProfile.company_size,
            )
            .join(EnrichmentUser,
                  AudienceSourcesMatchedPerson.enrichment_user_id == EnrichmentUser.id)
            .join(EnrichmentProfessionalProfile,
                  EnrichmentProfessionalProfile.asid == EnrichmentUser.asid)
            .filter(AudienceSourcesMatchedPerson.id.in_(matched_ids))
            .all()
        )