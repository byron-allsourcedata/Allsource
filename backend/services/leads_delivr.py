import csv
from datetime import datetime, timedelta
import io
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
    
    async def download_leads(
        self,
        pixel_id: UUID,
        leads_ids=0,
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
    ):
        if leads_ids == 0:
            leads, _, _ = await self.leads_persistence.filter_leads(
            pixel_id=pixel_id,
            from_date=from_date,
            to_date=to_date,
            page=1,
            per_page=5000,
            require_visit_in_range=require_visit_in_range,
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
        else:
            leads = await self.leads_persistence.get_leads_data_by_ids(
                    pixel_id=pixel_id,
                    leads_ids=leads_ids
                )
        if len(leads) == 0:
            return None

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "First name", "Last name", "Mobile phone", "Personal phone", "Direct number", "Address", "City", "State", "Zip",
                "Personal email", "Personal email last seen", "Business email", "Business email last seen", "Personal LinkedIn url", 
                "Gender", "Age range", "Marital status", "Children", "Job title", "Seniority level", "Department", "Company name", 
                "Company domain", "Company phone", "Company description", "Business email", "Business email last seen", "Company last updated",
                "Company address", "Company city", "Company state", "Company zipcode", "Income range", "Net worth", "Company revenue",
                "Company employee count", "Primary industry", "Followers", "Company LinkedIn url", "Visited Date", "Page Visits",
                "Page visits count", "Time on site", "Page visits with parameters"
            ]
        )
        for row in leads:
            first_visited_date = (
                row.get('first_visited_date') if row.get('first_visited_date') else "None"
            )
            
            page_visits_count = 0
            max_spent_time = 0
            page_visits_info = []
            page_visits_info_with_parameters = []
            
            for visit in row.get('page_visits', []):
                spent_time_sec = int(visit["spent_time_sec"])
                page_visits_info.append(f"{visit['page']} {spent_time_sec}")
                url = visit["page"]
                page_visits_info_with_parameters.append(url)
                page_visits_count += 1
                max_spent_time += spent_time_sec

            page_visits_str = "\n".join(page_visits_info) if page_visits_info else "None"
            page_visits_with_parameters_str = "\n".join(page_visits_info_with_parameters) if page_visits_info_with_parameters else "None"
            
            max_spent_time_minutes = max_spent_time // 60
            remaining_seconds = max_spent_time % 60
            time_in_minutes_and_seconds = f"{max_spent_time_minutes} min {remaining_seconds} sec"

            relevant_data = [
                row.get('first_name', "None"),
                row.get('last_name', "None"),
                row.get('mobile_phone', "") or "None",
                row.get('personal_phone', "") or "None",
                row.get('direct_number', "None"),
                row.get('personal_address', "None"),
                row.get('personal_city', "None"),
                row.get('personal_state', "None"),
                row.get('personal_zip', "None"),
                row.get('personal_emails', "None"),
                row.get('personal_emails_last_seen', "None"),
                row.get('business_email', "None"),
                row.get('business_email_last_seen', "None"),
                row.get('linkedin_url', "None"),
                row.get('gender', "None"),
                f"{row.get('age_min', 'None')} - {row.get('age_max', 'None')}" if row.get('age_min') and row.get('age_max') else "None",
                row.get('marital_status', "None"),
                row.get('children', "None"),
                row.get('job_title', "None"),
                row.get('seniority_level', "None"),
                row.get('department', "None"),
                row.get('company_name', "None"),
                row.get('company_domain', "None"),
                row.get('company_phone', "") or "None",
                row.get('company_description', "None"),
                row.get('business_email', "None"),
                row.get('business_email_last_seen', "None"),
                row.get('company_last_updated', "None"),
                row.get('company_address', "None"),
                row.get('company_city', "None"),
                row.get('company_state', "None"),
                row.get('company_zip', "None"),
                row.get('income_range', "None"),
                row.get('net_worth', "None"),
                row.get('company_revenue', "None"),
                row.get('company_employee_count', "None"),
                row.get('primary_industry', "None"),
                row.get('social_connections', "None"),
                row.get('company_linkedin_url', "None"),
                first_visited_date,
                page_visits_str,
                page_visits_count,
                time_in_minutes_and_seconds,
                page_visits_with_parameters_str,
            ]
            
            writer.writerow(relevant_data)

        output.seek(0)
        return output
