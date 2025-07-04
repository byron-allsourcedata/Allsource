import re
import uuid
from collections import defaultdict, Counter
from itertools import islice
from typing import List, Optional, Dict, Any
from dateutil.parser import parse as parse_date
from datetime import datetime, timedelta

from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import Session

from db_dependencies import Clickhouse
from enums import BusinessType
from models import AudienceSource
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from models.audience_lookalikes_persons import AudienceLookalikesPerson

from models.enrichment import (
    EnrichmentUser,
    EnrichmentPersonalProfiles,
    EnrichmentFinancialRecord,
    EnrichmentLifestyle,
    EnrichmentVoterRecord,
    EnrichmentProfessionalProfile,
    EnrichmentEmploymentHistory,
)

from schemas.insights import InsightsByCategory
from services.source_agent.agent import SourceAgentService

PERSONAL_COLS = [
    "gender",
    "state_abbr       AS state",
    "religion",
    "homeowner",
    "age",
    "ethnicity",
    "language_code    AS languages",
    "marital_status",
    "has_children     AS have_children",
    "pets",
]

FINANCIAL_COLS = [
    "income_range",
    "net_worth                         AS net_worth_range",
    "credit_rating                     AS credit_score_range",
    "credit_cards",
    "bank_card",
    "credit_card_premium",
    "credit_card_new_issue",
    "credit_lines                      AS number_of_credit_lines",
    "credit_range_of_new_credit_lines  AS credit_range_of_new_credit",
    "donor",
    "investor",
    "mail_order_donor",
]

LIFESTYLE_COLS = [
    "pets                  AS own_pets",
    "cooking_enthusiast    AS cooking_interest",
    "travel                AS travel_interest",
    "mail_order_buyer",
    "online_purchaser",
    "book_reader",
    "health_and_beauty     AS health_and_beauty_interest",
    "fitness               AS fitness_interest",
    "outdoor_enthusiast    AS outdoor_interest",
    "tech_enthusiast       AS tech_interest",
    "diy                   AS diy_interest",
    "automotive_buff       AS automotive",
    "smoker",
    "golf_enthusiast       AS golf_interest",
    "beauty_cosmetics      AS beauty_cosmetic_interest",
]

VOTER_COLS = [
    "congressional_district",
    "voting_propensity",
    "party_affiliation      AS political_party",
]

PROF_COLS = [
    "current_job_title",
    "current_company_name",
    "job_start_date",
    "job_duration",
    "job_location",
    "job_level",
    "department",
    "company_size",
    "primary_industry",
    "annual_sales",
]

EMPLOYMENT_COLS = [
    "job_title",
    "company_name",
    "start_date",
    "end_date",
    "is_current",
    "location AS job_location",
    "job_description",
    "job_tenure",
]

COLUMNS_BY_CATEGORY: Dict[str, List[str]] = {
    "personal": PERSONAL_COLS,
    "financial": FINANCIAL_COLS,
    "lifestyle": LIFESTYLE_COLS,
    "voter": VOTER_COLS,
    "professional": PROF_COLS,
    "employment": EMPLOYMENT_COLS,
}

MAX_IDS_PER_BATCH = 5_000


class InsightsUtils:
    @staticmethod
    def bucket_age(age_range: Optional[str]) -> str:
        low = None

        if low is None and isinstance(age_range, str):
            m = re.search(r"(\d+)", age_range)
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

    @staticmethod
    def _chunk(iterable, size: int):
        it = iter(iterable)
        while True:
            batch = list(islice(it, size))
            if not batch:
                break
            yield batch

    @staticmethod
    def is_invalid(val: Any) -> bool:
        return val is None or str(val).upper() in {"UNKNOWN", "U", "2", "", "-"}

    @staticmethod
    def process_insights_for_asids(
        insights,
        asids: List[uuid.UUID],
        source_agent: SourceAgentService,
        audience_type: BusinessType,
    ):
        if not asids:
            return insights

        categories: list[str] = []
        if audience_type in (BusinessType.B2C, BusinessType.ALL):
            categories += ["personal", "financial", "lifestyle", "voter"]
        if audience_type in (BusinessType.B2C, BusinessType.ALL):
            categories += ["professional", "employment"]

        buckets: Dict[str, Dict[str, Counter]] = {
            cat: defaultdict(Counter) for cat in COLUMNS_BY_CATEGORY
        }

        # Дополнительно для подсчета кол-ва вакансий за 5 лет по asid
        jobs_last_5_years_counter: Counter = Counter()
        five_years_ago = datetime.utcnow() - timedelta(days=365 * 5)

        for cat in categories:
            columns = COLUMNS_BY_CATEGORY[cat]

            for batch in InsightsUtils._chunk(asids, MAX_IDS_PER_BATCH):
                if cat != "employment":
                    rows = source_agent.fetch_fields_by_asids(batch, columns)
                else:
                    # employment_json -> List[EmploymentEntry]
                    employment_data = source_agent.get_employment_by_asids(
                        batch
                    )

                for idx, row in enumerate(
                    rows if cat != "employment" else batch
                ):
                    if cat != "employment":
                        if isinstance(row, (list, tuple)):
                            pairs = zip(columns, row)
                        else:
                            pairs = (
                                (c, row[c.split(" AS ")[-1]]) for c in columns
                            )

                        for raw_col, val in pairs:
                            field = raw_col.split(" AS ")[-1]

                            if field == "age":
                                val = InsightsUtils.bucket_age(val)

                            if InsightsUtils.is_invalid(val):
                                key = "unknown"
                            elif field == "credit_cards":
                                raw = (
                                    str(val or "")
                                    .strip("[]")
                                    .replace("'", "")
                                    .replace('"', "")
                                )
                                for card in (
                                    c.strip().lower()
                                    for c in raw.split(",")
                                    if c.strip()
                                ):
                                    buckets[cat][field][card] += 1
                                continue
                            else:
                                key = str(val).lower()

                            buckets[cat][field][key] += 1
                    else:
                        asid = batch[idx]
                        jobs = employment_data.get(asid, [])
                        if not jobs:
                            continue

                        asid_jobs_count_5y = 0

                        for job_entry in jobs:
                            try:
                                start = (
                                    parse_date(job_entry.start_date)
                                    if job_entry.start_date
                                    else None
                                )
                            except Exception:
                                start = None
                            try:
                                end = (
                                    parse_date(job_entry.end_date)
                                    if job_entry.end_date
                                    else None
                                )
                            except Exception:
                                end = None

                            # Подсчет вакансий за 5 лет
                            if start and start >= five_years_ago:
                                asid_jobs_count_5y += 1

                            if start and end:
                                tenure_months = (end.year - start.year) * 12 + (
                                    end.month - start.month
                                )
                                if tenure_months < 0:
                                    tenure_months = 0
                            elif start and not end:
                                now = datetime.utcnow()
                                tenure_months = (now.year - start.year) * 12 + (
                                    now.month - start.month
                                )
                            else:
                                tenure_months = None

                            # Форматируем tenure
                            if tenure_months is None:
                                tenure_key = "unknown"
                            else:
                                years = tenure_months // 12
                                months = tenure_months % 12

                                parts = []
                                if years > 0:
                                    parts.append(
                                        f"{years} year{'s' if years != 1 else ''}"
                                    )
                                if months > 0:
                                    parts.append(
                                        f"{months} month{'s' if months != 1 else ''}"
                                    )

                                tenure_key = (
                                    " ".join(parts)
                                    if parts
                                    else "Less than 1 month"
                                )

                            # Собираем в buckets по полям
                            def add_val(field_name, val):
                                if InsightsUtils.is_invalid(val):
                                    key = "unknown"
                                else:
                                    key = str(val).lower()
                                buckets["employment"][field_name][key] += 1

                            add_val("company_name", job_entry.company_name)
                            add_val("job_title", job_entry.job_title)
                            add_val("location", job_entry.location)
                            buckets["employment"]["job_tenure"][tenure_key] += 1

                        jobs_last_5_years_counter[str(asid_jobs_count_5y)] += 1

        # Pydantic
        def _fill(target, cols, cat):
            for raw in cols:
                name = raw.split(" AS ")[-1]
                setattr(target, name, dict(buckets[cat][name]))

        if "personal" in categories:
            _fill(insights.personal_profile, PERSONAL_COLS, "personal")
        if "financial" in categories:
            _fill(insights.financial, FINANCIAL_COLS, "financial")
        if "lifestyle" in categories:
            _fill(insights.lifestyle, LIFESTYLE_COLS, "lifestyle")
        if "voter" in categories:
            _fill(insights.voter, VOTER_COLS, "voter")
        if "professional" in categories:
            _fill(insights.professional_profile, PROF_COLS, "professional")
        if "employment" in categories:
            setattr(
                insights.employment_history,
                "number_of_jobs_last_5_years",
                dict(jobs_last_5_years_counter),
            )
            _fill(insights.employment_history, EMPLOYMENT_COLS, "employment")
        return insights

    @staticmethod
    def process_insights(
        source_id: str,
        db_session: Session,
        source_agent: SourceAgentService = None,
        audience_type: BusinessType = BusinessType.ALL,
    ) -> InsightsByCategory:
        db_session.commit()
        with db_session.begin():
            try:
                source_row = (
                    db_session.query(AudienceSource)
                    .filter(AudienceSource.id == source_id)
                    .with_for_update()
                    .one()
                )
            except NoResultFound:
                source_row.matched_records_status = "complete"
                return InsightsByCategory()

            asids = [
                uid
                for (uid,) in db_session.query(
                    AudienceSourcesMatchedPerson.enrichment_user_asid
                )
                .filter(AudienceSourcesMatchedPerson.source_id == source_id)
                .all()
            ]

            if not asids:
                source_row.matched_records_status = "complete"
                return InsightsByCategory()

            new_insights = InsightsByCategory()
            new_insights = InsightsUtils.process_insights_for_asids(
                insights=new_insights,
                asids=asids,
                audience_type=audience_type,
                source_agent=source_agent,
            )

            merged = InsightsUtils.merge_insights_json(
                existing=source_row.insights, new_insights=new_insights
            )
            source_row.insights = merged
            source_row.matched_records_status = "complete"
        return new_insights

    @staticmethod
    def compute_insights_for_lookalike(
        lookalike_id: uuid.UUID,
        db_session: Session,
        source_agent: SourceAgentService,
    ) -> InsightsByCategory:
        insights = InsightsByCategory()
        asids = [
            uid
            for (uid,) in db_session.query(
                AudienceLookalikesPerson.enrichment_user_asid
            )
            .filter(AudienceLookalikesPerson.lookalike_id == lookalike_id)
            .all()
        ]

        if not asids:
            return insights

        return InsightsUtils.process_insights_for_asids(
            insights=insights,
            asids=asids,
            audience_type=BusinessType.ALL,
            source_agent=source_agent,
        )

    @staticmethod
    def merge_insights_json(
        existing: Optional[Dict[str, Any]], new_insights: InsightsByCategory
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
                    merged_bucket[key] = old_bucket.get(
                        key, 0
                    ) + new_bucket.get(key, 0)
                merged_metrics[metric] = merged_bucket
            merged[category] = merged_metrics
        return merged
