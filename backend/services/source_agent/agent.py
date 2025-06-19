import inspect
import logging
import asyncio
from typing import Iterable, List, Dict
from uuid import UUID

from pydantic import BaseModel, EmailStr

from db_dependencies import Db, Clickhouse
from resolver import injectable

logger = logging.getLogger(__name__)


class EmailAsid(BaseModel):
    email: EmailStr
    asid: str


import asyncio
import inspect
import logging
from typing import Iterable, List, Sequence

from pydantic import BaseModel, EmailStr
from db_dependencies import Db, Clickhouse
from resolver import injectable

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

    async def _run_query(
        self,
        sql: str,
        params: Dict | None = None,
    ):
        result = self.clickhouse.query(sql, params)
        return result.result_rows if hasattr(result, "result_rows") else result

    async def get_user_ids_by_emails(
        self,
        emails: Iterable[str],
    ) -> List[EmailAsid]:
        emails_clean: List[str] = [e.strip() for e in emails if e]
        if not emails_clean:
            logger.debug("get_user_ids_by_emails: empty input")
            return []

        sql = """
                SELECT email, asid
                FROM enrichment_users
                WHERE email IN %(ids)s
                """

        rows = await self._run_query(sql, {"ids": emails_clean})

        result = [
            EmailAsid(email=email.lower(), asid=str(asid))
            for email, asid in rows
        ]

        logger.debug(
            "Found %d matches in ClickHouse for %d input emails",
            len(result),
            len(emails_clean),
        )
        return result

    async def get_details_by_asids(
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

        rows = await self._run_query(sql, {"ids": asid_list})

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
