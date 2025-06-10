from decimal import Decimal
from typing import List
from uuid import UUID

from persistence.source_agent import SourceAgentPersistence
from resolver import injectable
from schemas.scripts.audience_source import PersonEntry
from schemas.source_agent import Stats
from services.audience_sources import AudienceSourceMath


@injectable
class SourceAgentService:
    def __init__(
        self,
        repo: SourceAgentPersistence
    ):
        self.repo = repo

    def normalize_b2b(
        self,
        persons: List[PersonEntry],
        source_id: str,
        stats: Stats
    ) -> List[dict]:
        # B2B Algorithm:
        # For B2B, the score is a combination of three components:
        # 1. Recency Score based on BUSINESS_EMAIL_LAST_SEEN_DATE.
        # 2. Professional Score calculated from JobLevel, Department, and CompanySize.
        # 3. Completeness Score based on the presence of a valid business email, LinkedIn URL,
        #    and non-null professional attributes.
        matched_ids = [UUID(p.id) for p in persons]
        prof_rows = self.repo.profile_rows(matched_ids)
        profile_map = {
            row.mp_id: row for row in prof_rows
        }

        contact_rows = self.repo.contact_rows(matched_ids)

        contact_map = {
            row.mp_id: row for row in contact_rows
        }

        inverted_values = []

        for person in persons:
            inv = AudienceSourceMath.inverted_decimal(Decimal(person.recency))
            inverted_values.append(inv)

        job_level_map = {
            'Executive': Decimal("1.0"),
            'Senior': Decimal("0.8"),
            'Manager': Decimal("0.6"),
            'Entry': Decimal("0.4")
        }
        department_map = {
            'Sales': Decimal("1.0"),
            'Marketing': Decimal("0.8"),
            'Engineering': Decimal("0.6")
        }
        company_size_map = {
            '1000+': Decimal("1.0"),
            '501-1000': Decimal("0.8"),
            '101-500': Decimal("0.6"),
            '51-100': Decimal("0.4")
        }

        updates = []
        for idx, person in enumerate(persons):
            recency_inv = inverted_values[idx]
            recency_score = AudienceSourceMath.normalize_decimal(
                value=recency_inv,
                min_val=stats.min_inv,
                max_val=stats.max_inv
            )
            prof = profile_map.get(UUID(person.id))
            job_level = getattr(prof, "job_level", None)
            department = getattr(prof, "department", None)
            company_size = getattr(prof, "company_size", None)

            job_level_weight = job_level_map.get(job_level, Decimal("0.2"))
            department_weight = department_map.get(department, Decimal("0.4"))
            company_size_weight = company_size_map.get(company_size, Decimal("0.2"))

            professional_score = (Decimal("0.5") * job_level_weight +
                                  Decimal("0.3") * department_weight +
                                  Decimal("0.2") * company_size_weight)
            completeness_score = Decimal("0.0")
            contact = contact_map.get(UUID(person.id))
            completeness = Decimal("0.0")
            if contact and contact.business_email and contact.business_email_validation_status == 'Valid':
                completeness += Decimal("0.4")
            if contact and contact.linkedin_url:
                completeness += Decimal("0.3")
            if job_level:
                completeness_score += Decimal("0.2")
            if department:
                completeness_score += Decimal("0.1")
            lead_value_score_b2b = (Decimal("0.4") * recency_score +
                                    Decimal("0.4") * professional_score +
                                    Decimal("0.2") * completeness_score)
            update_data = {
                'id': person.id,
                'source_id': source_id,
                'email': person.email,
                'recency_min': stats.min_recency,
                'recency_max': stats.max_recency,
                'inverted_recency': inverted_values[idx],
                'inverted_recency_min': stats.min_inv,
                'inverted_recency_max': stats.max_inv,
                'recency_score': recency_score,
                'view_score': professional_score,
                'sum_score': completeness_score,
                'value_score': lead_value_score_b2b,
            }
            updates.append(update_data)
        return updates
