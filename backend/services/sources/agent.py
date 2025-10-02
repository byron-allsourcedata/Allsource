from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal
import logging
from typing import Callable, Iterable, List, Dict
from uuid import UUID

import dateparser
from pydantic import BaseModel
from services.sources.math import AudienceSourceMath
from db_dependencies import Db, Clickhouse
from persistence.enrichment_users import EnrichmentUsersPersistence, EmailAsid
from resolver import injectable
from schemas.scripts.audience_source import PersonEntry, PersonRow
import json
from schemas.source_agent import Stats

logger = logging.getLogger(__name__)


class ProfContact(BaseModel):
    job_level: str | None
    department: str | None
    company_size: str | None
    business_email: str | None
    business_email_validation_status: str | None
    linkedin_url: str | None


class EmploymentEntry(BaseModel):
    job_title: str | None = None
    company_name: str | None = None
    location: str | None = None
    job_tenure: str | None = None
    number_of_jobs: str | None = None
    start_date: str | None = None
    end_date: str | None = None


@injectable
class SourceAgentService:
    def __init__(
        self,
        db: Db,
        clickhouse: Clickhouse,
        enrichment_users: EnrichmentUsersPersistence,
    ):
        self.db = db
        self.clickhouse = clickhouse
        self.enrichment_users = enrichment_users

    def _run_query(
        self,
        sql: str,
        params: Dict | None = None,
    ):
        result = self.clickhouse.query(sql, params)
        return result.result_rows if hasattr(result, "result_rows") else result

    def get_user_ids_by_emails(
        self,
        emails: Iterable[str],
    ) -> List[EmailAsid]:
        return self.enrichment_users.get_user_ids_by_emails(emails)

    def get_user_ids_by_asids(
        self,
        asids: Iterable[str],
    ) -> List[EmailAsid]:
        return self.enrichment_users.get_user_ids_by_asids(asids)

    def get_details_by_asids(
        self,
        asids: Iterable[UUID | str],
    ) -> Dict[UUID, ProfContact]:
        asid_list: List[str] = [str(a) for a in asids]
        if not asid_list:
            logger.debug("get_details_by_asids: empty input")
            return {}

        sql = """
        SELECT asid,
               job_level,
               department,
               company_size,
               business_email,
               business_email_validation_status,
               linkedin_url
        FROM enrichment_users
        WHERE asid IN %(ids)s
        """

        rows = self._run_query(sql, {"ids": asid_list})

        contacts: Dict[UUID, ProfContact] = {
            asid: ProfContact(
                job_level=job_level,
                department=department,
                company_size=company_size,
                business_email=b_email,
                business_email_validation_status=b_email_status,
                linkedin_url=linkedin,
            )
            for (
                asid,
                job_level,
                department,
                company_size,
                b_email,
                b_email_status,
                linkedin,
            ) in rows
        }

        logger.debug(
            "Fetched %d prof/contact rows in ClickHouse for %d asids",
            len(contacts),
            len(asid_list),
        )
        return contacts

    def fetch_fields_by_asids(
        self,
        asids: Iterable[UUID | str],
        columns: list[str],
    ) -> list[tuple]:
        if not asids:
            return []

        sql = (
            f"SELECT {', '.join(columns)} "
            "FROM enrichment_users "
            "WHERE asid IN %(ids)s"
        )

        return self._run_query(sql, {"ids": asids})

    def get_employment_by_asids(
        self, asids: Iterable[UUID | str]
    ) -> Dict[UUID, List[EmploymentEntry]]:
        if not asids:
            return {}

        sql = """
        SELECT asid, employment_json
        FROM enrichment_users
        WHERE asid IN %(ids)s
        """

        rows = self._run_query(sql, {"ids": [str(a) for a in asids]})

        results: Dict[UUID, List[EmploymentEntry]] = {}
        for asid, json_str in rows:
            try:
                parsed = json.loads(json_str or "[]")  # list[dict]
                entries = [
                    EmploymentEntry(**e) for e in parsed if isinstance(e, dict)
                ]

                asid_uuid = asid if isinstance(asid, UUID) else UUID(str(asid))
                results[asid_uuid] = entries
            except (json.JSONDecodeError, TypeError, ValueError) as err:
                logger.warning(
                    f"Failed to parse employment_json for {asid}: {err}"
                )
                asid_uuid = asid if isinstance(asid, UUID) else UUID(str(asid))
                results[asid_uuid] = []

        return results

    def normalize_b2b(
        self, persons: List[PersonEntry], source_id: str, stats: Stats
    ) -> List[dict]:
        # B2B Algorithm:
        # For B2B, the score is a combination of three components:
        # 1. Recency Score based on BUSINESS_EMAIL_LAST_SEEN_DATE.
        # 2. Professional Score calculated from JobLevel, Department, and CompanySize.
        # 3. Completeness Score based on the presence of a valid business email, LinkedIn URL,
        #    and non-null professional attributes.
        matched_ids = [UUID(p.id) for p in persons]
        prof_rows = self.repo.profile_rows(matched_ids)
        profile_map = {row.mp_id: row for row in prof_rows}

        contact_rows = self.repo.contact_rows(matched_ids)

        contact_map = {row.mp_id: row for row in contact_rows}

        inverted_values = []

        for person in persons:
            inv = AudienceSourceMath.inverted_decimal(Decimal(person.recency))
            inverted_values.append(inv)

        job_level_map = {
            "Executive": Decimal("1.0"),
            "Senior": Decimal("0.8"),
            "Manager": Decimal("0.6"),
            "Entry": Decimal("0.4"),
        }
        department_map = {
            "Sales": Decimal("1.0"),
            "Marketing": Decimal("0.8"),
            "Engineering": Decimal("0.6"),
        }
        company_size_map = {
            "1000+": Decimal("1.0"),
            "501-1000": Decimal("0.8"),
            "101-500": Decimal("0.6"),
            "51-100": Decimal("0.4"),
        }

        updates = []
        for idx, person in enumerate(persons):
            recency_inv = inverted_values[idx]
            recency_score = AudienceSourceMath.normalize_decimal(
                value=recency_inv, min_val=stats.min_inv, max_val=stats.max_inv
            )
            prof = profile_map.get(UUID(person.id))
            job_level = getattr(prof, "job_level", None)
            department = getattr(prof, "department", None)
            company_size = getattr(prof, "company_size", None)

            job_level_weight = job_level_map.get(job_level, Decimal("0.2"))
            department_weight = department_map.get(department, Decimal("0.4"))
            company_size_weight = company_size_map.get(
                company_size, Decimal("0.2")
            )

            professional_score = (
                Decimal("0.5") * job_level_weight
                + Decimal("0.3") * department_weight
                + Decimal("0.2") * company_size_weight
            )
            completeness_score = Decimal("0.0")
            contact = contact_map.get(UUID(person.id))
            completeness = Decimal("0.0")
            if (
                contact
                and contact.business_email
                and contact.business_email_validation_status == "Valid"
            ):
                completeness += Decimal("0.4")
            if contact and contact.linkedin_url:
                completeness += Decimal("0.3")
            if job_level:
                completeness_score += Decimal("0.2")
            if department:
                completeness_score += Decimal("0.1")
            lead_value_score_b2b = (
                Decimal("0.4") * recency_score
                + Decimal("0.4") * professional_score
                + Decimal("0.2") * completeness_score
            )
            update_data = {
                "id": person.id,
                "source_id": source_id,
                "email": person.email,
                "recency_min": stats.min_recency,
                "recency_max": stats.max_recency,
                "inverted_recency": inverted_values[idx],
                "inverted_recency_min": stats.min_inv,
                "inverted_recency_max": stats.max_inv,
                "recency_score": recency_score,
                "view_score": professional_score,
                "sum_score": completeness_score,
                "value_score": lead_value_score_b2b,
            }
            updates.append(update_data)
        return updates

    def _aggregate_matched_persons(
        self,
        filtered_persons: List[PersonRow],
        date_range: int | None,
        include_amount: bool,
        get_key: Callable[[object], str],
        get_enrichment_asid: Callable[[object], str | None],
        get_email_for_person: Callable[[object], str | None],
    ) -> dict:
        matched_persons = defaultdict(
            lambda: {
                "orders_amount": Decimal("0.0") if include_amount else None,
                "orders_count": 0,
                "start_date": None,
                "enrichment_user_asid": None,
                "email": None,
            }
        )

        for person in filtered_persons:
            key = get_key(person)
            if not key:
                continue

            transaction_date = (person.date or "").strip()
            transaction_date_without_timezone = None
            if transaction_date:
                try:
                    transaction_date_without_timezone = dateparser.parse(
                        transaction_date
                    )
                    if transaction_date_without_timezone is not None:
                        transaction_date_without_timezone = (
                            transaction_date_without_timezone.replace(
                                tzinfo=None
                            )
                        )
                except Exception as e:
                    logger.warning(
                        f"Error parsing date '{transaction_date}': {e}"
                    )
                    transaction_date_without_timezone = None

            if (
                date_range
                and transaction_date_without_timezone
                and transaction_date_without_timezone
                < (datetime.now() - timedelta(days=date_range))
            ):
                continue

            sale_amount = (
                person.get_sale_amount() if include_amount else Decimal("0.0")
            )

            enrichment_asid = get_enrichment_asid(person)
            email_val = get_email_for_person(person)

            if key in matched_persons:
                matched_persons[key]["orders_count"] += 1
                if include_amount:
                    matched_persons[key]["orders_amount"] += sale_amount
                if transaction_date_without_timezone:
                    existing_date = matched_persons[key]["start_date"]
                    if (
                        existing_date is None
                        or transaction_date_without_timezone > existing_date
                    ):
                        matched_persons[key]["start_date"] = (
                            transaction_date_without_timezone
                        )
            else:
                matched_persons[key] = {
                    "orders_count": 1,
                    "start_date": transaction_date_without_timezone,
                    "enrichment_user_asid": enrichment_asid,
                    "email": email_val,
                    "orders_amount": sale_amount if include_amount else None,
                }

        return matched_persons

    def processing_asid_mode_matching(
        self,
        persons: List[PersonRow],
        date_range: int | None,
        include_amount: bool,
    ):
        asids = {
            str(getattr(p, "asid")).strip()
            for p in persons
            if getattr(p, "asid", None)
        }
        if not asids:
            logger.info("No valid asids found in input data (asid-mode).")
            return {}

        raw_matched_persons = self.get_user_ids_by_asids(list(asids))
        if not raw_matched_persons:
            logger.info("No matching asids found in ClickHouse.")
            return {}

        asid_to_email: Dict[str, str | None] = {}
        for raw_matched_person in raw_matched_persons:
            if not raw_matched_person or not getattr(
                raw_matched_person, "asid", None
            ):
                continue
            asid_value = str(raw_matched_person.asid).strip()
            email_matched_person = (
                raw_matched_person.email.strip().lower()
                if getattr(raw_matched_person, "email", None)
                else None
            )
            asid_to_email[asid_value] = email_matched_person

        filtered_persons = [
            p
            for p in persons
            if getattr(p, "asid", None)
            and str(p.asid).strip().lower() in asid_to_email
        ]

        if not filtered_persons:
            logger.info(
                "No valid persons left after filtering by enrichment_asids."
            )
            return {}

        return self._aggregate_matched_persons(
            filtered_persons=filtered_persons,
            date_range=date_range,
            include_amount=include_amount,
            get_key=lambda p: f"asid:{str(getattr(p, 'asid')).strip()}",
            get_enrichment_asid=lambda p: str(getattr(p, "asid")).strip(),
            get_email_for_person=lambda p: asid_to_email.get(
                str(getattr(p, "asid")).strip()
            ),
        )

    def processing_email_mode_matching(
        self,
        persons: List[PersonRow],
        date_range: int | None,
        include_amount: bool,
    ):
        emails = {
            p.email.strip().lower()
            for p in persons
            if getattr(p, "email", None)
        }
        if not emails:
            logger.info("No valid emails found in input data (email-mode).")
            return {}

        raw_matched_persons = self.get_user_ids_by_emails(list(emails))
        if not raw_matched_persons:
            logger.info("No matching emails found in ClickHouse.")
            return {}

        email_to_asid: Dict[str, str] = {}
        seen_asids = set()
        for raw_matched_person in raw_matched_persons:
            if (
                not raw_matched_person
                or not getattr(raw_matched_person, "email", None)
                or not getattr(raw_matched_person, "asid", None)
            ):
                continue
            email_value = raw_matched_person.email.strip().lower()
            asid_value = str(raw_matched_person.asid).strip()
            if (
                asid_value not in seen_asids
                and email_value not in email_to_asid
            ):
                email_to_asid[email_value] = asid_value
                seen_asids.add(asid_value)

        filtered_persons = [
            p
            for p in persons
            if getattr(p, "email", None)
            and p.email.strip().lower() in email_to_asid
        ]
        if not filtered_persons:
            logger.info(
                "No valid persons left after filtering by enrichment_emails."
            )
            return {}

        return self._aggregate_matched_persons(
            filtered_persons=filtered_persons,
            date_range=date_range,
            include_amount=include_amount,
            get_key=lambda p: p.email.strip().lower(),
            get_enrichment_asid=lambda p: email_to_asid.get(
                p.email.strip().lower()
            ),
            get_email_for_person=lambda p: p.email.strip().lower(),
        )
