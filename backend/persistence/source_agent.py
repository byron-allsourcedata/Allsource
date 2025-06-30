from typing import List
from uuid import UUID

from db_dependencies import Db
from models import (
    AudienceSourcesMatchedPerson,
    EnrichmentProfessionalProfile,
    EnrichmentUser,
    EnrichmentUserContact,
)
from resolver import injectable


@injectable
class SourceAgentPersistence:
    def __init__(self, db: Db):
        self.db = db

    def profile_rows(self, matched_ids: List[UUID]) -> list:
        prof_rows = (
            self.db.query(
                AudienceSourcesMatchedPerson.id.label("mp_id"),
                EnrichmentProfessionalProfile.job_level,
                EnrichmentProfessionalProfile.department,
                EnrichmentProfessionalProfile.company_size,
            )
            .join(
                EnrichmentUser,
                AudienceSourcesMatchedPerson.enrichment_user_id
                == EnrichmentUser.id,
            )
            .join(
                EnrichmentProfessionalProfile,
                EnrichmentProfessionalProfile.asid == EnrichmentUser.asid,
            )
            .filter(AudienceSourcesMatchedPerson.id.in_(matched_ids))
            .all()
        )

        return prof_rows

    def contact_rows(self, matched_ids: List[UUID]) -> list:
        return (
            self.db.query(
                AudienceSourcesMatchedPerson.id.label("mp_id"),
                EnrichmentUserContact.business_email,
                EnrichmentUserContact.business_email_validation_status,
                EnrichmentUserContact.linkedin_url,
            )
            .join(
                EnrichmentUser,
                AudienceSourcesMatchedPerson.enrichment_user_id
                == EnrichmentUser.id,
            )
            .join(
                EnrichmentUserContact,
                EnrichmentUserContact.asid == EnrichmentUser.asid,
            )
            .filter(AudienceSourcesMatchedPerson.id.in_(matched_ids))
            .all()
        )
