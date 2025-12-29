import csv
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import io
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from resolver import injectable
from persistence.company_delivr_persistence import (
    CompanyLeadsPersistenceClickhouse,
)


@dataclass
class EmployeeRecord:
    id: str
    first_name: str
    last_name: str
    mobile_phone: Optional[str]
    linkedin_url: Optional[str]
    personal_email: Optional[str]
    business_email: Optional[str]
    seniority: Optional[str]
    department: Optional[str]
    job_title: Optional[str]
    city: Optional[str]
    state: Optional[str]
    is_unlocked: bool = True


@dataclass
class FullEmployeeRecord:
    id: str
    first_name: str
    last_name: str
    mobile_phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    personal_email: Optional[str] = None
    business_email: Optional[str] = None
    seniority: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    company_name: Optional[str] = None
    company_city: Optional[str] = None
    company_phone: Optional[str] = None
    company_description: Optional[str] = None
    company_address: Optional[str] = None
    company_zip: Optional[str] = None
    company_linkedin_url: Optional[str] = None
    personal_zip: Optional[str] = None
    company_domain: Optional[str] = None
    personal_address: Optional[str] = None
    other_personal_emails: Optional[str] = None
    company_state: Optional[str] = None
    is_unlocked: bool = True


class DataFormatter:
    @staticmethod
    def process_field(field):
        formatted_str = ""
        status = field.get("visibility_status")
        value = field.get("value")
        if status == "visible":
            return (
                value.capitalize()
                if isinstance(value, str) and "@" not in value
                else value
            )
        return formatted_str

    @staticmethod
    def format_email_list(emails: str | None | list) -> str | None:
        if not emails:
            return None

        if isinstance(emails, list):
            email_list = emails

        elif isinstance(emails, str):
            emails_clean = emails.strip("[]")
            if not emails_clean:
                return None
            email_list = [
                email.strip()
                for email in emails_clean.split(",")
                if email.strip()
            ]
        else:
            return None

        valid_emails = [email for email in email_list if email]
        if not valid_emails:
            return None

        return ", ".join(valid_emails)

    @staticmethod
    def get_field_with_status(field_value, is_unlocked):
        if field_value is None:
            return {"value": None, "visibility_status": "missing"}
        if not is_unlocked:
            return {"value": None, "visibility_status": "hidden"}
        return {"value": field_value, "visibility_status": "visible"}

    @staticmethod
    def format_phone_list(phones: str | list | None) -> str | None:
        if not phones:
            return None

        phone_list = []

        if isinstance(phones, list):
            phone_list = [str(phone) for phone in phones]
        elif isinstance(phones, str):
            phones = phones.strip()
            if phones.startswith("[") and phones.endswith("]"):
                phones = phones[1:-1].strip()

            if phones:
                phone_list = [phone.strip() for phone in phones.split(",")]

        out = []
        for raw in phone_list:
            if not raw:
                continue

            p = raw.strip()

            if p.endswith(".0"):
                p = p[:-2]

            if not p.startswith("+"):
                p = f"+{p}"

            out.append(p)

        return ", ".join(out) if out else None


class FullEmployeeBuilder:
    """Строитель для полной информации о сотруднике"""

    def __init__(self, state_dict: Optional[Dict] = None):
        """
        Args:
            state_dict: Словарь для конвертации кодов штатов в названия
        """
        self.formatter = DataFormatter()
        self.state_dict = state_dict or {}

    async def build(self, employee_data: Dict[str, Any]) -> FullEmployeeRecord:
        if not employee_data:
            return None

        return FullEmployeeRecord(
            id=employee_data.get("id"),
            first_name=employee_data.get("first_name"),
            last_name=employee_data.get("last_name"),
            mobile_phone=self.formatter.format_phone_list(
                employee_data.get("mobile_phones")
            ),
            linkedin_url=employee_data.get("linkedin_url"),
            personal_email=self.formatter.format_email_list(
                employee_data.get("personal_emails")
            ),
            business_email=self.formatter.format_email_list(
                employee_data.get("business_emails")
            ),
            seniority=employee_data.get("seniority_level"),
            department=employee_data.get("department"),
            job_title=employee_data.get("job_title"),
            city=employee_data.get("personal_city"),
            state=employee_data.get("personal_state"),
            company_name=employee_data.get("company_name"),
            company_city=employee_data.get("company_city"),
            company_phone=self.formatter.format_phone_list(
                employee_data.get("company_phones")
            ),
            company_description=employee_data.get("company_description"),
            company_address=employee_data.get("company_address"),
            company_zip=employee_data.get("company_zip_code"),
            company_linkedin_url=employee_data.get("company_linkedin_url"),
            personal_zip=employee_data.get("personal_zip"),
            company_domain=employee_data.get("company_domain"),
            personal_address=employee_data.get("personal_address"),
            other_personal_emails=self.formatter.format_email_list(
                employee_data.get("other_personal_emails")
            ),
            company_state=employee_data.get("company_state"),
        )

    async def build_to_dict(
        self, employee_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        employee_record = await self.build(employee_data)

        return {
            "id": self.formatter.get_field_with_status(
                employee_record.id, True
            ),
            "first_name": self.formatter.get_field_with_status(
                employee_record.first_name, True
            ),
            "last_name": self.formatter.get_field_with_status(
                employee_record.last_name, True
            ),
            "mobile_phone": self.formatter.get_field_with_status(
                employee_record.mobile_phone, False
            ),
            "linkedin_url": self.formatter.get_field_with_status(
                employee_record.linkedin_url, False
            ),
            "personal_email": self.formatter.get_field_with_status(
                employee_record.personal_email, False
            ),
            "business_email": self.formatter.get_field_with_status(
                employee_record.business_email, False
            ),
            "seniority": self.formatter.get_field_with_status(
                employee_record.seniority, True
            ),
            "department": self.formatter.get_field_with_status(
                employee_record.department, True
            ),
            "job_title": self.formatter.get_field_with_status(
                employee_record.job_title, True
            ),
            "city": self.formatter.get_field_with_status(
                employee_record.city, True
            ),
            "state": self.formatter.get_field_with_status(
                employee_record.state, True
            ),
            "company_name": self.formatter.get_field_with_status(
                employee_record.company_name, True
            ),
            "company_city": self.formatter.get_field_with_status(
                employee_record.company_city, True
            ),
            "company_phone": self.formatter.get_field_with_status(
                employee_record.company_phone, False
            ),
            "company_description": self.formatter.get_field_with_status(
                employee_record.company_description, True
            ),
            "company_address": self.formatter.get_field_with_status(
                employee_record.company_address, True
            ),
            "company_zip": self.formatter.get_field_with_status(
                employee_record.company_zip, True
            ),
            "company_linkedin_url": self.formatter.get_field_with_status(
                employee_record.company_linkedin_url, True
            ),
            "personal_zip": self.formatter.get_field_with_status(
                employee_record.personal_zip, False
            ),
            "company_domain": self.formatter.get_field_with_status(
                employee_record.company_domain, True
            ),
            "personal_address": self.formatter.get_field_with_status(
                employee_record.personal_address, False
            ),
            "other_personal_emails": self.formatter.get_field_with_status(
                employee_record.other_personal_emails, False
            ),
            "company_state": self.formatter.get_field_with_status(
                employee_record.company_state, True
            ),
            "is_unlocked": self.formatter.get_field_with_status(False, True),
        }


class EmployeeBuilder:
    """Строитель объектов EmployeeRecord"""

    def __init__(self):
        self.formatter = DataFormatter()

    async def build(self, employee_data: Dict[str, Any]) -> EmployeeRecord:
        return EmployeeRecord(
            id=employee_data.get("id", ""),
            first_name=str(employee_data.get("first_name", "")).strip(),
            last_name=str(employee_data.get("last_name", "")).strip(),
            mobile_phone=self.formatter.format_phone_list(
                employee_data.get("mobile_phones")
            ),
            linkedin_url=employee_data.get("linkedin_url"),
            personal_email=self.formatter.format_email_list(
                employee_data.get("personal_emails")
            ),
            business_email=self.formatter.format_email_list(
                employee_data.get("business_emails")
            ),
            seniority=employee_data.get("seniority_level"),
            department=employee_data.get("department"),
            job_title=employee_data.get("job_title"),
            city=employee_data.get("personal_city"),
            state=employee_data.get("personal_state"),
            is_unlocked=True,
        )

    async def build_to_dict(
        self, employee_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        employee_record = await self.build(employee_data)

        return {
            "id": self.formatter.get_field_with_status(
                employee_record.id, True
            ),
            "first_name": self.formatter.get_field_with_status(
                employee_record.first_name, True
            ),
            "last_name": self.formatter.get_field_with_status(
                employee_record.last_name, True
            ),
            "mobile_phone": self.formatter.get_field_with_status(
                employee_record.mobile_phone, False
            ),
            "linkedin_url": self.formatter.get_field_with_status(
                employee_record.linkedin_url, False
            ),
            "personal_email": self.formatter.get_field_with_status(
                employee_record.personal_email, False
            ),
            "business_email": self.formatter.get_field_with_status(
                employee_record.business_email, False
            ),
            "seniority": self.formatter.get_field_with_status(
                employee_record.seniority, True
            ),
            "department": self.formatter.get_field_with_status(
                employee_record.department, True
            ),
            "job_title": self.formatter.get_field_with_status(
                employee_record.job_title, True
            ),
            "city": self.formatter.get_field_with_status(
                employee_record.city, True
            ),
            "state": self.formatter.get_field_with_status(
                employee_record.state, True
            ),
            "is_unlocked": self.formatter.get_field_with_status(False, True),
        }

    async def build_batch(
        self, employees_data: List[Dict[str, Any]] | []
    ) -> List[Dict[str, Any]]:
        return [
            await self.build_to_dict(employee) for employee in employees_data
        ]


@injectable
class AsyncCompanyLeadsService:
    def __init__(
        self,
        company_leads_persistence: CompanyLeadsPersistenceClickhouse,
    ):
        self.company_leads_persistence = company_leads_persistence

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

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    async def get_company_leads(
        self,
        *,
        pixel_id: UUID,
        sort_by: str = None,
        sort_order: str = "desc",
        regions: str = None,
        employees_range: str = None,
        employee_visits: int = None,
        revenue_range: str = None,
        industry: str = None,
        search_query: str = None,
        page: int = 1,
        per_page: int = 50,
        from_date: int | None = None,
        to_date: int | None = None,
        timezone_offset: int = 0,
    ) -> Tuple[List[Dict[str, Any]], int, int]:
        adjusted_from_date = await self._adjust_timestamp_for_timezone(
            from_date, timezone_offset
        )
        adjusted_to_date = await self._adjust_timestamp_for_timezone(
            to_date, timezone_offset
        )
        parsed_employees_range = await self._parse_employees_range(
            employees_range
        )
        parsed_revenue_range = await self.parse_revenue_ranges(revenue_range)
        parsed_regions = await self._parse_regions(regions)
        parsed_industry = await self.parse_comma_separated_list(industry)
        filter_params = {
            "pixel_id": pixel_id,
            "page": page,
            "sort_by": sort_by,
            "employees_range": parsed_employees_range,
            "employee_visits": employee_visits,
            "industry": parsed_industry,
            "revenue_range": parsed_revenue_range,
            "search_query": search_query,
            "regions": parsed_regions,
            "sort_order": sort_order,
            "per_page": per_page,
            "adjusted_from_date": adjusted_from_date,
            "adjusted_to_date": adjusted_to_date,
            "timezone_offset": timezone_offset,
        }
        filtered_params = {
            key: value
            for key, value in filter_params.items()
            if value is not None
        }

        (
            companies,
            total_count,
            max_page,
        ) = await self.company_leads_persistence.filter_company_leads(
            **filtered_params
        )
        return companies, total_count, max_page

    async def download_companies(
        self,
        company_id: Optional[int] = None,
        from_date: Optional[int] = None,
        to_date: Optional[int] = None,
        employee_visits: Optional[int] = None,
        revenue_range: Optional[str] = None,
        regions: Optional[str] = None,
        employees_range: Optional[str] = None,
        industry: Optional[str] = None,
        search_query: Optional[str] = None,
        *,
        pixel_id: str,
    ):
        if company_id:
            company = await self.company_leads_persistence.get_company_by_id(
                pixel_id=pixel_id, company_id=company_id
            )
            companies = [company] if company else []
        else:
            adjusted_from_date = await self._adjust_timestamp_for_timezone(
                from_date, 0
            )
            adjusted_to_date = await self._adjust_timestamp_for_timezone(
                to_date, 0
            )
            parsed_employees_range = await self._parse_employees_range(
                employees_range
            )
            parsed_revenue_range = await self.parse_revenue_ranges(
                revenue_range
            )
            parsed_regions = await self._parse_regions(regions)
            parsed_industry = await self.parse_comma_separated_list(industry)
            filter_params = {
                "pixel_id": pixel_id,
                "employees_range": parsed_employees_range,
                "employee_visits": employee_visits,
                "industry": parsed_industry,
                "revenue_range": parsed_revenue_range,
                "search_query": search_query,
                "regions": parsed_regions,
                "adjusted_from_date": adjusted_from_date,
                "adjusted_to_date": adjusted_to_date,
            }
            filtered_params = {
                key: value
                for key, value in filter_params.items()
                if value is not None
            }
            companies = await self.company_leads_persistence.get_full_information_companies_by_filters(
                filtered_params
            )

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "Company name",
                "Company phone",
                "Company LinkedIn URL",
                "Number of employees",
                "First visit date",
                "Company revenue",
                "Company employee count",
                "Company address",
                "Primary industry",
                "Company domain",
                "Company zip",
                "Company description",
                "City",
                "State",
            ]
        )
        for company in companies:
            country = company.get("company_country", "")
            city = company.get("company_city", "")
            address = f"{country} {city}".strip()
            relevant_data = [
                company.get("company_name") or "None",
                company.get("company_phones") or "None",
                company.get("company_linkedin_url") or "None",
                company.get("employees_visited") or "None",
                company.get("visited_date") or "None",
                company.get("company_revenue_range") or "None",
                company.get("company_employee_count_range") or "None",
                address or "None",
                company.get("company_industry") or "None",
                company.get("company_domain") or "None",
                company.get("company_zip_code") or "None",
                company.get("company_description") or "None",
                company.get("company_city") or "None",
                company.get("company_state") or "None",
            ]
            writer.writerow(relevant_data)

        output.seek(0)
        return output

    async def get_uniq_primary__job_titles(self, company_id):
        job_titles = (
            await self.company_leads_persistence.get_unique_primary__job_titles(
                company_id
            )
        )
        return job_titles

    async def download_employees(
        self,
        company_id: str,
        sort_by: Optional[str] = None,
        sort_order: str = "desc",
        regions: Optional[str] = None,
        search_query: Optional[str] = None,
        job_title: Optional[str] = None,
        seniority: Optional[str] = None,
        department: Optional[str] = None,
    ):
        employees_list, _, _ = await self.get_employees(
            company_id=company_id,
            sort_by=sort_by,
            sort_order=sort_order,
            regions=regions,
            search_query=search_query,
            job_title=job_title,
            seniority=seniority,
            department=department,
        )

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "First name",
                "Last name",
                "Mobile phone",
                "Linkedin url",
                "Personal email",
                "Business email",
                "Seniority",
                "Department",
                "Job title",
                "City",
                "State",
            ]
        )
        self.formatter = DataFormatter()
        for employee in employees_list:
            writer.writerow(
                [
                    self.formatter.process_field(employee.get("first_name")),
                    self.formatter.process_field(employee.get("last_name")),
                    self.formatter.process_field(employee.get("mobile_phone")),
                    self.formatter.process_field(employee.get("linkedin_url")),
                    self.formatter.process_field(
                        employee.get("personal_email")
                    ),
                    self.formatter.process_field(
                        employee.get("business_email")
                    ),
                    self.formatter.process_field(employee.get("seniority")),
                    self.formatter.process_field(employee.get("department")),
                    self.formatter.process_field(employee.get("job_title")),
                    self.formatter.process_field(employee.get("city")),
                    self.formatter.process_field(employee.get("state")),
                ]
            )

        output.seek(0)
        return output

    async def get_employees(
        self,
        sort_by: Optional[str] = None,
        sort_order: str = "desk",
        search_query: Optional[str] = None,
        job_title: Optional[str] = None,
        seniority: Optional[str] = None,
        regions: Optional[str] = None,
        department: Optional[str] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
        *,
        company_id: int,
    ) -> Dict[str, Any]:
        parsed_regions = await self._parse_regions(regions)
        parsed_departments = await self.parse_comma_separated_list(department)
        parsed_job_title = await self.parse_comma_separated_list(job_title)
        parsed_seniority = await self.parse_comma_separated_list(seniority)
        filter_params = {
            "company_id": company_id,
            "job_title": parsed_job_title,
            "department": parsed_departments,
            "seniority": parsed_seniority,
            "page": page,
            "sort_by": sort_by,
            "search_query": search_query,
            "regions": parsed_regions,
            "sort_order": sort_order,
            "per_page": per_page,
        }
        filtered_params = {
            key: value
            for key, value in filter_params.items()
            if value is not None
        }
        (
            employees,
            count,
            max_page,
        ) = await self.company_leads_persistence.filter_employees(
            **filtered_params
        )

        employee_builder = EmployeeBuilder()
        employees_list = await employee_builder.build_batch(employees)

        return employees_list, count, max_page

    async def get_full_information_employee(
        self, company_id, employee_id
    ) -> Dict[str, Any]:
        employee_data = (
            await self.company_leads_persistence.get_full_information_employee(
                company_id=company_id, employee_id=employee_id
            )
        )
        full_employee_builder = FullEmployeeBuilder()
        return await full_employee_builder.build_to_dict(
            employee_data=employee_data
        )

    async def download_employee(self, employee_id, company_id):
        employee = await self.get_full_information_employee(
            company_id=company_id, employee_id=employee_id
        )

        headers_mapping = [
            ("First name", "first_name"),
            ("Last name", "last_name"),
            ("Mobile phone", "mobile_phone"),
            ("Linkedin url", "linkedin_url"),
            ("Personal email", "personal_email"),
            ("Business email", "business_email"),
            ("Seniority", "seniority"),
            ("Department", "department"),
            ("Job title", "job_title"),
            ("City", "city"),
            ("State", "state"),
            ("Company name", "company_name"),
            ("Company city", "company_city"),
            ("Company description", "company_description"),
            ("Company address", "company_address"),
            ("Company zip", "company_zip"),
            ("Company linkedin url", "company_linkedin_url"),
            ("Business email last seen", "business_email_last_seen"),
            ("Personal email last seen", "personal_emails_last_seen"),
            ("Personal zip", "personal_zip"),
            ("Company last updated", "company_last_updated"),
            ("Company domain", "company_domain"),
            ("Personal address", "personal_address"),
            ("Other personal emails", "other_personal_emails"),
            ("Company state", "company_state"),
        ]

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Column", "Value"])

        for header, key in headers_mapping:
            field = employee.get(
                key, {"value": None, "visibility_status": "missing"}
            )
            value = field.get("value")
            status = field.get("visibility_status", "missing")
            formatted_value = ""

            if status == "visible":
                formatted_value = (
                    value.capitalize()
                    if isinstance(value, str) and "@" not in value
                    else value
                )

            writer.writerow([header, formatted_value])

        output.seek(0)
        return output

    async def get_uniq_primary__seniorities(self, company_id):
        seniorities = await self.company_leads_persistence.get_unique_primary__seniorities(
            company_id
        )
        return seniorities

    async def get_uniq_primary__departments(self, company_id: str) -> List[str]:
        company_id = company_id.strip()
        if not company_id:
            return []

        departments = (
            await self.company_leads_persistence.get_unique_primary_departments(
                company_id=company_id
            )
        )
        return departments

    async def get_uniq_primary_industry(self, pixel_id: UUID) -> List[str]:
        departments = (
            await self.company_leads_persistence.get_uniq_primary_industry(
                pixel_id=pixel_id
            )
        )
        return departments

    async def search_location(self, start_letter, pixel_id):
        start_letter = start_letter.strip().lower()
        if not start_letter:
            return []

        location_data = await self.company_leads_persistence.search_location(
            start_letter=start_letter, pixel_id=pixel_id
        )
        results_set = set()
        for location in location_data:
            city, state = location
            results_hash = {"city": city.title(), "state": state}

            results_set.add(frozenset[tuple[str, Any]](results_hash.items()))
        results = [dict[Any, Any](item) for item in results_set]
        limited_results = list[dict[Any, Any]](results)[:10]
        return limited_results

    async def search_company(self, start_letter: str, pixel_id: UUID):
        start_letter = start_letter.replace("+", "").strip().lower()

        if start_letter.isdecimal():
            start_letter = start_letter.replace(" ", "")
        if not start_letter:
            return []

        companies_data = await self.company_leads_persistence.search_company(
            start_letter=start_letter, pixel_id=pixel_id
        )

        results = set()
        for company in companies_data:
            name, phones = company

            if start_letter.isdecimal():
                for phone in phones:
                    if phone and start_letter in phone:
                        results.add(phone)
            else:
                if name and start_letter.lower() in name.lower():
                    results.add(name)

        return list(results)[:10]

    async def _adjust_timestamp_for_timezone(
        self, timestamp: Optional[int], timezone_offset: int
    ) -> Optional[datetime]:
        if timestamp is None:
            return None

        dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)

        if timezone_offset != 0:
            dt = dt + timedelta(hours=timezone_offset)

        return dt

    async def _parse_employees_range(
        self, employees_range_str: str
    ) -> List[Dict[str, Any]] | None:
        if not employees_range_str:
            return None

        try:
            ranges = []
            for range_str in employees_range_str.split(","):
                if "-" in range_str:
                    min_str, max_str = range_str.split("-")
                    ranges.append({"min": int(min_str), "max": int(max_str)})

                elif range_str == "unknown":
                    ranges.append({"min": None, "max": None})
                else:
                    if "+" in range_str:
                        num_str = range_str.rstrip("+")
                        ranges.append({"min": int(num_str), "max": None})
                    else:
                        num = int(range_str)
                        ranges.append({"min": int(num), "max": int(num)})
            return ranges
        except (ValueError, AttributeError):
            return None

    async def parse_revenue_ranges(
        self, revenue_range_str
    ) -> List[Dict[str, Any]] | None:
        if not revenue_range_str:
            return None

        multiplier_map = {
            "M": 1_000_000,
            "B": 1_000_000_000,
            "Billion": 1_000_000_000,
        }

        def parse_value(value_str):
            if not value_str:
                return None

            value_str = value_str.strip().replace("$", "").replace(",", "")

            if value_str.lower() == "under":
                return None
            elif value_str.lower() == "unknown":
                return None

            if value_str.endswith("+"):
                value_str = value_str[:-1].strip()
                is_plus = True
            else:
                is_plus = False

            for suffix, multiplier in multiplier_map.items():
                if suffix in value_str:
                    num_part = value_str.replace(suffix, "").strip()
                    try:
                        value = float(num_part) * multiplier
                        return (value, is_plus)
                    except ValueError:
                        return (None, is_plus)

            try:
                return (float(value_str), is_plus)
            except ValueError:
                return (None, is_plus)

        ranges = []
        for range_str in revenue_range_str.split(","):
            range_str = range_str.strip()

            if not range_str:
                continue

            if range_str.lower() == "under 1m":
                ranges.append(
                    {"min": None, "max": 1_000_000, "label": range_str}
                )
            elif range_str.lower() == "unknown":
                ranges.append({"min": None, "max": None, "label": range_str})
            elif "billion +" in range_str.lower():
                value_str = (
                    range_str.lower()
                    .replace("billion +", "")
                    .replace("$", "")
                    .strip()
                )
                try:
                    min_val = float(value_str) * 1_000_000_000
                    ranges.append(
                        {"min": min_val, "max": None, "label": range_str}
                    )
                except ValueError:
                    ranges.append(
                        {"min": None, "max": None, "label": range_str}
                    )
            elif "+" in range_str:
                value_str = range_str.replace("+", "").strip()
                parsed = parse_value(value_str)
                if parsed[0] is not None:
                    ranges.append(
                        {"min": parsed[0], "max": None, "label": range_str}
                    )
                else:
                    ranges.append(
                        {"min": None, "max": None, "label": range_str}
                    )
            elif "-" in range_str:
                parts = range_str.split("-")
                if len(parts) == 2:
                    min_val, _ = parse_value(parts[0])
                    max_val, _ = parse_value(parts[1])
                    ranges.append(
                        {"min": min_val, "max": max_val, "label": range_str}
                    )
            else:
                parsed = parse_value(range_str)
                if parsed[0] is not None:
                    ranges.append(
                        {"min": parsed[0], "max": None, "label": range_str}
                    )
                else:
                    ranges.append(
                        {"min": None, "max": None, "label": range_str}
                    )

        return ranges

    async def _parse_regions(
        self, regions_str: str
    ) -> List[Dict[str, str]] | None:
        if not regions_str:
            return None

        regions = []
        for region in regions_str.split(","):
            if "-" in region:
                city, state = region.strip().split("-", 1)
                regions.append({"city": city.strip(), "state": state.strip()})

        return regions if regions else None

    async def parse_comma_separated_list(
        self, input_value: Any
    ) -> List[str] | None:
        """Принимает строку или список и возвращает очищенный список."""
        if not input_value:
            return None

        if isinstance(input_value, str):
            return [
                item.strip() for item in input_value.split(",") if item.strip()
            ]
        elif isinstance(input_value, list):
            return [
                item.strip()
                for item in input_value
                if isinstance(item, str) and item.strip()
            ]
        else:
            return [str(input_value).strip()]
