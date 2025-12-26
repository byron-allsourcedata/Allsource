from datetime import datetime, timezone, timedelta
import math
from typing import Tuple, List, Dict, Any, Optional
from uuid import UUID
from dataclasses import dataclass

from config import ClickhouseConfig
from db_dependencies import AsyncClickHouse
from resolver import injectable

DATABASE = "allsource_prod"
LEADS_USERS = "leads_users_test"
LEADS_COMPANIES = "leads_companies"
LEADS_VISITS = "leads_visits_test"
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
        """Конвертация в словарь"""
        return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}


class DataFormatter:
    """Класс для форматирования данных"""

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

    async def get_company_by_id(self, domain_id: int, company_id: int):
        first_visit_subquery = (
            self.db.query(
                LeadUser.company_id,
                func.min(LeadsVisits.start_date).label("visited_date"),
            )
            .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)
            .group_by(LeadUser.company_id)
            .subquery()
        )
        number_of_employees = func.count(LeadUser.id).label(
            "number_of_employees"
        )
        query = (
            self.db.query(
                LeadCompany.id,
                LeadCompany.name,
                LeadCompany.phone,
                LeadCompany.linkedin_url,
                number_of_employees,
                first_visit_subquery.c.visited_date,
                LeadCompany.revenue,
                LeadCompany.employee_count,
                LeadCompany.address,
                LeadCompany.primary_industry,
                LeadCompany.domain,
                LeadCompany.zip,
                LeadCompany.description,
                FiveXFiveLocations.city,
                States.state_name,
                LeadCompany.last_updated,
            )
            .join(LeadUser, LeadUser.company_id == LeadCompany.id)
            .outerjoin(
                first_visit_subquery,
                first_visit_subquery.c.company_id == LeadCompany.id,
            )
            .outerjoin(
                FiveXFiveLocations,
                FiveXFiveLocations.id == LeadCompany.five_x_five_location_id,
            )
            .outerjoin(States, States.id == FiveXFiveLocations.state_id)
            .filter(LeadUser.domain_id == domain_id)
            .group_by(
                LeadCompany.id,
                first_visit_subquery.c.visited_date,
                FiveXFiveLocations.city,
                States.state_name,
            )
            .filter(LeadCompany.id == company_id)
        )

        leads = query.first()
        return leads

    async def get_full_information_companies_by_filters(
        self,
        domain_id: int,
        from_date: Optional[int] = None,
        to_date: Optional[int] = None,
        search_query: Optional[str] = None,
        employee_visits: Optional[str] = None,
        revenue_range: Optional[str] = None,
        regions: Optional[str] = None,
        employees_range: Optional[str] = None,
        industry: Optional[str] = None,
    ):
        first_visit_subquery = (
            self.db.query(
                LeadUser.company_id,
                func.min(LeadsVisits.start_date).label("visited_date"),
            )
            .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)
            .group_by(LeadUser.company_id)
            .subquery()
        )
        number_of_employees = func.count(LeadUser.id).label(
            "number_of_employees"
        )

        query = (
            self.db.query(
                LeadCompany.id,
                LeadCompany.name,
                LeadCompany.phone,
                LeadCompany.linkedin_url,
                number_of_employees,
                first_visit_subquery.c.visited_date,
                LeadCompany.revenue,
                LeadCompany.employee_count,
                LeadCompany.address,
                LeadCompany.primary_industry,
                LeadCompany.domain,
                LeadCompany.zip,
                LeadCompany.description,
                FiveXFiveLocations.city,
                States.state_name,
                LeadCompany.last_updated,
            )
            .join(LeadUser, LeadUser.company_id == LeadCompany.id)
            .join(
                first_visit_subquery,
                first_visit_subquery.c.company_id == LeadCompany.id,
            )
            .outerjoin(
                FiveXFiveLocations,
                FiveXFiveLocations.id == LeadCompany.five_x_five_location_id,
            )
            .outerjoin(States, States.id == FiveXFiveLocations.state_id)
            .filter(LeadUser.domain_id == domain_id)
            .group_by(
                LeadCompany.id,
                first_visit_subquery.c.visited_date,
                FiveXFiveLocations.city,
                States.state_name,
            )
            .order_by(
                asc(LeadCompany.name), desc(first_visit_subquery.c.visited_date)
            )
        )

        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)
            query = query.filter(
                and_(
                    or_(
                        and_(
                            LeadsVisits.start_date == start_date.date(),
                            LeadsVisits.start_time >= start_date.time(),
                        ),
                        and_(
                            LeadsVisits.start_date == end_date.date(),
                            LeadsVisits.start_time <= end_date.time(),
                        ),
                        and_(
                            LeadsVisits.start_date > start_date.date(),
                            LeadsVisits.start_date < end_date.date(),
                        ),
                    )
                )
            )

        if employee_visits:
            min_visits = int(employee_visits.rstrip("+"))
            if employee_visits.endswith("+"):
                query = query.having(number_of_employees >= min_visits)
            else:
                query = query.having(number_of_employees == min_visits)

        if revenue_range:
            revenue_map = {
                "Under 1M": "Under 1 Million",
                "$1M - $5M": "1 Million to 5 Million",
                "$5M - $10M": "5 Million to 10 Million",
                "$10M - $25M": "10 Million to 25 Million",
                "$25M - $50M": "25 Million to 50 Million",
                "$50M - $100M": "50 Million to 100 Million",
                "$100M - $250M": "100 Million to 250 Million",
                "$250M - $500M": "250 Million to 500 Million",
                "$500M - $1B": "500 Million to 1 Billion",
                "$1 Billion +": "1 Billion and Over",
            }

            revenue = [
                revenue_map.get(unquote(i.strip()), None)
                for i in revenue_range.split(",")
            ]

            revenue_list = [e for e in revenue if e]
            filters = []
            if revenue_list:
                filters.append(LeadCompany.revenue.in_(revenue_list))
            if "unknown" in revenue_range:
                filters.append(LeadCompany.revenue.is_(None))
            if filters:
                query = query.filter(or_(*filters))

        if employees_range:
            employees_map = {
                "1-10": "1 to 10",
                "11-25": "11 to 25",
                "26-50": "26 to 50",
                "51-100": "51 to 100",
                "101-250": "101 to 250",
                "251-500": "251 to 500",
                "501-1000": "501 to 1000",
                "1001-5000": "1001 to 5000",
                "2001-5000": "2001 to 5000",
                "5001-10000": "5001 to 10000",
                "10000+": "10000+",
            }

            employees = [
                employees_map.get(unquote(i.strip()), None)
                for i in employees_range.split(",")
            ]
            employees_list = [e for e in employees if e]
            filters = []
            if employees_list:
                filters.append(LeadCompany.employee_count.in_(employees_list))
            if "unknown" in employees_range:
                filters.append(LeadCompany.employee_count.is_(None))
            if filters:
                query = query.filter(or_(*filters))

        if industry:
            industries = [unquote(i.strip()) for i in industry.split(",")]
            query = query.filter(LeadCompany.primary_industry.in_(industries))

        if regions:
            filters = []
            region_list = regions.split(",")
            for region_data in region_list:
                region_data = region_data.split("-")
                filters.append(
                    FiveXFiveLocations.city.ilike(f"{region_data[0]}%")
                )

                if len(region_data) > 1 and region_data[1]:
                    filters.append(
                        States.state_name.ilike(f"{region_data[1]}%")
                    )

            query = query.filter(or_(*filters))

        if search_query:
            filters = [
                LeadCompany.name.ilike(f"{search_query}%"),
                LeadCompany.phone.ilike(f"%{search_query.replace('+', '')}%"),
            ]

            query = query.filter(or_(*filters))

        companies = query.limit(self.DOWNLOAD_LIMIT_ROWS).all()
        return companies

    async def get_unique_primary_departments(
        self, company_id: str
    ) -> List[str]:
        print(self.delivr_users_table)
        query = f"""
        SELECT 
            du.department
        FROM leads_companies lc
        LEFT JOIN {self.delivr_users_table} du ON du.company_id_right = lc.company_id
        WHERE lc.company_id = %(company_id)s
        AND du.department IS NOT NULL
        ORDER BY du.department
        """
        # try:
        print("---")
        print(query)
        result = await self.click_house.query(query, {"company_id": company_id})
        print(query)
        rows = list[dict](result.named_results())
        print(rows)

        departments = []
        for row in rows:
            department = row["department"]
            if department:
                department = department.strip()
                departments.append(department)

        return departments
        # except Exception:
        #     return []

    async def get_uniq_primary_industry(self, pixel_id: UUID) -> List[str]:
        query = f"""
        SELECT 
            DISTINCT lc.company_industry
        FROM leads_companies lc
        LEFT JOIN {self.users_table} lu ON lc.company_id = lu.company_id
        WHERE lu.pixel_id = %(pixel_id)s
        ORDER BY lc.company_industry
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
        except Exception:
            return []

    async def _get_total_companies_count_with_filters(
        self, params: Dict[str, Any]
    ) -> int:
        where_clause = await self.build_where_clause(params=params)

        sql = f"""
            SELECT COUNT(DISTINCT lc.company_id) AS cnt 
            FROM {self.companies_table} lc
            INNER JOIN {self.users_table} lu ON lc.company_id = lu.company_id
            WHERE {where_clause}
        """

        result = await self.click_house.query(sql, params)
        row = list(result.named_results())[0]
        return int(row["cnt"])

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
        print(start_letter)
        print(pixel_id)
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
        print(query)
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
        """Загрузка компаний с пагинацией"""
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
        """Получение общего количества компаний"""
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
        """Построение фильтра по времени"""
        filters = []
        if params.get("from_dt"):
            filters.append("lv.visit_start >= %(from_dt)s")
        if params.get("to_dt"):
            filters.append("lv.visit_start < %(to_dt)s")

        return " AND " + " AND ".join(filters) if filters else ""
