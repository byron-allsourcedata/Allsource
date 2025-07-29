import logging
from typing import Iterable, List, Dict
from uuid import UUID

from pydantic import BaseModel
from db_dependencies import Db, Clickhouse
from persistence.enrichment_users import EnrichmentUsersPersistence, EmailAsid
from resolver import injectable
import time
import json

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
