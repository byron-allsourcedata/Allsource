import uuid
from collections import defaultdict, Counter
from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session

from models import AudienceSourcesMatchedPerson, EnrichmentUserId, EnrichmentPersonalProfiles, \
    EnrichmentFinancialRecord, EnrichmentLifestyle, EnrichmentVoterRecord, AudienceLookalikesPerson
from schemas.insights import InsightsByCategory


class InsightsUtils:
    @staticmethod
    def bucket_age(age_range) -> str:
        try:
            age = age_range.lower
        except AttributeError:
            return "Other"
        if 18 <= age <= 25:
            return "18-25"
        if 26 <= age <= 30:
            return "26-30"
        if 31 <= age <= 35:
            return "31-35"
        if 36 <= age <= 45:
            return "36-45"
        if 46 <= age <= 65:
            return "46-65"
        return "Other"

    @staticmethod
    def process_insights_for_asids(insights, asids: List[uuid.UUID], db_session: Session):
        # 3) PERSONAL
        personal_fields = [
            "gender", "state", "religion", "homeowner",
            "age", "ethnicity", "languages",
            "marital_status", "have_children",
            "education_level", "children_ages", "pets"
        ]
        personal_cts: defaultdict[str, Counter] = defaultdict(Counter)
        rows = (
            db_session.query(
                EnrichmentPersonalProfiles.gender,
                EnrichmentPersonalProfiles.state_abbr,
                EnrichmentPersonalProfiles.religion,
                EnrichmentPersonalProfiles.homeowner,
                EnrichmentPersonalProfiles.age,
                EnrichmentPersonalProfiles.ethnicity,
                EnrichmentPersonalProfiles.language_code,
                EnrichmentPersonalProfiles.marital_status,
                EnrichmentPersonalProfiles.has_children,
            )
            .filter(EnrichmentPersonalProfiles.asid.in_(asids))
            .all()
        )

        for row in rows:
            for field, val in zip(personal_fields, row):
                if field == "age":
                    key = InsightsUtils.bucket_age(val)
                elif val is None:
                    if field in ("have_children", "gender", "marital_status", "homeowner"):
                        key = "2"
                    elif field in ("religion", "ethnicity", "state"):
                        key = "Other"
                    else:
                        key = "None"
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
        rows = db_session.query(
            EnrichmentFinancialRecord.income_range,
            EnrichmentFinancialRecord.net_worth,
            EnrichmentFinancialRecord.credit_rating,
            EnrichmentFinancialRecord.credit_cards,
            EnrichmentFinancialRecord.bank_card,
            EnrichmentFinancialRecord.credit_card_premium,
            EnrichmentFinancialRecord.credit_card_new_issue,
            EnrichmentFinancialRecord.credit_lines,
            EnrichmentFinancialRecord.credit_range_of_new_credit_lines,
            EnrichmentFinancialRecord.donor,
            EnrichmentFinancialRecord.investor,
            EnrichmentFinancialRecord.mail_order_donor,
        ).filter(
            EnrichmentFinancialRecord.asid.in_(asids)
        ).all()

        for row in rows:
            for field, val in zip(financial_fields, row):
                if val is None:
                    if field in {
                        "donor",
                        "credit_card_premium",
                        "investor",
                        "bank_card",
                        "mail_order_donor",
                        "credit_card_new_issue",
                    }:
                        key = "2"
                    elif field in {
                        "number_of_credit_lines",
                        "income_range",
                        "net_worth_range",
                        "credit_score_range",
                        "credit_cards",
                        "credit_range_of_new_credit",
                    }:
                        key = "Other"
                    else:
                        key = "None"
                else:
                    if field == "credit_cards":
                        key = val.strip("[]")
                        key = key.replace("'", "").replace('"', "")
                        key = ", ".join(item.strip() for item in key.split(",") if item)
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
        rows = db_session.query(
            EnrichmentLifestyle.pets,
            EnrichmentLifestyle.cooking_enthusiast,
            EnrichmentLifestyle.travel,
            EnrichmentLifestyle.mail_order_buyer,
            EnrichmentLifestyle.online_purchaser,
            EnrichmentLifestyle.book_reader,
            EnrichmentLifestyle.health_and_beauty,
            EnrichmentLifestyle.fitness,
            EnrichmentLifestyle.outdoor_enthusiast,
            EnrichmentLifestyle.tech_enthusiast,
            EnrichmentLifestyle.diy,
            EnrichmentLifestyle.automotive_buff,
            EnrichmentLifestyle.smoker,
            EnrichmentLifestyle.golf_enthusiasts,
            EnrichmentLifestyle.beauty_cosmetics,
        ).filter(
            EnrichmentLifestyle.asid.in_(asids)
        ).all()

        for row in rows:
            for field, val in zip(lifestyle_fields, row):
                key = "Other" if val is None else str(val)
                key = key.lower()
                life_cts[field][key] += 1

        for field in lifestyle_fields:
            setattr(insights.lifestyle, field, dict(life_cts[field]))

        # 6) VOTER
        voter_fields = ['congressional_district', 'voting_propensity', 'political_party']
        voter_cts: defaultdict[str, Counter] = defaultdict(Counter)
        rows = db_session.query(
            EnrichmentVoterRecord.congressional_district,
            EnrichmentVoterRecord.voting_propensity,
            EnrichmentVoterRecord.party_affiliation,
        ).filter(
            EnrichmentVoterRecord.asid.in_(asids)
        ).all()

        for row in rows:
            for field, val in zip(voter_fields, row):
                if field in ('congressional_district', 'voting_propensity'):
                    key = "Other" if val is None else str(val)
                elif field == 'political_party':
                    key = "Other" if val is None or str(val).upper() == 'UNKNOWN' else str(val)
                else:
                    key = str(val)
                key = key.lower()
                voter_cts[field][key] += 1

        for field in voter_fields:
            setattr(insights.voter, field, dict(voter_cts[field]))

        return insights

    @staticmethod
    def process_insights(
        source_id: str,
        db_session: Session,
    ) -> "InsightsByCategory":
        insights = InsightsByCategory()

        user_ids: List[uuid.UUID] = [
            uid for (uid,) in db_session
            .query(AudienceSourcesMatchedPerson.enrichment_user_id)
            .filter(AudienceSourcesMatchedPerson.source_id == source_id)
            .all()
        ]
        if not user_ids:
            return insights

        asids: List[uuid.UUID] = [
            asid for (asid,) in db_session
            .query(EnrichmentUserId.asid)
            .filter(EnrichmentUserId.id.in_(user_ids))
            .all()
        ]

        return InsightsUtils.process_insights_for_asids(insights, asids, db_session)

    @staticmethod
    def compute_insights_for_lookalike(
            lookalike_id: uuid.UUID,
            db_session: Session
    ) -> InsightsByCategory:
        insights = InsightsByCategory()
        user_ids = [
            uid for (uid,) in db_session
            .query(AudienceLookalikesPerson.enrichment_user_id)
            .filter(AudienceLookalikesPerson.lookalike_id == lookalike_id)
            .all()
        ]
        if not user_ids:
            return insights

        asids = [
            asid for (asid,) in db_session
            .query(EnrichmentUserId.asid)
            .filter(EnrichmentUserId.id.in_(user_ids))
            .all()
        ]
        
        return InsightsUtils.process_insights_for_asids(insights, asids, db_session)

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