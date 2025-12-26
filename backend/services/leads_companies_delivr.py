import csv
from datetime import datetime, timedelta, timezone
import io
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from resolver import injectable
from persistence.company_delivr_persistence import (
    CompanyLeadsPersistenceClickhouse,
)


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
        parsed_industry = await self._parse_industry(industry)
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
            parsed_industry = await self._parse_industry(industry)
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

    async def get_uniq_primary__seniorities(self, company_id):
        seniorities = await self.company_leads_persistence.get_unique_primary__seniorities(
            company_id
        )
        return seniorities

    async def get_uniq_primary__departments(self, company_id: str) -> List[str]:
        company_id = company_id.strip()
        if not company_id:
            return []
        print("1")
        departments = (
            await self.company_leads_persistence.get_unique_primary_departments(
                company_id=company_id
            )
        )
        print("2")
        print("---")
        print(departments)
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
        print("----")
        print(companies_data)
        results = set()
        for company in companies_data:
            name, phones = company

            print(f"Name: {name}, Phones: {phones}")

            if start_letter.isdecimal():
                # Ищем среди телефонов
                for phone in phones:
                    if phone and start_letter in phone:
                        results.add(phone)
            else:
                if name and start_letter.lower() in name.lower():
                    results.add(name)

        return list(results)[:10]

    async def get_company_lead_details(
        self,
        *,
        company_id: str,
        pixel_id: UUID,
        timezone_offset: int = 0,
    ) -> Dict[str, Any] | None:
        """
        Получение детальной информации о конкретной компании
        """
        # Получаем данные компании
        companies, _, _ = await self.get_company_leads(
            pixel_id=pixel_id,
            page=1,
            per_page=1,
            timezone_offset=timezone_offset,
            require_visits_in_range=False,
        )

        # Фильтруем по company_id
        for company in companies:
            if company.get("company_id") == company_id:
                return company

        return None

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
                print(range_str)
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

    async def _parse_industry(self, industry_str: str) -> List[str] | None:
        if not industry_str:
            return None

        return [industry.strip() for industry in industry_str.split(",")]

    async def get_company_employees(
        self,
        *,
        company_id: str,
        pixel_id: UUID,
        timezone_offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Получение списка сотрудников компании с их визитами
        """
        # Получаем детали компании
        company_details = await self.get_company_lead_details(
            company_id=company_id,
            pixel_id=pixel_id,
            timezone_offset=timezone_offset,
        )

        if not company_details:
            return []

        # Возвращаем сотрудников из деталей компании
        return company_details.get("employees", [])

    async def get_company_visits_stats(
        self,
        *,
        company_id: str,
        pixel_id: UUID,
        from_date=None,
        to_date=None,
        timezone_offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Получение статистики визитов компании
        """
        # Получаем детали компании
        company_details = await self.get_company_lead_details(
            company_id=company_id,
            pixel_id=pixel_id,
            timezone_offset=timezone_offset,
        )

        if not company_details:
            return {}

        # Формируем статистику
        stats = {
            "company_id": company_id,
            "company_name": company_details.get("company_name"),
            "total_visits": company_details.get("total_visits", 0),
            "unique_visitors": company_details.get("unique_visitors", 0),
            "total_visitors": company_details.get("total_visitors", 0),
            "pages_viewed_total": company_details.get("pages_viewed_total", 0),
            "total_time_spent": company_details.get("total_time_spent", 0),
            "first_visit": company_details.get("first_visit_date"),
            "last_visit": company_details.get("last_visit_date"),
            "employees_count": company_details.get("total_employees", 0),
        }

        return stats

    async def get_company_contact_info(
        self,
        *,
        company_id: str,
        pixel_id: UUID,
    ) -> Dict[str, Any]:
        """
        Получение контактной информации компании
        """
        # Получаем детали компании
        company_details = await self.get_company_lead_details(
            company_id=company_id,
            pixel_id=pixel_id,
            timezone_offset=0,  # Время не нужно для контактной информации
        )

        if not company_details:
            return {}

        # Формируем контактную информацию
        contact_info = {
            "company_id": company_id,
            "company_name": company_details.get("company_name"),
            "company_domain": company_details.get("company_domain"),
            "company_phone": company_details.get("company_phone"),
            "company_email": company_details.get("company_email"),
            "company_linkedin_url": company_details.get("company_linkedin_url"),
            "company_address": company_details.get("company_address"),
            "company_city": company_details.get("company_city"),
            "company_state": company_details.get("company_state"),
            "company_zip": company_details.get("company_zip"),
            "has_contact_info": company_details.get("has_contact_info", False),
            "has_email": company_details.get("has_email", False),
            "has_phone": company_details.get("has_phone", False),
            "has_linkedin": company_details.get("has_linkedin", False),
        }

        return contact_info

    async def get_top_companies_by_visits(
        self,
        *,
        pixel_id: UUID,
        limit: int = 10,
        from_date=None,
        to_date=None,
        timezone_offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Получение топ компаний по количеству визитов
        """
        # Используем основной метод с увеличенным per_page
        companies, _, _ = await self.get_company_leads(
            pixel_id=pixel_id,
            page=1,
            per_page=limit,
            from_date=from_date,
            to_date=to_date,
            timezone_offset=timezone_offset,
            require_visits_in_range=True,
        )

        # Сортируем по количеству визитов (если нужно)
        companies_sorted = sorted(
            companies, key=lambda x: x.get("total_visits", 0), reverse=True
        )

        # Возвращаем ограниченное количество
        return companies_sorted[:limit]

    async def get_companies(
        self,
        *,
        pixel_id: UUID,
        min_employees: int = 0,
        max_employees: int = None,
        timezone_offset: int = 0,
    ) -> List[Dict[str, Any]]:
        companies, _, _ = await self.get_company_leads(
            pixel_id=pixel_id,
            page=1,
            per_page=1000,  # Большое значение для получения всех компаний
            timezone_offset=timezone_offset,
            require_visits_in_range=False,
        )

        # Фильтруем по количеству сотрудников
        filtered_companies = []
        for company in companies:
            employees_count = company.get("total_employees", 0)

            if employees_count < min_employees:
                continue

            if max_employees is not None and employees_count > max_employees:
                continue

            filtered_companies.append(company)

        return company_list, count, max_page
