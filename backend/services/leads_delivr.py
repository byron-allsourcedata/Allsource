from datetime import datetime, timedelta
from typing import Any, Dict, List, Tuple
from uuid import UUID

from resolver import injectable
from persistence.leads_delivr_persistence import LeadsPersistenceClickhouse


@injectable
class AsyncLeadsService:
    def __init__(
        self,
        leads_persistence: LeadsPersistenceClickhouse,
    ):
        self.leads_persistence = leads_persistence

    # ---------------------------------------------------------
    # Utils
    # ---------------------------------------------------------

    def _apply_timezone(
        self,
        dt: datetime | None,
        timezone_offset_hours: int,
    ) -> tuple[str | None, str | None]:
        if not dt:
            return None, None

        adjusted = dt + timedelta(hours=timezone_offset_hours)
        return (
            adjusted.strftime("%d.%m.%Y"),
            adjusted.strftime("%H:%M"),
        )

    def _format_phone_list(self, phones: str | None) -> str | None:
        if not phones:
            return None

        out: list[str] = []
        for raw in phones.split(","):
            p = raw.strip()
            if p.endswith(".0"):
                p = p[:-2]
            if not p.startswith("+"):
                p = f"+{p}"
            out.append(p)

        return ", ".join(out)

    async def get_leads(
        self,
        *,
        pixel_id: UUID,
        page: int = 1,
        per_page: int = 50,
        from_date=None,
        to_date=None,
        timezone_offset: int = 0,
        require_visit_in_range: bool = True,
        # sorting
        sort_by: str | None = None,
        sort_order: str | None = None,
        # filters
        behavior_type: str | None = None,
        status: str | None = None,
        regions: str | None = None,
        page_url: str | None = None,
        recurring_visits: str | None = None,
        average_time_sec: str | None = None,
        page_visits: str | None = None,
        search_query: str | None = None,
        from_time: str | None = None,
        to_time: str | None = None,
    ) -> Tuple[List[Dict[str, Any]], int, int]:
        (
            leads,
            total_count,
            max_page,
        ) = await self.leads_persistence.filter_leads(
            pixel_id=pixel_id,
            page=page,
            per_page=per_page,
            from_date=from_date,
            to_date=to_date,
            require_visit_in_range=require_visit_in_range,
            timezone_offset=timezone_offset,
            sort_by=sort_by,
            sort_order=sort_order,
            behavior_type=behavior_type,
            status=status,
            regions=regions,
            page_url=page_url,
            recurring_visits=recurring_visits,
            average_time_sec=average_time_sec,
            page_visits=page_visits,
            search_query=search_query,
            from_time=from_time,
            to_time=to_time,
        )
        return leads, total_count, max_page
