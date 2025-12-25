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
    ) -> Tuple[List[Dict[str, Any]], int, int]:
        """
        Async leads fetcher — теперь сервис только вызывает persistence.filter_leads
        и возвращает уже подготовленные записи (форматированные).
        """
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
        )
        return leads, total_count, max_page
