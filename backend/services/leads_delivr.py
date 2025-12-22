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

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    # async def get_leads(
    #     self,
    #     *,
    #     pixel_id: UUID,
    #     page: int = 1,
    #     per_page: int = 50,
    #     from_date=None,
    #     to_date=None,
    #     timezone_offset: int = 0,
    #     require_visit_in_range: bool = True,
    # ) -> Tuple[List[Dict[str, Any]], int, int]:
    #     """
    #     Async leads fetcher
    #
    #     Returns:
    #         leads_list, total_count, max_page
    #     """
    #
    #     rows, total_count, max_page = await self.leads_persistence.filter_leads(
    #         pixel_id=pixel_id,
    #         page=page,
    #         per_page=per_page,
    #         from_date=from_date,
    #         to_date=to_date,
    #         require_visit_in_range=require_visit_in_range,
    #     )
    #
    #     if not rows:
    #         return [], total_count, max_page
    #
    #     leads: list[dict] = []
    #     print(rows)
    #
    #     for r in rows:
    #         # --- visit datetime с учетом таймзоны
    #         visit_date, visit_time = self._apply_timezone(
    #             r.get("first_visited_date"),
    #             timezone_offset,
    #         )
    #
    #         leads.append(
    #             {
    #                 # --- identifiers
    #                 "profile_pid_all": r.get("profile_pid_all"),
    #
    #                 # --- personal info
    #                 "first_name": str(r.get("first_name") or "").capitalize(),
    #                 "last_name": str(r.get("last_name") or "").capitalize(),
    #                 "gender": r.get("gender"),
    #                 "age_min": r.get("age_min"),
    #                 "age_max": r.get("age_max"),
    #                 "marital_status": r.get("married"),
    #                 "children": r.get("children"),
    #                 "income_range": r.get("income_range"),
    #                 "net_worth": r.get("net_worth"),
    #                 "personal_zip": r.get("personal_zip"),
    #                 "personal_state": r.get("personal_state"),
    #                 "personal_address": r.get("personal_address"),
    #                 "personal_address_2": r.get("personal_address_2"),
    #
    #
    #                 "linkedin_url": r.get("linkedin_url"),
    #
    #                 "mobile_phone": self._format_phone_list(r.get("mobile_phone")),
    #                 "personal_phone": self._format_phone_list(r.get("personal_phone")),
    #                 "business_email": r.get("business_email"),
    #                 "personal_emails": r.get("personal_emails"),
    #                 "primary_industry": r.get("primary_industry"),
    #
    #                 # --- company
    #                 "company_name": r.get("company_name"),
    #                 "company_domain": r.get("company_domain"),
    #                 "company_phone": self._format_phone_list(r.get("company_phone")),
    #                 "job_title": r.get("job_title"),
    #                 "company_linkedin_url": r.get("company_linkedin_url"),
    #                 "company_sic": r.get("company_sic"),
    #                 "company_address": r.get("company_address"),
    #                 "company_city": r.get("company_city"),
    #                 "company_state": r.get("company_state"),
    #                 "company_revenue": r.get("company_revenue"),
    #                 "company_employee_count": r.get("company_employee_count"),
    #                 "company_last_updated": (
    #                     r.get("company_last_updated").strftime("%d.%m.%Y %H:%M")
    #                     if r.get("company_last_updated") else None
    #                 ),
    #                 "professional_zip": r.get("company_zip"),
    #                 "company_zip": r.get("company_zip"),
    #                 "company_description": r.get("company_description"),
    #                 "seniority_level": r.get("seniority_level"),
    #                 "department": r.get("department"),
    #
    #                 # --- visit data
    #                 "behavior_type": r.get("behavior_type"),
    #                 "first_visited_date": visit_date,
    #                 "first_visited_time": visit_time,
    #                 "pages_count": r.get("pages_count"),
    #                 "time_spent": r.get("time_spent"),
    #
    #                 # --- meta
    #                 "created_at": r.get("created_at"),
    #                 "updated_at": r.get("updated_at"),
    #
    #                 # --- Social data
    #
    #                 "social_connections": r.get("social_connections"),
    #
    #                 # --- visitor info
    #                 "recurring_visits": r.get("recurring_visits"),
    #                 "visitor_type": False,
    #                 "is_active": r.get("is_active"),
    #
    #                 "page_visits": r.get("page_visits"),
    #             }
    #         )
    #
    #     return leads, total_count, max_page

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
