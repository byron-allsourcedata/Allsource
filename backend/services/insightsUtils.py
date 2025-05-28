import re
from collections import defaultdict, Counter
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy.exc import NoResultFound

from db_dependencies import Db
from enums import BusinessType
from persistence.audience_lookalike_persons import AudienceLookalikesPersonPersistence
from persistence.audience_sources import AudienceSourcesPersistence
from persistence.audience_sources_matched_persons import AudienceSourcesMatchedPersonsPersistence
from persistence.enrichment.postgres import EnrichmentPostgresPersistence
from resolver import injectable
from schemas.insights import InsightsByCategory


@injectable
class InsightsUtils:
    def __init__(
        self,
        db: Db,
        enrichment: EnrichmentPostgresPersistence,
        sources: AudienceSourcesPersistence,
        matched_persons: AudienceSourcesMatchedPersonsPersistence,
        audience_persons: AudienceLookalikesPersonPersistence
    ):
        self.db = db
        self.sources = sources
        self.enrichment = enrichment
        self.matched_persons = matched_persons
        self.audience_persons = audience_persons


    @staticmethod
    def bucket_age(age_range: Optional[str]) -> str:
        low = None

        if low is None and isinstance(age_range, str):
            m = re.search(r'(\d+)', age_range)
            if m:
                low = int(m.group(1))

        if low is None:
            return "Other"
        if 18 <= low <= 25:
            return "18-25"
        if 26 <= low <= 30:
            return "26-30"
        if 31 <= low <= 35:
            return "31-35"
        if 36 <= low <= 45:
            return "36-45"
        if 46 <= low <= 65:
            return "46-65"
        return "Other"



    def process_insights_for_asids(self, insights, asids: List[UUID], audience_type: BusinessType):
        is_invalid = lambda val: (
                val is None
                or str(val).upper() in ('UNKNOWN', 'U', '2', '', '-')
        )
        if audience_type == BusinessType.B2C or audience_type == BusinessType.ALL:
            # 3) PERSONAL
            personal_fields = [
                "gender", "state", "religion", "homeowner",
                "age", "ethnicity", "languages",
                "marital_status", "have_children",
                "education_level", "children_ages", "pets"
            ]
            personal_cts: defaultdict[str, Counter] = defaultdict(Counter)
            rows = self.enrichment.personal(asids)

            for row in rows:
                for field, val in zip(personal_fields, row):
                    if is_invalid(val):
                        key = "unknown"
                    else:
                        key = str(val)
                    key = key.lower()
                    personal_cts[field][key] += 1

            for field in personal_fields:
                setattr(insights.personal_profile, field, dict(personal_cts[field]))

            # 4) FINANCIAL
            financial_fields = [
                'income_range', 'net_worth_range', 'credit_score_range',
                'credit_cards', 'bank_card', 'credit_card_premium',
                'credit_card_new_issue', 'number_of_credit_lines',
                'credit_range_of_new_credit', 'donor', 'investor',
                'mail_order_donor'
            ]
            fin_cts: defaultdict[str, Counter] = defaultdict(Counter)
            rows = self.enrichment.financial(asids)

            for row in rows:
                for field, val in zip(financial_fields, row):
                    if is_invalid(val):
                        if field == "number_of_credit_lines" and str(val) == "2":
                            key = str(val)
                        else:
                            key = "unknown"
                    elif field == "credit_cards":
                        raw = val.strip("[]")
                        raw = raw.replace("'", "").replace('"', "")
                        cards = [c.strip().lower() for c in raw.split(",") if c.strip()]
                        for card in cards:
                            fin_cts[field][card] += 1
                        continue
                    else:
                        key = str(val)
                    key = key.lower()
                    fin_cts[field][key] += 1

            for field in financial_fields:
                setattr(insights.financial, field, dict(fin_cts[field]))

            # 5) LIFESTYLE
            lifestyle_fields = [
                'own_pets', 'cooking_interest', 'travel_interest',
                'mail_order_buyer', 'online_purchaser', 'book_reader',
                'health_and_beauty_interest', 'fitness_interest',
                'outdoor_interest', 'tech_interest', 'diy_interest',
                'automotive', 'smoker', 'golf_interest',
                'beauty_cosmetic_interest'
            ]
            life_cts: defaultdict[str, Counter] = defaultdict(Counter)
            rows = self.enrichment.lifestyles(asids)

            for row in rows:
                for field, val in zip(lifestyle_fields, row):
                    if is_invalid(val):
                        key = "unknown"
                    else:
                        key = str(val)
                    key = key.lower()
                    life_cts[field][key] += 1

            for field in lifestyle_fields:
                setattr(insights.lifestyle, field, dict(life_cts[field]))

            # 6) VOTER
            voter_fields = ['congressional_district', 'voting_propensity', 'political_party']
            voter_cts: defaultdict[str, Counter] = defaultdict(Counter)
            rows = self.enrichment.voter(asids)

            for row in rows:
                for field, val in zip(voter_fields, row):
                    if is_invalid(val):
                        key = "unknown"
                    else:
                        key = str(val)
                    key = key.lower()
                    voter_cts[field][key] += 1

            for field in voter_fields:
                setattr(insights.voter, field, dict(voter_cts[field]))

        if audience_type == BusinessType.B2B or audience_type == BusinessType.ALL:
            # 7) PROFESSIONAL PROFILE
            prof_fields = [
                "current_job_title", "current_company_name", "job_start_date",
                "job_duration", "job_location", "job_level", "department",
                "company_size", "primary_industry", "annual_sales"
            ]
            prof_cts: defaultdict[str, Counter] = defaultdict(Counter)
            prof_rows = self.enrichment.professional(asids)

            for row in prof_rows:
                for field, val in zip(prof_fields, row):
                    if is_invalid(val):
                        key = "unknown"
                    else:
                        key = str(val)
                    key = key.lower()
                    prof_cts[field][key] += 1

            for field in prof_fields:
                setattr(insights.professional_profile, field, dict(prof_cts[field]))

            # 8) EMPLOYMENT HISTORY
            emp_fields = [
                "job_title", "company_name", "start_date",
                "end_date", "is_current", "location", "job_description"
            ]
            emp_cts: defaultdict[str, Counter] = defaultdict(Counter)
            emp_rows = self.enrichment.employment(asids)

            for row in emp_rows:
                for field, val in zip(emp_fields, row):
                    if is_invalid(val):
                        key = "unknown"
                    else:
                        key = str(val)
                    key = key.lower()
                    emp_cts[field][key] += 1

            for field in emp_fields:
                setattr(insights.employment_history, field, dict(emp_cts[field]))

        return insights


    def process_insights(
        self,
        source_id: UUID,
        audience_type: BusinessType = BusinessType.ALL,
    ) -> "InsightsByCategory":
        self.db.commit()
        with self.db.begin():
            try:
                source_row = self.sources.get_by_id_for_update(source_id)
            except NoResultFound:
                source_row.matched_records_status = "complete"
                return InsightsByCategory()

            user_ids = [uid for (uid,) in self.matched_persons.by_source_id(source_id)]
            if not user_ids:
                source_row.matched_records_status = "complete"
                return InsightsByCategory()

            asids = [asid for (asid,) in self.enrichment.users(user_ids)]
            if not asids:
                source_row.matched_records_status = "complete"
                return InsightsByCategory()

            new_insights = InsightsByCategory()
            new_insights = self.process_insights_for_asids(
                new_insights, asids, audience_type
            )

            merged = InsightsUtils.merge_insights_json(
                existing=source_row.insights,
                new_insights=new_insights
            )
            source_row.insights = merged
            source_row.matched_records_status = "complete"
        return new_insights


    def compute_insights_for_lookalike(
        self,
        lookalike_id: UUID,
    ) -> InsightsByCategory:
        insights = InsightsByCategory()
        user_ids = [uid for (uid,) in self.audience_persons.by_lookalike_id(lookalike_id)]
        if not user_ids:
            return insights

        asids = [asid for (asid,) in self.enrichment.users(user_ids) ]

        return self.process_insights_for_asids(insights, asids, audience_type=BusinessType.ALL)

    @staticmethod
    def merge_insights_json(
        existing: Optional[Dict[str, Any]],
        new_insights: "InsightsByCategory"
    ) -> Dict[str, Any]:
        existing_data = existing or {}
        new_data: Dict[str, Any] = new_insights.dict()
        merged: Dict[str, Any] = {}
        for category, new_metrics in new_data.items():
            old_metrics = existing_data.get(category, {}) or {}
            merged_metrics: Dict[str, Dict[str, int]] = {}
            for metric in set(old_metrics) | set(new_metrics):
                old_bucket = old_metrics.get(metric, {}) or {}
                new_bucket = new_metrics.get(metric, {}) or {}
                merged_bucket: Dict[str, int] = {}
                for key in set(old_bucket) | set(new_bucket):
                    merged_bucket[key] = old_bucket.get(key, 0) + new_bucket.get(key, 0)
                merged_metrics[metric] = merged_bucket
            merged[category] = merged_metrics
        return merged