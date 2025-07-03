import logging
from typing import Iterable, List, Dict
from uuid import UUID

from pydantic import BaseModel, EmailStr
from db_dependencies import Db, Clickhouse
from resolver import injectable
import time

logger = logging.getLogger(__name__)


class EmailAsid(BaseModel):
    email: EmailStr
    asid: str


class ProfContact(BaseModel):
    job_level: str | None
    department: str | None
    company_size: str | None
    business_email: str | None
    business_email_validation_status: str | None
    linkedin_url: str | None


@injectable
class SourceAgentService:
    def __init__(self, db: Db, clickhouse: Clickhouse):
        self.db = db
        self.clickhouse = clickhouse

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
        emails_clean: List[str] = [
            e.strip().lower() for e in emails if e and "@" in e
        ]
        if not emails_clean:
            logger.debug("get_user_ids_by_emails: empty input")
            return []

        matched: dict[str, EmailAsid] = {}

        count_business = 0
        count_personal = 0
        count_other = 0

        # --- Business email
        sql_business = """
            SELECT business_email, asid
            FROM enrichment_users
            WHERE business_email IN %(ids)s
        """
        start_time = time.perf_counter()
        rows = self._run_query(sql_business, {"ids": emails_clean})
        elapsed = time.perf_counter() - start_time
        logger.info(
            "Business email query returned %d rows in %.4f seconds",
            len(rows),
            elapsed,
        )

        for email, asid in rows:
            if not email or not isinstance(email, str):
                continue
            email_l = email.strip().lower()
            if email_l not in matched:
                matched[email_l] = EmailAsid(email=email_l, asid=str(asid))
                count_business += 1

        remaining = [e for e in emails_clean if e not in matched]

        # --- Personal email
        if remaining:
            sql_personal = """
                SELECT personal_email, asid
                FROM enrichment_users
                WHERE personal_email IN %(ids)s
            """
            start_time = time.perf_counter()
            rows = self._run_query(sql_personal, {"ids": remaining})
            elapsed = time.perf_counter() - start_time
            logger.info(
                "Personal email query returned %d rows in %.4f seconds",
                len(rows),
                elapsed,
            )

            for email, asid in rows:
                if not email or not isinstance(email, str):
                    continue
                email_l = email.strip().lower()
                if email_l not in matched:
                    matched[email_l] = EmailAsid(email=email_l, asid=str(asid))
                    count_personal += 1

            remaining = [e for e in remaining if e not in matched]

        # --- Other emails (array)
        if remaining:
            sql_other = """
                SELECT other_email, asid
                FROM (
                    SELECT arrayJoin(other_emails) AS other_email, asid
                    FROM enrichment_users
                )
                WHERE other_email IN %(ids)s
            """
            start_time = time.perf_counter()
            rows = self._run_query(sql_other, {"ids": remaining})
            elapsed = time.perf_counter() - start_time
            logger.info(
                "Other email query returned %d rows in %.4f seconds",
                len(rows),
                elapsed,
            )

            for email, asid in rows:
                if not email or not isinstance(email, str):
                    continue
                email_l = email.strip().lower()
                if email_l not in matched:
                    matched[email_l] = EmailAsid(email=email_l, asid=str(asid))
                    count_other += 1

        result = list(matched.values())

        logger.info(
            "Finished email matching: %d total matches (from %d input). Business: %d, Personal: %d, Other: %d",
            len(result),
            len(emails_clean),
            count_business,
            count_personal,
            count_other,
        )
        return result

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
            UUID(asid): ProfContact(
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
