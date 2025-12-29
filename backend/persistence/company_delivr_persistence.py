from datetime import datetime, timezone, timedelta
import math
import time
from venv import logger
from typing import Tuple, List, Dict, Any, Optional
from uuid import UUID
from dataclasses import dataclass

from config import ClickhouseConfig
from db_dependencies import AsyncClickHouse
from resolver import injectable

DATABASE = "allsource_prod"
LEADS_USERS = "leads_users"
LEADS_COMPANIES = "leads_companies"
LEADS_VISITS = "leads_visits"
DELIVR_USERS = "delivr_users"


@dataclass
class CompanyLeadRecord:
    id: str
    name: str
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    employees_visited: Optional[str] = None
    visited_date: Optional[str] = None
    company_revenue: Optional[str] = None
    employee_count: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    domain: Optional[str] = None
    zipcode: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}


class DataFormatter:
    @staticmethod
    def to_dt(ts: int | float | datetime | None) -> Optional[datetime]:
        if ts is None:
            return None
        if isinstance(ts, datetime):
            dt = ts
        else:
            dt = datetime.fromtimestamp(float(ts), tz=timezone.utc)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    @staticmethod
    def format_phone(phones_str: Optional[str]) -> Optional[str]:
        if not phones_str:
            return None

        formatted = []
        phones_str = str(phones_str).strip()
        if phones_str.startswith("[") and phones_str.endswith("]"):
            phones_str = phones_str[1:-1]
        for raw in phones_str.split(","):
            p = raw.strip().strip("'\"")
            if p.endswith(".0"):
                p = p[:-2]
            if p and not p.startswith("+"):
                p = f"+{p}"
            if p:
                formatted.append(p)

        return ", ".join(formatted) or None

    @staticmethod
    def apply_timezone_date_only(
        dt: Optional[datetime], offset_hours: int
    ) -> Optional[str]:
        if not dt:
            return None

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        adjusted = dt + timedelta(hours=offset_hours)
        return adjusted.strftime("%d.%m.%Y")

    @staticmethod
    def join_values(values: Any) -> Optional[str]:
        if not values:
            return None

        if isinstance(values, (list, tuple)):
            cleaned = [
                str(x).strip()
                for x in values
                if x is not None and str(x).strip()
            ]
            return ", ".join(cleaned) or None

        s = str(values).strip()
        return s if s else None

    @staticmethod
    def format_company_name(name: Optional[str]) -> Optional[str]:
        if not name:
            return None
        return str(name).title()


class DelivrCompanyDataProcessor:
    """Обработчик данных компании из delivr"""

    def __init__(self):
        self.formatter = DataFormatter()

    def process(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """Обработка одной строки компании из delivr"""
        # Обработка телефонов компании
        company_phone = self.formatter.join_values(row.get("company_phones"))

        return {
            "company_name": row.get("company_name"),
            "company_domain": row.get("company_domain"),
            "company_phone_raw": company_phone,
            "company_sic": row.get("company_sic")[0]
            if row.get("company_sic")
            else None,
            "company_address": row.get("company_address"),
            "company_city": row.get("company_city"),
            "company_state": row.get("company_state"),
            "company_linkedin_url": row.get("company_linkedin_url"),
            "company_revenue": row.get("company_total_revenue"),
            "company_employee_count": row.get("company_employee_count"),
            "company_last_updated": row.get("last_updated"),
            "company_zip": row.get("company_zip_code"),
            "company_description": row.get("company_description"),
            "primary_industry": row.get("company_industry"),
            "related_domains": self.formatter.join_values(
                row.get("company_related_domains")
            ),
        }


class CompanyLeadBuilder:
    """Строитель объектов CompanyLeadRecord"""

    def __init__(self, timezone_offset: int = 0):
        self.formatter = DataFormatter()
        self.timezone_offset = timezone_offset

    async def build(self, company_data: Dict[str, Any]) -> CompanyLeadRecord:
        visited_date = self.formatter.apply_timezone_date_only(
            company_data.get("visited_date"), self.timezone_offset
        )

        company_phone = self.formatter.format_phone(
            company_data.get("company_phones")
        )

        location = ", ".join(
            filter(
                None,
                [
                    str(company_data.get("company_country"))
                    if company_data.get("company_country")
                    else None,
                    str(company_data.get("company_city"))
                    if company_data.get("company_city")
                    else None,
                ],
            )
        )

        return CompanyLeadRecord(
            id=company_data["company_id"],
            name=company_data.get("company_name"),
            phone=company_phone,
            linkedin_url=company_data.get("company_linkedin_url"),
            employees_visited=company_data.get("employees_visited"),
            visited_date=visited_date,
            company_revenue=company_data.get("company_revenue_range"),
            employee_count=company_data.get("company_employee_count_range"),
            location=location,
            industry=company_data.get("company_industry"),
            domain=company_data.get("company_domain"),
            zipcode=company_data.get("company_zip_code"),
            description=company_data.get("company_description"),
            city=company_data.get("company_city"),
            state=company_data.get("company_state"),
        )


@injectable
class CompanyLeadsPersistenceClickhouse:
    def __init__(self, click_house: AsyncClickHouse):
        self.click_house = click_house
        self.users_table = f"{DATABASE}.{LEADS_USERS}"
        self.companies_table = f"{DATABASE}.{LEADS_COMPANIES}"
        self.delivr_users_table = f"{DATABASE}.{DELIVR_USERS}"
        self.visits_table = f"{DATABASE}.{LEADS_VISITS}"
        self.delivr_table = ClickhouseConfig.delivr_table()
        self.formatter = DataFormatter()
        self.delivr_processor = DelivrCompanyDataProcessor()

    async def filter_company_leads(
        self,
        adjusted_from_date: datetime | None = None,
        adjusted_to_date: datetime | None = None,
        sort_by: str = "visit_start",
        employees_range: List[Dict[str, Any]] | None = None,
        employee_visits: int | None = None,
        industry: str | List[str] = None,
        revenue_range: List[Dict[str, Any]] | None = None,
        search_query: str | None = None,
        regions: List[Dict[str, str]] | None = None,
        sort_order: str = "desc",
        timezone_offset: int = 0,
        *,
        pixel_id: UUID,
        page: int = 1,
        per_page: int = 50,
    ) -> Tuple[List[Dict[str, Any]], int, int]:
        params = await self._prepare_params(
            pixel_id,
            page,
            per_page,
            adjusted_from_date,
            adjusted_to_date,
            sort_by,
            employees_range,
            employee_visits,
            industry,
            revenue_range,
            search_query,
            regions,
            sort_order,
        )

        companies = await self._load_companies_with_filters(params)
        if not companies:
            return [], 0, 0

        total_count = await self._get_total_companies_count_with_filters(params)
        max_page = math.ceil(total_count / per_page) if per_page else 1

        builder = CompanyLeadBuilder(timezone_offset)
        results = []

        for company in companies:
            lead = await builder.build(
                company_data=company,
            )
            results.append(lead.to_dict())

        return results, total_count, max_page

    async def get_company_by_id(self, pixel_id: str, company_id: str):
        sql = f"""
            SELECT 
                lc.company_id as company_id,
                lc.company_name as company_name,
                lc.company_phones as company_phones,
                lc.company_linkedin_url as company_linkedin_url,
                COUNT(DISTINCT lu.profile_pid_all) as employees_visited,
                MIN(lv.visit_start) as visited_date,
                lc.company_revenue_range as company_revenue_range,
                lc.company_employee_count_range as company_employee_count_range,
                lc.company_country as company_country,
                lc.company_industry as company_industry,
                lc.company_domain as company_domain,
                lc.company_zip_code as company_zip_code,
                lc.company_description as company_description,
                lc.company_city as company_city,
                lc.company_state as company_state
                
            FROM {self.companies_table} lc
            LEFT JOIN {self.users_table} lu ON lc.company_id = lu.company_id
            LEFT JOIN {self.visits_table} lv ON lu.profile_pid_all = lv.profile_pid_all
            WHERE lu.pixel_id = %(pixel_id)s AND lc.company_id = %(company_id)s
            GROUP BY 
                lc.company_id,
                lc.company_name,
                lc.company_phones,
                lc.company_linkedin_url,
                lc.company_revenue_range,
                lc.company_employee_count_range,
                lc.company_country,
                lc.company_industry,
                lc.company_domain,
                lc.company_zip_code,
                lc.company_description,
                lc.company_city,
                lc.company_state
        """
        result = await self.click_house.query(
            sql, {"company_id": company_id, "pixel_id": pixel_id}
        )
        results_list = list(result.named_results())
        return results_list[0] if results_list else None

    async def get_full_information_companies_by_filters(self, params):
        where_clause = await self.build_where_clause(params=params)
        having_conditions = []
        if params.get("employee_visits"):
            if params.get("employee_visits") == "5+":
                having_conditions.append("employees_visited >= 5")
            else:
                having_conditions.append(
                    "employees_visited == %(employee_visits)s"
                )

        having_clause = (
            " AND ".join(having_conditions) if having_conditions else "1=1"
        )

        sql = f"""
            SELECT 
                lc.company_id as company_id,
                lc.company_name as company_name,
                lc.company_phones as company_phones,
                lc.company_linkedin_url as company_linkedin_url,
                COUNT(DISTINCT lu.profile_pid_all) as employees_visited,
                MIN(lv.visit_start) as visited_date,
                lc.company_revenue_range as company_revenue_range,
                lc.company_employee_count_range as company_employee_count_range,
                lc.company_country as company_country,
                lc.company_industry as company_industry,
                lc.company_domain as company_domain,
                lc.company_zip_code as company_zip_code,
                lc.company_description as company_description,
                lc.company_city as company_city,
                lc.company_state as company_state
                
            FROM {self.companies_table} lc
            LEFT JOIN {self.users_table} lu ON lc.company_id = lu.company_id
            LEFT JOIN {self.visits_table} lv ON lu.profile_pid_all = lv.profile_pid_all
            WHERE {where_clause}
            GROUP BY 
                lc.company_id,
                lc.company_name,
                lc.company_phones,
                lc.company_linkedin_url,
                lc.company_revenue_range,
                lc.company_employee_count_range,
                lc.company_country,
                lc.company_industry,
                lc.company_domain,
                lc.company_zip_code,
                lc.company_description,
                lc.company_city,
                lc.company_state,
                lc.company_total_revenue,
                lc.company_employee_count
            HAVING {having_clause}
        """
        result = await self.click_house.query(sql, params)
        return list[Dict[str, Any]](result.named_results())

    async def filter_employees(
        self,
        sort_by: Optional[str] = None,
        sort_order: str = "desk",
        search_query: Optional[str] = None,
        job_title: Optional[List[str]] = None,
        department: Optional[List[str]] = None,
        seniority: Optional[List[str]] = None,
        regions: Optional[List[str]] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
        *,
        company_id: int,
    ) -> Dict[str, Any]:
        where_conditions = ["lc.company_id = %(company_id)s"]
        params = {"company_id": company_id}

        if search_query:
            search_term = search_query.strip()
            search_pattern = f"%{search_term}%"
            params["search_pattern"] = search_pattern
            where_conditions.append(
                "(ilike(first_name, %(search_pattern)s) OR "
                "(ilike(last_name, %(search_pattern)s) OR "
                "arrayExists(x -> ilike(x, %(search_pattern)s), mobile_phones)) OR"
                "arrayExists(x -> ilike(x, %(search_pattern)s), personal_emails)) OR"
                "arrayExists(x -> ilike(x, %(search_pattern)s), business_emails))"
            )

        if job_title:
            where_conditions.append("job_title IN %(job_title)s")
            params["job_title"] = job_title

        if department:
            where_conditions.append("department IN %(department)s")
            params["department"] = department

        if seniority:
            where_conditions.append("seniority_level IN %(seniority)s")
            params["seniority"] = seniority

        if regions:
            employees_conditions = []
            for i, region in enumerate[str](regions):
                city = region.get("city", "").strip()
                state = region.get("state", "").strip()
                city_key = f"region_city_{i}"
                state_key = f"region_state_{i}"
                employees_conditions.append(
                    f"(personal_city = %({city_key})s AND personal_state = %({state_key})s)"
                )
                params[city_key] = city
                params[state_key] = state

            if employees_conditions:
                where_conditions.append(
                    f"({' OR '.join(employees_conditions)})"
                )

        sort_direction = "DESC" if sort_order.lower() == "desc" else "ASC"

        sort_clause = (
            f"du.last_name {sort_direction}, du.first_name {sort_direction}"
        )

        count = 0
        max_page = 0
        try:
            if per_page:
                count = await self._get_total_count(where_conditions, params)
                max_page = (count + per_page - 1) // per_page

            rows = await self._get_employees_data(
                where_conditions=where_conditions,
                params=params,
                sort_clause=sort_clause,
                page=page,
                per_page=per_page,
            )
        except Exception as e:
            logger.error(f"Error in filter_employees: {e}")
            return [], 0, 0

        return rows, count, max_page

    async def _get_total_count(
        self, where_conditions: List[str], params: Dict[str, Any]
    ) -> int:
        where_clause = " AND ".join(where_conditions)

        count_query = f"""
        SELECT COUNT(*) as total_count
        FROM leads_companies lc
        LEFT JOIN {self.delivr_users_table} du ON du.company_id_right = lc.company_id
        WHERE {where_clause}
        """

        count_result = await self.click_house.query(count_query, params)
        count_data = list(count_result.named_results())
        return count_data[0]["total_count"] if count_data else 0

    async def _get_employees_data(
        self,
        where_conditions: List[str],
        params: Dict[str, Any],
        sort_clause: str,
        page: int,
        per_page: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        where_clause = " AND ".join(where_conditions)

        query = f"""
        SELECT 
            du.profile_pid_all as id,
            du.first_name as first_name,
            du.last_name as last_name,
            du.mobile_phones as mobile_phones,
            du.linkedin_url as linkedin_url,
            du.personal_emails as personal_emails,
            du.business_emails as business_emails,
            du.seniority_level as seniority_level,
            du.department as department,
            du.job_title as job_title,
            du.personal_city as personal_city,
            du.personal_state as personal_state
        FROM leads_companies lc
        LEFT JOIN {self.delivr_users_table} du ON du.company_id_right = lc.company_id
        WHERE {where_clause}
        ORDER BY {sort_clause}
        """

        if per_page is not None:
            offset = (page - 1) * per_page
            query += f" LIMIT %(limit)s OFFSET %(offset)s"
            params["limit"] = per_page
            params["offset"] = offset

        result = await self.click_house.query(query, params)

        return list[dict](result.named_results())

    async def get_full_information_employee(
        self, company_id: str, employee_id: str
    ) -> dict | None:
        params = {"company_id": company_id, "employee_id": employee_id}

        query = f"""
        SELECT 
            du.profile_pid_all as id,
            du.first_name as first_name,
            du.last_name as last_name,
            du.mobile_phones as mobile_phones,
            du.linkedin_url as linkedin_url,
            du.personal_emails as personal_emails,
            du.business_emails as business_emails,
            du.seniority_level as seniority_level,
            du.department as department,
            du.job_title as job_title,
            du.personal_city as personal_city,
            du.personal_state as personal_state,
            du.company_name as company_name,
            du.company_city as company_city,
            du.company_phones as company_phones,
            du.company_description as company_description,
            du.company_address as company_address,
            du.company_zip_code as company_zip_code,
            du.company_linkedin_url as company_linkedin_url,
            du.personal_zip as personal_zip,
            du.company_domain as company_domain,
            du.personal_address as personal_address,
            du.emails as other_personal_emails,
            du.company_state as company_state,
            du.personal_country as personal_country,
            du.company_country as company_country
        FROM leads_companies lc
        LEFT JOIN {self.delivr_users_table} du ON du.company_id_right = lc.company_id
        WHERE lc.company_id = %(company_id)s 
        AND du.profile_pid_all = %(employee_id)s
        LIMIT 1
        """

        try:
            result = await self.click_house.query(query, params)
            rows = list(result.named_results())

            if not rows:
                return None

            return rows[0]

        except Exception as e:
            logger.error(f"Error in get_full_information_employee: {e}")
            import traceback

            traceback.print_exc()
            return None

    async def get_unique_primary_departments(
        self, company_id: str
    ) -> List[str]:
        query = f"""
        SELECT 
            du.department
        FROM {self.delivr_users_table} du
        WHERE du.company_id = %(company_id)s
        GROUP BY du.department
        ORDER BY du.department
        LIMIT 300
        """

        try:
            result = await self.click_house.query(
                query, {"company_id": company_id}
            )
            rows = list[dict](result.named_results())

            departments = []
            for row in rows:
                department = row.get("department")
                if department:
                    department = str(department).strip()
                    departments.append(department)

            return departments
        except Exception as e:
            logger.error(
                f"Error getting departments for company {company_id}: {e}"
            )
            return []

    async def get_uniq_primary_industry(self, pixel_id: UUID) -> List[str]:
        query = f"""
        SELECT 
            DISTINCT lc.company_industry
        FROM leads_companies lc
        LEFT JOIN {self.users_table} lu ON lc.company_id = lu.company_id
        WHERE lu.pixel_id = %(pixel_id)s
        ORDER BY lc.company_industry
        LIMIT 300
        """
        try:
            result = await self.click_house.query(query, {"pixel_id": pixel_id})
            rows = list[dict](result.named_results())

            industries = []
            for industry in rows:
                industry = industry["company_industry"]
                if industry:
                    industry = industry.strip()
                    industries.append(industry)

            return industries
        except Exception as e:
            logger.error(f"Error get_uniq_primary_industry: {e}")
            return []

    async def _get_total_companies_count_with_filters(
        self, params: Dict[str, Any]
    ) -> int:
        where_clause = await self.build_where_clause(params=params)
        having_conditions = []

        if params.get("employee_visits"):
            if params.get("employee_visits") == "5+":
                having_conditions.append("employees_visited >= 5")
            else:
                having_conditions.append(
                    "employees_visited = %(employee_visits)s"
                )

        having_clause = (
            " AND ".join(having_conditions) if having_conditions else "1=1"
        )

        sql = f"""
            SELECT COUNT(*) as total_companies
            FROM (
                SELECT 
                    lc.company_id,
                    COUNT(DISTINCT lu.profile_pid_all) as employees_visited
                FROM {self.companies_table} lc
                LEFT JOIN {self.users_table} lu ON lc.company_id = lu.company_id
                LEFT JOIN {self.visits_table} lv ON lu.profile_pid_all = lv.profile_pid_all
                WHERE {where_clause}
                GROUP BY lc.company_id
                HAVING {having_clause}
            ) as filtered_companies
        """

        result = await self.click_house.query(sql, params)
        row = list[dict](result.named_results())
        if row and len(row) > 0:
            return int(row[0].get("total_companies", 0))
        return 0

    async def get_unique_primary__job_titles(self, company_id) -> List:
        query = f"""
        SELECT 
            du.job_title
        FROM {self.delivr_users_table} du
        WHERE du.company_id = %(company_id)s
        GROUP BY du.job_title
        ORDER BY du.job_title
        LIMIT 300
        """
        try:
            result = await self.click_house.query(
                query, {"company_id": company_id}
            )
            rows = list[dict](result.named_results())
            job_titles = []
            for job_title in rows:
                job_title = job_title["job_title"]
                if job_title:
                    job_title = job_title.strip()
                    job_titles.append(job_title)

            return job_titles
        except Exception as e:
            logger.error(f"Error get_unique_primary__job_titles: {e}")
            return []

    async def get_unique_primary__seniorities(self, company_id) -> List:
        query = f"""
        SELECT 
            du.seniority_level
        FROM {self.delivr_users_table} du
        WHERE du.company_id = %(company_id)s
        GROUP BY du.seniority_level
        ORDER BY du.seniority_level
        """

        try:
            result = await self.click_house.query(
                query, {"company_id": company_id}
            )
            rows = list[dict](result.named_results())
            seniorities = []
            for seniority in rows:
                seniority = seniority["seniority_level"]
                if seniority:
                    seniority = seniority.strip()
                    seniorities.append(seniority)

            return seniorities
        except Exception as e:
            logger.error(f"Error get_unique_primary__seniorities: {e}")
            return []

    async def _prepare_params(
        self,
        pixel_id: UUID,
        page: int,
        per_page: int,
        from_date: datetime | None,
        to_date: datetime | None,
        sort_by: str = "",
        employees_range: List[Dict[str, Any]] | None = None,
        employee_visits: int | None = None,
        industry: str | List[str] | None = None,
        revenue_range: List[Dict[str, Any]] | None = None,
        search_query: str | None = None,
        regions: List[Dict[str, str]] | None = None,
        sort_order: str = "desc",
    ) -> Dict[str, Any]:
        page = max(page, 1)
        offset = (page - 1) * per_page

        if isinstance(industry, str):
            industry = [industry]

        if isinstance(regions, str):
            regions = [regions]

        params = {
            "pixel_id": str(pixel_id),
            "limit": per_page,
            "offset": offset,
            "from_dt": from_date,
            "to_dt": to_date,
            "sort_by": sort_by,
            "employees_list": employees_range,
            "employee_visits": employee_visits,
            "industries": industry,
            "revenue_list": revenue_range,
            "search_query": search_query,
            "regions": regions,
            "sort_order": sort_order,
        }

        return params

    async def search_company(self, start_letter: str, pixel_id: UUID):
        query = f"""
        SELECT 
            lc.company_name,
            lc.company_phones
        FROM leads_companies lc
        LEFT JOIN {self.users_table} lu ON lc.company_id = lu.company_id
        WHERE lu.pixel_id = %(pixel_id)s
        AND (
            ilike(lc.company_name, %(start_letter)s) OR
            arrayExists(x -> ilike(x, %(start_letter)s), lc.company_phones)
        )
        LIMIT 10
        """
        start_letter = f"%{start_letter}%"
        params = {"pixel_id": pixel_id, "start_letter": start_letter}
        result = await self.click_house.query(query, params)
        return result.result_rows

    async def build_where_clause(self, params: dict) -> tuple[str, dict]:
        where_conditions = ["lu.pixel_id = %(pixel_id)s"]

        if params.get("employees_list"):
            employees_conditions = []
            for employee in params.get("employees_list"):
                employee_sub_conditions = []
                if employee["max"]:
                    employee_sub_conditions.append(
                        f"lc.company_employee_count <= {employee['max']}"
                    )

                if employee["min"]:
                    employee_sub_conditions.append(
                        f"lc.company_employee_count >= {employee['min']}"
                    )

                if employee["min"] is None and employee["max"] is None:
                    employee_sub_conditions.append(
                        f"lc.company_employee_count == 0"
                    )

                if employee_sub_conditions:
                    employees_conditions.append(
                        f"({' AND '.join(employee_sub_conditions)})"
                    )

            if employees_conditions:
                where_conditions.append(
                    f"({' OR '.join(employees_conditions)})"
                )

        if params.get("industries"):
            where_conditions.append("company_industry IN %(industries)s")

        if params.get("regions"):
            employees_conditions = []
            for i, region in enumerate(params.get("regions")):
                city = region.get("city", "").strip()
                state = region.get("state", "").strip()
                city_key = f"region_city_{i}"
                state_key = f"region_state_{i}"
                employees_conditions.append(
                    f"(company_city = %({city_key})s AND company_state = %({state_key})s)"
                )
                params[city_key] = city
                params[state_key] = state

            if employees_conditions:
                where_conditions.append(
                    f"({' OR '.join(employees_conditions)})"
                )

        if params.get("from_dt") and params.get("to_dt"):
            where_conditions.append("lv.visit_start >= %(from_dt)s")
            where_conditions.append("lv.visit_start <= %(to_dt)s")
        elif params.get("from_dt"):
            where_conditions.append("lv.visit_start >= %(from_dt)s")
        elif params.get("to_dt"):
            where_conditions.append("lv.visit_start <= %(to_dt)s")

        if params.get("revenue_list"):
            revenue_conditions = []
            for revenue in params.get("revenue_list"):
                revenue_sub_conditions = []
                if revenue["min"] and revenue["max"]:
                    revenue_sub_conditions.append(
                        f"lc.company_total_revenue >= {revenue['min']}"
                    )
                    revenue_sub_conditions.append(
                        f"lc.company_total_revenue <= {revenue['max']}"
                    )

                if revenue["min"] is None and revenue["max"]:
                    revenue_sub_conditions.append(
                        f"lc.company_total_revenue < {revenue['max']}"
                    )

                if revenue["min"] and revenue["max"] is None:
                    revenue_sub_conditions.append(
                        f"lc.company_total_revenue >= {revenue['min']}"
                    )

                if revenue["min"] is None and revenue["max"] is None:
                    revenue_sub_conditions.append(
                        f"lc.company_total_revenue is NULL"
                    )

                if revenue_sub_conditions:
                    revenue_conditions.append(
                        f"({' AND '.join(revenue_sub_conditions)})"
                    )

            if revenue_conditions:
                where_conditions.append(f"({' OR '.join(revenue_conditions)})")

        if params.get("search_query"):
            search_term = params["search_query"].strip()
            search_pattern = f"%{search_term}%"
            params["search_pattern"] = search_pattern
            where_conditions.append(
                "(ilike(lc.company_name, %(search_pattern)s) OR "
                "arrayExists(x -> ilike(x, %(search_pattern)s), lc.company_phones))"
            )

        where_clause = " AND ".join(where_conditions)
        return where_clause

    async def _load_companies_with_filters(
        self, params: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        where_clause = await self.build_where_clause(params=params)

        sort_column = await self._get_sort_column(params.get("sort_by"))
        sort_direction = (
            "DESC"
            if params.get("sort_order", "desc").lower() == "desc"
            else "ASC"
        )

        having_conditions = []
        if params.get("employee_visits"):
            if params.get("employee_visits") == "5+":
                having_conditions.append("employees_visited >= 5")
            else:
                having_conditions.append(
                    "employees_visited == %(employee_visits)s"
                )

        having_clause = (
            " AND ".join(having_conditions) if having_conditions else "1=1"
        )

        sql = f"""
            SELECT 
                lc.company_id as company_id,
                lc.company_name as company_name,
                lc.company_phones as company_phones,
                lc.company_linkedin_url as company_linkedin_url,
                COUNT(DISTINCT lu.profile_pid_all) as employees_visited,
                MIN(lv.visit_start) as visited_date,
                lc.company_revenue_range as company_revenue_range,
                lc.company_employee_count_range as company_employee_count_range,
                lc.company_country as company_country,
                lc.company_industry as company_industry,
                lc.company_domain as company_domain,
                lc.company_zip_code as company_zip_code,
                lc.company_description as company_description,
                lc.company_city as company_city,
                lc.company_state as company_state
                
            FROM {self.companies_table} lc
            LEFT JOIN {self.users_table} lu ON lc.company_id = lu.company_id
            LEFT JOIN {self.visits_table} lv ON lu.profile_pid_all = lv.profile_pid_all
            WHERE {where_clause}
            GROUP BY 
                lc.company_id,
                lc.company_name,
                lc.company_phones,
                lc.company_linkedin_url,
                lc.company_revenue_range,
                lc.company_employee_count_range,
                lc.company_country,
                lc.company_industry,
                lc.company_domain,
                lc.company_zip_code,
                lc.company_description,
                lc.company_city,
                lc.company_state,
                lc.company_total_revenue,
                lc.company_employee_count
            HAVING {having_clause}
            ORDER BY {sort_column} {sort_direction}
            LIMIT %(limit)s OFFSET %(offset)s
        """
        result = await self.click_house.query(sql, params)
        return list[Dict[str, Any]](result.named_results())

    async def _get_sort_column(self, sort_by: str) -> str:
        sort_map = {
            "company_name": "company_name",
            "employees_visited": "employees_visited",
            "visited_date": "visited_date",
            "revenue": "lc.company_total_revenue",
            "company_city": "company_city",
            "company_state": "company_state",
            "company_country": "company_country",
            "number_of_employees": "lc.company_employee_count",
        }

        return sort_map.get(sort_by, "visited_date")

    async def search_location(self, start_letter, pixel_id):
        query = f"""
        SELECT 
            lc.company_city AS company_city,
            lc.company_state AS company_state
        FROM leads_companies lc
        LEFT JOIN {self.users_table} lu ON lc.company_id = lu.company_id
        WHERE lu.pixel_id = %(pixel_id)s
        AND (
            ilike(lc.company_city, %(start_letter)s) OR
            ilike(lc.company_state, %(start_letter)s)
        )
        LIMIT 10
        """
        start_letter = f"%{start_letter}%"
        params = {"pixel_id": pixel_id, "start_letter": start_letter}

        result = await self.click_house.query(query, params)
        return result.result_rows

    async def _load_companies(
        self, params: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                lc.company_id,
                lc.company_name,
                lc.created_at,
                lc.updated_at,
                COUNT(DISTINCT lu.profile_pid_all) as total_employees
            FROM {self.companies_table} lc
            INNER JOIN {self.users_table} lu ON lc.company_id = lu.company_id
            WHERE lu.pixel_id = %(pixel_id)s
            GROUP BY lc.company_id, lc.company_name, lc.created_at, lc.updated_at
            ORDER BY lc.updated_at DESC
            LIMIT %(limit)s OFFSET %(offset)s
        """
        result = await self.click_house.query(sql, params)
        return list(result.named_results())

    async def _get_total_companies_count(self, params: Dict[str, Any]) -> int:
        sql = f"""
            SELECT COUNT(DISTINCT lc.company_id) AS cnt 
            FROM {self.companies_table} lc
            INNER JOIN {self.users_table} lu ON lc.company_id = lu.company_id
            WHERE lu.pixel_id = %(pixel_id)s
        """
        result = await self.click_house.query(sql, params)
        row = list(result.named_results())[0]
        return int(row["cnt"])

    def _build_time_filter(self, params: Dict[str, Any]) -> str:
        filters = []
        if params.get("from_dt"):
            filters.append("lv.visit_start >= %(from_dt)s")
        if params.get("to_dt"):
            filters.append("lv.visit_start < %(to_dt)s")

        return " AND " + " AND ".join(filters) if filters else ""
