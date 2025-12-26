from __future__ import annotations

from typing import List, Dict, Any
from uuid import UUID

from persistence.delivr.client import AsyncDelivrClickHouseClient


class LeadsUsersCHRepository:
    """Read-access repository for ClickHouse allsource_prod.leads_users.

    Provides ordered pagination by UUID v1 id and batch fetch by ids.
    """

    def __init__(self, ch: AsyncDelivrClickHouseClient):
        self.ch = ch

    async def fetch_next_by_pixel(
        self,
        pixel_id: UUID,
        last_id: UUID | None,
        limit: int,
    ) -> List[Dict[str, Any]]:
        where_last = "" if last_id is None else "AND id > %(last_id)s"
        sql = f"""
        SELECT
            id,
            pixel_id,
            profile_pid_all,
            first_visit_id,
            created_at,
            updated_at,
            behavior_type,
            email_sha256_lc_hem,
            email_md5_lc_hem,
            is_active,
            is_confirmed,
            is_checked,
            total_visit,
            average_visit_time,
            total_visit_time,
            company_id
        FROM allsource_prod.leads_users
        WHERE pixel_id = toUUID(%(pixel_id)s)
          {where_last}
        ORDER BY id ASC
        LIMIT %(limit)s
        """
        rows = await self.ch.query(
            sql,
            {
                "pixel_id": str(pixel_id),
                "last_id": str(last_id) if last_id is not None else None,
                "limit": int(limit),
            },
        )
        return rows

    async def fetch_by_ids(
        self, ids: List[UUID | str]
    ) -> Dict[str, Dict[str, Any]]:
        if not ids:
            return {}
        # ClickHouse IN works with UUID strings as well
        sql = """
        SELECT id, pixel_id, profile_pid_all, first_visit_id
        FROM allsource_prod.leads_users
        WHERE id IN %(ids)s
        """
        rows = await self.ch.query(sql, {"ids": [str(i) for i in ids]})
        return {str(r["id"]): r for r in rows}
