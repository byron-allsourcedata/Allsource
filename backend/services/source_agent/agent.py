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


def _chunk(seq: Sequence[str], size: int) -> Iterable[Sequence[str]]:
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


@injectable
class SourceAgentService:
    def __init__(self, db: Db, clickhouse: Clickhouse):
        self.db = db
        self.clickhouse = clickhouse

    async def _run_query(self, sql: str):
        query_fn = self.clickhouse.query
        if inspect.iscoroutinefunction(query_fn):
            result = await query_fn(sql)
        else:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, query_fn, sql)
        return result.result_rows if hasattr(result, "result_rows") else result

    async def get_user_ids_by_emails(
        self,
        emails: Iterable[str],
        batch_size: int = 5_000,
    ) -> List[EmailAsid]:
        emails_clean = [e.strip().lower() for e in emails if e]
        if not emails_clean:
            logger.debug("get_user_ids_by_emails: empty input")
            return []

        results: List[EmailAsid] = []

        for chunk in _chunk(emails_clean, batch_size):
            literals = ", ".join(f"'{e.replace('\'', '\'\'')}'" for e in chunk)
            sql = (
                "SELECT email, asid "
                "FROM enrichment_users "
                f"WHERE email IN ({literals})"
            )

            rows = await self._run_query(sql)
            results.extend(
                EmailAsid(email=email.lower(), asid=str(asid))
                for email, asid in rows
            )

        logger.debug(
            "Found %d matches in ClickHouse for %d input emails "
            "using batch_size=%d",
            len(results),
            len(emails_clean),
            batch_size,
        )
        return results

    async def get_details_by_asids(
        self,
        asids: Iterable[UUID] | Iterable[str],
        batch_size: int = 5_000,
    ) -> Dict[UUID, ProfContact]:
        asid_list = [str(a) for a in asids]
        if not asid_list:
            logger.debug("get_details_by_asids: empty input")
            return {}

        acc: Dict[UUID, ProfContact] = {}

        for chunk in _chunk(asid_list, batch_size):
            literals = ", ".join(f"'{cid}'" for cid in chunk)
            sql = (
                "SELECT asid, "
                "       job_level, department, company_size, "
                "       business_email, business_email_validation_status, "
                "       linkedin_url "
                "FROM maximiz_local.enrichment_users "
                f"WHERE asid IN ({literals})"
            )
            rows = await self._run_query(sql)
            for (
                asid,
                job_level,
                department,
                company_size,
                b_email,
                b_email_status,
                linkedin,
            ) in rows:
                acc[UUID(asid)] = ProfContact(
                    job_level=job_level,
                    department=department,
                    company_size=company_size,
                    business_email=b_email,
                    business_email_validation_status=b_email_status,
                    linkedin_url=linkedin,
                )

        logger.debug(
            "Fetched %d prof/contact rows in ClickHouse for %d asids "
            "(batch_size=%d)",
            len(acc),
            len(asid_list),
            batch_size,
        )
        return acc
