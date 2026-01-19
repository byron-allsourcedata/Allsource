from __future__ import annotations

from typing import List, Dict, Any

from persistence.delivr.client import AsyncDelivrClickHouseClient
from config.clickhouse import ClickhouseConfig


class DelivrUsersCHRepository:
    """Read repository for allsource_prod.delivr_users.

    Fetches contact details by profile_pid_all without performing heavy joins.
    """

    def __init__(self, ch: AsyncDelivrClickHouseClient):
        self.ch = ch
        self.table = ClickhouseConfig.delivr_table()

    async def fetch_by_profile_pids(
        self, profile_pids: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        if not profile_pids:
            return {}
        # Chunk IN lists to avoid overly long queries
        result: Dict[str, Dict[str, Any]] = {}
        chunk_size = 1000
        for i in range(0, len(profile_pids), chunk_size):
            chunk = profile_pids[i : i + chunk_size]
            sql = f"""
            SELECT
                profile_pid_all,
                first_name,
                last_name,
                job_title,
                company_name,
                company_domain,
                gender,
                age_range,
                personal_city,
                personal_state,
                personal_country,
                personal_zip,
                personal_address,
                personal_address_2,
                linkedin_url,
                phones,
                direct_numbers,
                personal_phones,
                mobile_phones,
                emails,
                business_emails,
                personal_emails,
                company_phones,
                company_sic,
                company_address,
                company_city,
                company_state,
                company_zip_code as company_zip,
                company_linkedin_url,
                company_revenue_range as company_revenue,
                company_employee_count,
                primary_contact_emails,
                social_connections,
                current_business_email_validation_date as business_email_last_seen
            FROM {self.table}
            WHERE profile_pid_all IN %(pids)s
            """
            rows = await self.ch.query(sql, {"pids": chunk})
            for r in rows:
                result[r["profile_pid_all"]] = r
        return result
