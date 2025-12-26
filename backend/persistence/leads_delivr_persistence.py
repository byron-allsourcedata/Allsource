from datetime import datetime, timezone, timedelta
import math
from typing import Tuple, List, Dict, Any, Optional
from uuid import UUID
from dataclasses import dataclass

from config import ClickhouseConfig
from db_dependencies import AsyncClickHouse
from resolver import injectable


@dataclass
class LeadRecord:
    """DTO для данных лида"""

    # identifiers
    profile_pid_all: str

    # personal info
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    marital_status: Optional[str] = None
    children: Optional[str] = None
    income_range: Optional[str] = None
    net_worth: Optional[str] = None
    personal_zip: Optional[str] = None
    personal_state: Optional[str] = None
    personal_address: Optional[str] = None
    personal_address_2: Optional[str] = None
    linkedin_url: Optional[str] = None
    mobile_phone: Optional[str] = None
    personal_phone: Optional[str] = None
    business_email: Optional[str] = None
    personal_emails: Optional[str] = None
    primary_industry: Optional[str] = None

    # company
    company_name: Optional[str] = None
    company_domain: Optional[str] = None
    company_phone: Optional[str] = None
    job_title: Optional[str] = None
    company_linkedin_url: Optional[str] = None
    company_sic: Optional[str] = None
    company_address: Optional[str] = None
    company_city: Optional[str] = None
    company_state: Optional[str] = None
    company_revenue: Optional[str] = None
    company_employee_count: Optional[str] = None
    company_last_updated: Optional[str] = None
    professional_zip: Optional[str] = None
    company_zip: Optional[str] = None
    company_description: Optional[str] = None
    seniority_level: Optional[str] = None
    department: Optional[str] = None

    # visit data
    behavior_type: Optional[str] = None
    first_visited_date: Optional[str] = None
    first_visited_time: Optional[str] = None
    pages_count: Optional[int] = None
    time_spent: Optional[int] = None

    # meta
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # social data
    social_connections: Optional[str] = None

    # visitor info
    recurring_visits: Optional[bool] = None
    visitor_type: bool = False
    is_active: Optional[bool] = None

    # page visits detail
    page_visits: List[Dict[str, Any]] = None

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
    def format_phone(phones: Optional[str]) -> Optional[str]:
        if not phones:
            return None

        formatted = []
        for raw in str(phones).split(","):
            p = raw.strip()
            if p.endswith(".0"):
                p = p[:-2]
            if p and not p.startswith("+"):
                p = f"+{p}"
            if p:
                formatted.append(p)

        return ", ".join(formatted) or None

    @staticmethod
    def parse_age_range(
        age_range: Optional[str],
    ) -> Tuple[Optional[int], Optional[int]]:
        if not age_range:
            return None, None
        try:
            if "-" in age_range:
                min_age, max_age = age_range.split("-")
                return int(min_age), int(max_age)
        except (ValueError, AttributeError):
            pass
        return None, None

    @staticmethod
    def apply_timezone(
        dt: Optional[datetime], offset_hours: int
    ) -> Tuple[Optional[str], Optional[str]]:
        if not dt:
            return None, None

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        adjusted = dt + timedelta(hours=offset_hours)
        return adjusted.strftime("%d.%m.%Y"), adjusted.strftime("%H:%M")

    @staticmethod
    def format_name(name: Optional[str]) -> Optional[str]:
        if not name:
            return None
        return str(name).capitalize()

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


class DelivrDataProcessor:
    """Обработчик данных из delivr"""

    def __init__(self):
        self.formatter = DataFormatter()

    def process(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """Обработка одной строки из delivr"""
        age_min, age_max = self.formatter.parse_age_range(row.get("age_range"))

        # Обработка телефонов
        mobile_phone = self.formatter.join_values(row.get("mobile_phones"))
        personal_phone = self.formatter.join_values(row.get("personal_phones"))
        company_phone = self.formatter.join_values(row.get("company_phones"))

        # Обработка директорских номеров
        direct_numbers = row.get("direct_numbers") or []
        personal_phones = row.get("personal_phones") or []
        direct_number = self.formatter.join_values(
            [num for num in direct_numbers if num not in personal_phones]
        )

        return {
            "first_name": row.get("first_name"),
            "last_name": row.get("last_name"),
            "programmatic_business_emails": self.formatter.join_values(
                row.get("business_emails")
            ),
            "mobile_phone_raw": mobile_phone,
            "personal_phone_raw": personal_phone,
            "gender": row.get("gender"),
            "direct_number": direct_number,
            "business_email": row.get("current_business_email"),
            "personal_emails_raw": self.formatter.join_values(
                row.get("personal_emails") or row.get("primary_contact_emails")
            ),
            "personal_city": row.get("personal_city"),
            "personal_state": row.get("personal_state"),
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
            "net_worth": row.get("net_worth"),
            "job_title": row.get("job_title"),
            "last_updated": row.get("last_updated"),
            "age_min": age_min,
            "age_max": age_max,
            "linkedin_url": row.get("linkedin_url"),
            "personal_address": row.get("personal_address"),
            "personal_address_2": row.get("personal_address_2"),
            "married": row.get("is_married"),
            "children": row.get("has_children"),
            "income_range": row.get("income_range_lc"),
            "homeowner": row.get("is_homeowner"),
            "seniority_level": row.get("seniority_level"),
            "department": row.get("department"),
            "professional_address": row.get("company_address"),
            "professional_address_2": row.get("company_address2"),
            "professional_city": row.get("company_city"),
            "professional_state": row.get("company_state"),
            "primary_industry": row.get("company_industry"),
            "business_email_validation_status": row.get(
                "current_business_email_validation_status"
            ),
            "business_email_last_seen": row.get(
                "current_business_email_validation_date"
            ),
            "work_history": row.get("job_title_history"),
            "education_history": row.get("education_history"),
            "company_description": row.get("company_description"),
            "related_domains": self.formatter.join_values(
                row.get("company_related_domains")
            ),
            "social_connections": row.get("social_connections"),
            "personal_zip": row.get("personal_zip"),
            "company_zip": row.get("company_zip_code"),
            "company_zip_code": row.get("company_zip_code"),
        }


class LeadBuilder:
    """Строитель объектов LeadRecord"""

    def __init__(self, timezone_offset: int = 0):
        self.formatter = DataFormatter()
        self.timezone_offset = timezone_offset

    def build(
        self,
        user_data: Dict[str, Any],
        visit_data: Optional[Dict[str, Any]],
        delivr_data: Dict[str, Any],
        page_visits: List[Dict[str, Any]],
    ) -> LeadRecord:
        """Создание LeadRecord из сырых данных"""

        # Объединение данных
        combined = {**user_data, **(visit_data or {}), **delivr_data}

        # Определение поведения
        behavior_type = (
            "converted_sales"
            if visit_data and visit_data.get("is_converted_sales")
            else combined.get("behavior_type")
        )

        # Форматирование даты визита
        visit_start = (
            combined.get("visit_start")
            or combined.get("first_visited_date")
            or combined.get("first_visit")
        )
        visit_date_str, visit_time_str = self.formatter.apply_timezone(
            visit_start, self.timezone_offset
        )

        # Время проведенное: суммарно по всем посещениям страниц в окне
        if page_visits:
            try:
                time_spent = sum(
                    int(p.get("spent_time_sec") or 0) for p in page_visits
                )
            except Exception:
                time_spent = combined.get("time_spent") or combined.get(
                    "full_time_sec"
                )
        else:
            time_spent = (
                combined.get("time_spent")
                or combined.get("full_time_sec")
                or combined.get("spent_time")
                or combined.get("spent_time_sec")
            )

        # Количество страниц: число посещений в окне
        pages_count = (
            len(page_visits)
            if page_visits
            else (combined.get("pages_count") or combined.get("page_count"))
        )

        # Форматирование телефонов
        mobile_phone = self.formatter.format_phone(
            combined.get("mobile_phone") or combined.get("mobile_phone_raw")
        )
        personal_phone = self.formatter.format_phone(
            combined.get("personal_phone") or combined.get("personal_phone_raw")
        )
        company_phone = self.formatter.format_phone(
            combined.get("company_phone") or combined.get("company_phone_raw")
        )

        # Форматирование даты обновления компании
        company_last_updated = None
        last_updated_raw = combined.get("company_last_updated") or combined.get(
            "last_updated"
        )
        if last_updated_raw and hasattr(last_updated_raw, "strftime"):
            company_last_updated = last_updated_raw.strftime("%d.%m.%Y %H:%M")

        return LeadRecord(
            # identifiers
            profile_pid_all=user_data["profile_pid_all"],
            # personal info
            first_name=self.formatter.format_name(combined.get("first_name")),
            last_name=self.formatter.format_name(combined.get("last_name")),
            gender=combined.get("gender"),
            age_min=combined.get("age_min"),
            age_max=combined.get("age_max"),
            marital_status=combined.get("married"),
            children=combined.get("children"),
            income_range=combined.get("income_range"),
            net_worth=combined.get("net_worth"),
            personal_zip=combined.get("personal_zip"),
            personal_state=combined.get("personal_state"),
            personal_address=combined.get("personal_address"),
            personal_address_2=combined.get("personal_address_2"),
            linkedin_url=combined.get("linkedin_url"),
            mobile_phone=mobile_phone,
            personal_phone=personal_phone,
            business_email=combined.get("business_email"),
            personal_emails=combined.get("personal_emails_raw"),
            primary_industry=combined.get("primary_industry"),
            # company
            company_name=combined.get("company_name"),
            company_domain=combined.get("company_domain"),
            company_phone=company_phone,
            job_title=combined.get("job_title"),
            company_linkedin_url=combined.get("company_linkedin_url"),
            company_sic=combined.get("company_sic"),
            company_address=combined.get("company_address"),
            company_city=combined.get("company_city"),
            company_state=combined.get("company_state"),
            company_revenue=combined.get("company_revenue"),
            company_employee_count=combined.get("company_employee_count"),
            company_last_updated=company_last_updated,
            professional_zip=combined.get("company_zip")
            or combined.get("company_zip_code"),
            company_zip=combined.get("company_zip")
            or combined.get("company_zip_code"),
            company_description=combined.get("company_description"),
            seniority_level=combined.get("seniority_level"),
            department=combined.get("department"),
            # visit data
            behavior_type=behavior_type,
            first_visited_date=visit_date_str,
            first_visited_time=visit_time_str,
            pages_count=pages_count,
            time_spent=time_spent,
            # meta
            created_at=combined.get("created_at"),
            updated_at=combined.get("updated_at"),
            # social data
            social_connections=combined.get("social_connections"),
            # visitor info
            recurring_visits=combined.get("is_returning_visitor"),
            visitor_type=False,
            is_active=combined.get("is_active"),
            # page visits detail
            page_visits=page_visits,
        )


@injectable
class LeadsPersistenceClickhouse:
    def __init__(self, click: AsyncClickHouse):
        self.click = click
        self.leads_table = "allsource_prod.leads_users"
        self.visits_table = "allsource_prod.leads_visits"
        self.delivr_table = ClickhouseConfig.delivr_table()
        self.formatter = DataFormatter()
        self.delivr_processor = DelivrDataProcessor()

    async def filter_leads(
        self,
        pixel_id: UUID,
        page: int = 1,
        per_page: int = 50,
        from_date: int | float | datetime | None = None,
        to_date: int | float | datetime | None = None,
        *,
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
        """
        Возвращает отформатированный список лидов с пагинацией и фильтрами.
        """
        params = self._prepare_params(
            pixel_id, page, per_page, from_date, to_date, timezone_offset
        )
        params.update(
            {
                "behavior_type": behavior_type,
                "status": status,
                "regions": regions,
                "page_url": page_url,
                "recurring_visits": recurring_visits,
                "average_time_sec": average_time_sec,
                "page_visits": page_visits,
                "search_query": search_query,
                "from_time": from_time,
                "to_time": to_time,
                "sort_by": sort_by,
                "sort_order": sort_order,
            }
        )

        users = await self._load_users(params)
        if not users:
            return [], 0, 0

        profile_ids = [u["profile_pid_all"] for u in users]

        visits_map = await self._load_last_visits(pixel_id, profile_ids, params)
        page_visits_map = await self._load_page_visits(
            pixel_id, profile_ids, params
        )
        delivr_data = await self._load_delivr_data(profile_ids)

        builder = LeadBuilder(timezone_offset)
        filtered: list[dict] = []

        def _split_csv(val: str | None) -> list[str]:
            if not val:
                return []
            return [x.strip().lower() for x in val.split(",") if x.strip()]

        behavior_list = _split_csv(behavior_type)
        status_list = _split_csv(status)
        regions_list = _split_csv(regions)
        url_tags = _split_csv(page_url)
        recurring_list = _split_csv(recurring_visits)
        time_spent_list = _split_csv(average_time_sec)
        page_visits_list = _split_csv(page_visits)
        q = (search_query or "").strip().lower()

        def _time_bucket_ok(av: int | None) -> bool:
            if av is None:
                return not time_spent_list
            conds = []
            for b in time_spent_list:
                if b in ("under_10", "under10", "<10"):
                    conds.append(av < 10)
                elif b in ("10-30_secs", "10_30", "10-30"):
                    conds.append(10 <= av <= 30)
                elif b in ("30-60_secs", "30_60", "30-60"):
                    conds.append(30 <= av <= 60)
                elif b in ("over_60", ">60", "over_60_secs"):
                    conds.append(av > 60)
            return any(conds) if conds else True

        def _pages_bucket_ok(pc: int | None) -> bool:
            if pc is None:
                return not page_visits_list
            conds = []
            for b in page_visits_list:
                if b in ("1_page", "1", "1_page(s)"):
                    conds.append(pc == 1)
                elif b in ("2_pages", "2"):
                    conds.append(pc == 2)
                elif b in ("3_pages", "3"):
                    conds.append(pc == 3)
                elif b in ("more_than_3_pages", ">3"):
                    conds.append(pc > 3)
            return any(conds) if conds else True

        def _time_of_day_ok(dt: datetime | None) -> bool:
            if not from_time and not to_time:
                return True
            if not dt:
                return False
            local = dt + timedelta(hours=timezone_offset)
            hhmm = local.hour * 60 + local.minute

            def _parse_hhmm(s: str) -> int:
                h, m = s.split(":")
                return int(h) * 60 + int(m)

            start = _parse_hhmm(from_time) if from_time else 0
            end = _parse_hhmm(to_time) if to_time else 24 * 60 - 1
            return start <= hhmm <= end

        for user in users:
            profile_id = user["profile_pid_all"]
            visit = visits_map.get(profile_id)
            delivr = delivr_data.get(profile_id, {})
            pv_list = page_visits_map.get(profile_id, [])

            if require_visit_in_range and not visit:
                continue

            # behavior_type filter — only when no status is provided
            if behavior_list and not status_list:
                if (
                    user.get("behavior_type") or ""
                ).lower() not in behavior_list:
                    continue

            # status/funnels — поддержка нескольких значений с логикой OR
            if status_list:
                bt = (user.get("behavior_type") or "").lower()
                is_conv = int(user.get("is_converted_sales", 0) or 0)
                # нормализуем алиасы
                norm_status = [
                    (
                        "viewed_product"
                        if s in ("view_product", "viewed_product")
                        else s
                    )
                    for s in status_list
                ]

                def _status_match(s: str) -> bool:
                    if s == "converted_sales":
                        return is_conv == 1
                    if s == "abandoned_cart":
                        return bt == "product_added_to_cart" and is_conv == 0
                    if s == "viewed_product":
                        return bt == "viewed_product" and is_conv == 0
                    if s == "visitor":
                        return bt == "visitor" and is_conv == 0
                    return False

                if not any(_status_match(s) for s in norm_status):
                    continue

            # recurring
            if recurring_list:
                is_ret = int(user.get("is_returning_visitor", 0) or 0)
                if "recurring" in recurring_list and is_ret != 1:
                    continue
                if (
                    any(
                        x in recurring_list
                        for x in ("first_time", "not_recurring")
                    )
                    and is_ret != 0
                ):
                    continue

            # regions filter (по delivr данным)
            if regions_list:
                region_pool = " ".join(
                    str(delivr.get(k, ""))
                    for k in (
                        "personal_city",
                        "personal_state",
                        "personal_country",
                        "company_city",
                        "company_state",
                        "company_zip",
                    )
                ).lower()
                if not any(r in region_pool for r in regions_list):
                    continue

            # page_url contains any tag
            if url_tags:
                last_page = (visit or {}).get("page", "")
                lp = str(last_page).lower()
                if not any(tag in lp for tag in url_tags):
                    continue

            # Aggregate totals from page visits in the window
            total_time = (
                sum(int(p.get("spent_time_sec") or 0) for p in pv_list)
                if pv_list
                else None
            )
            total_pages = (
                len(pv_list) if pv_list else (visit or {}).get("pages_count")
            )

            # time spent & page visits buckets
            if not _time_bucket_ok(total_time):
                continue
            if not _pages_bucket_ok(total_pages):
                continue

            # time of day by last visit_start
            if not _time_of_day_ok((visit or {}).get("visit_start")):
                continue

            # search query across delivr/user fields
            if q:
                searchable = " ".join(
                    str(x or "")
                    for x in (
                        delivr.get("first_name"),
                        delivr.get("last_name"),
                        delivr.get("current_business_email"),
                        delivr.get("company_name"),
                        delivr.get("company_domain"),
                        user.get("profile_pid_all"),
                    )
                ).lower()
                if q not in searchable:
                    continue

            lead = builder.build(
                user_data=user,
                visit_data=visit,
                delivr_data=delivr,
                page_visits=pv_list,
            )
            filtered.append(lead.to_dict())

        # Сортировка
        reverse = (sort_order or "").lower() == "desc"
        key_map = {
            "updated_at": lambda d: d.get("updated_at"),
            "created_at": lambda d: d.get("created_at"),
            "total_visit_time": lambda d: d.get("time_spent") or 0,
            "average_time_sec": lambda d: d.get("time_spent") or 0,
            "pages_count": lambda d: (d.get("pages_count") or 0),
        }
        if sort_by in key_map:
            try:
                filtered.sort(key=key_map[sort_by], reverse=reverse)
            except Exception:
                pass
        else:
            # default by updated_at desc
            try:
                filtered.sort(key=key_map["updated_at"], reverse=True)
            except Exception:
                pass

        # Определяем, есть ли продвинутые фильтры (которые применяются на Python-уровне)
        advanced_filters = any(
            [
                bool(regions_list),
                bool(url_tags),
                bool(time_spent_list),
                bool(page_visits_list),
                bool(q),
                bool(from_time),
                bool(to_time),
            ]
        )

        if not advanced_filters:
            # Можно получить точный count из ClickHouse по тем же WHERE
            total_count = await self._get_total_count(
                params, require_visit_in_range
            )
        else:
            # При наличии сложных фильтров считаем количество после пост-фильтрации
            total_count = len(filtered)

        start = max(0, (page - 1) * per_page)
        end = start + per_page
        # Avoid double pagination: when only SQL-side filters are used (not advanced_filters),
        # we already applied LIMIT/OFFSET in ClickHouse, so return the current page as-is.
        if not advanced_filters:
            page_items = filtered
        else:
            page_items = filtered[start:end]
        max_page = math.ceil(total_count / per_page) if per_page else 1
        return page_items, total_count, max_page

    def _prepare_params(
        self,
        pixel_id: UUID,
        page: int,
        per_page: int,
        from_date: int | float | datetime | None,
        to_date: int | float | datetime | None,
        timezone_offset: int,
    ) -> Dict[str, Any]:
        """Подготовка параметров запроса"""
        dt_from = self.formatter.to_dt(from_date)
        dt_to = self.formatter.to_dt(to_date)

        page = max(page, 1)
        offset = (page - 1) * per_page

        params = {
            "pixel_id": str(pixel_id),
            "limit": per_page,
            "offset": offset,
            "from_dt": dt_from,
            "to_dt": dt_to,
        }

        return params

    def _split_csv_lower(self, val: str | None) -> list[str]:
        if not val:
            return []
        return [x.strip().lower() for x in str(val).split(",") if x.strip()]

    def _build_sql_where(
        self, params: Dict[str, Any]
    ) -> tuple[str, Dict[str, Any]]:
        """Собрать WHERE для ClickHouse по базовым фильтрам, совместимым с SQL.
        Поддержка:
          - pixel_id
          - дата-диапазон по updated_at
          - behavior_type (из параметра behavior_type)
          - status: converted_sales, abandoned_cart, view_product/viewed_product, visitor
          - recurring_visits: recurring / first_time|not_recurring
        Возвращает (where_sql, sql_params)
        """
        clauses: list[str] = ["pixel_id = toUUID(%(pixel_id)s)"]
        sql_params: Dict[str, Any] = {"pixel_id": params["pixel_id"]}

        # Date window by updated_at
        if params.get("from_dt") is not None:
            clauses.append("updated_at >= %(from_dt)s")
            sql_params["from_dt"] = params["from_dt"]
        if params.get("to_dt") is not None:
            clauses.append("updated_at < %(to_dt)s")
            sql_params["to_dt"] = params["to_dt"]

        # Behavior types (comma list) — apply ONLY when no status (funnels) provided
        behavior_list = self._split_csv_lower(params.get("behavior_type"))
        status_present = bool(self._split_csv_lower(params.get("status")))
        if behavior_list and not status_present:
            # Only allow known values
            allowed = {"visitor", "viewed_product", "product_added_to_cart"}
            b_list = [b for b in behavior_list if b in allowed]
            if b_list:
                # ClickHouse supports passing an Array(String) for IN
                clauses.append("behavior_type IN %(behavior_arr)s")
                sql_params["behavior_arr"] = b_list

        # Status/funnels mapping
        status_list_raw = self._split_csv_lower(params.get("status"))
        # Normalize aliases
        status_list = [
            ("viewed_product" if s in ("view_product", "viewed_product") else s)
            for s in status_list_raw
        ]
        status_clauses: list[str] = []
        for s in status_list:
            if s == "converted_sales":
                status_clauses.append("(is_converted_sales = 1)")
            elif s == "abandoned_cart":
                status_clauses.append(
                    "(behavior_type = 'product_added_to_cart' AND is_converted_sales = 0)"
                )
            elif s == "viewed_product":
                status_clauses.append(
                    "(behavior_type = 'viewed_product' AND is_converted_sales = 0)"
                )
            elif s == "visitor":
                status_clauses.append(
                    "(behavior_type = 'visitor' AND is_converted_sales = 0)"
                )
        if status_clauses:
            clauses.append("(" + " OR ".join(status_clauses) + ")")

        # Recurring
        rec_list = self._split_csv_lower(params.get("recurring_visits"))
        if rec_list:
            if "recurring" in rec_list:
                clauses.append("is_returning_visitor = 1")
            elif any(x in rec_list for x in ("first_time", "not_recurring")):
                clauses.append("is_returning_visitor = 0")

        where_sql = " WHERE " + " AND ".join(clauses) if clauses else ""
        return where_sql, sql_params

    async def _load_users(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Loading users with pagination. SQL filters are applied (see _build_sql_where)."""
        where_sql, sql_params = self._build_sql_where(params)
        sql = f"""
            SELECT 
                profile_pid_all,
                company_id,
                behavior_type,
                created_at,
                updated_at,
                is_active,
                is_confirmed,
                is_checked,
                is_returning_visitor,
                is_converted_sales,
                total_visit,
                average_visit_time,
                total_visit_time
            FROM {self.leads_table}
            FINAL
            {where_sql}
            ORDER BY updated_at DESC
            LIMIT %(limit)s OFFSET %(offset)s
        """
        sql_params.update(
            {
                "limit": params.get("limit", 50),
                "offset": params.get("offset", 0),
            }
        )
        result = await self.click.query(sql, sql_params)
        return list(result.named_results())

    async def _get_total_count(
        self, params: Dict[str, Any], require_visit_in_range: bool
    ) -> int:
        """Получение общего количества записей.
        Если require_visit_in_range=True и задан from/to, считаем по пересечению с визитами в окне.
        Иначе считаем только по leads_users с теми же SQL-фильтрами.
        """
        from_dt = params.get("from_dt")
        to_dt = params.get("to_dt")
        if require_visit_in_range and (
            from_dt is not None or to_dt is not None
        ):
            # Build users WHERE without date (we'll filter by visits time window)
            params_no_date = dict(params)
            params_no_date["from_dt"] = None
            params_no_date["to_dt"] = None
            where_users_sql, users_params = self._build_sql_where(
                params_no_date
            )
            # Build visits time filter
            visit_clauses = ["pixel_id = toUUID(%(pixel_id)s)"]
            visit_params: Dict[str, Any] = {"pixel_id": params["pixel_id"]}
            if from_dt is not None:
                visit_clauses.append("visit_start >= %(from_dt)s")
                visit_params["from_dt"] = from_dt
            if to_dt is not None:
                visit_clauses.append("visit_start < %(to_dt)s")
                visit_params["to_dt"] = to_dt
            visits_where = " WHERE " + " AND ".join(visit_clauses)
            sql = f"""
                WITH v AS (
                    SELECT DISTINCT profile_pid_all
                    FROM {self.visits_table}
                    {visits_where}
                )
                SELECT countDistinct(u.profile_pid_all) AS cnt
                FROM {self.leads_table} u
                FINAL
                {where_users_sql}
                INNER JOIN v USING(profile_pid_all)
            """
            # merge params
            all_params = {**users_params, **visit_params}
            result = await self.click.query(sql, all_params)
            rows = list(result.named_results())
            return int(rows[0].get("cnt", 0)) if rows else 0
        else:
            where_sql, sql_params = self._build_sql_where(params)
            sql = f"""
                SELECT count() AS cnt 
                FROM {self.leads_table} 
                {where_sql}
            """
            result = await self.click.query(sql, sql_params)
            rows = list(result.named_results())
            if not rows:
                return 0
            return int(rows[0].get("cnt", 0))

    async def _load_last_visits(
        self, pixel_id: UUID, profile_ids: List[str], params: Dict[str, Any]
    ) -> Dict[str, Dict[str, Any]]:
        """Загрузка последних визитов"""
        if not profile_ids:
            return {}

        time_filter = self._build_time_filter(params)

        sql = f"""
            SELECT lv.*
            FROM {self.visits_table} lv
            FINAL
            INNER JOIN (
                SELECT profile_pid_all, max(visit_start) AS last_visit_start
                FROM {self.visits_table}
                WHERE pixel_id = toUUID(%(pixel_id)s) AND profile_pid_all IN %(profile_list)s
                {time_filter}
                GROUP BY profile_pid_all
            ) lvmax USING(profile_pid_all)
            WHERE lv.visit_start = lvmax.last_visit_start
        """

        query_params = {
            "pixel_id": str(pixel_id),
            "profile_list": profile_ids,
            "from_dt": params.get("from_dt"),
            "to_dt": params.get("to_dt"),
        }

        result = await self.click.query(sql, query_params)
        visits = list(result.named_results())

        return {v["profile_pid_all"]: v for v in visits}

    async def _load_page_visits(
        self, pixel_id: UUID, profile_ids: List[str], params: Dict[str, Any]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Загрузка посещений страниц"""
        if not profile_ids:
            return {}

        time_filter = self._build_time_filter(params)

        sql = f"""
            SELECT profile_pid_all, page, spent_time_sec
            FROM {self.visits_table}
            FINAL
            WHERE pixel_id = toUUID(%(pixel_id)s) AND profile_pid_all IN %(profile_list)s 
            {time_filter}
        """

        query_params = {
            "pixel_id": str(pixel_id),
            "profile_list": profile_ids,
            "from_dt": params.get("from_dt"),
            "to_dt": params.get("to_dt"),
        }

        result = await self.click.query(sql, query_params)
        rows = list(result.named_results())

        page_visits_map = {}
        for row in rows:
            pid = row["profile_pid_all"]
            page_visits_map.setdefault(pid, []).append(
                {
                    "page": row.get("page"),
                    "spent_time_sec": row.get("spent_time_sec"),
                }
            )

        return page_visits_map

    async def _load_delivr_data(
        self, profile_ids: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """Загрузка данных из delivr"""
        if not profile_ids:
            return {}

        columns = [
            "profile_pid_all",
            "first_name",
            "last_name",
            "current_business_email",
            "business_emails",
            "personal_emails",
            "mobile_phones",
            "personal_phones",
            "direct_numbers",
            "linkedin_url",
            "personal_address",
            "personal_address_2",
            "personal_city",
            "personal_state",
            "personal_zip",
            "company_name",
            "company_domain",
            "company_phones",
            "company_sic",
            "company_address",
            "company_city",
            "company_state",
            "company_linkedin_url",
            "company_total_revenue",
            "company_employee_count",
            "net_worth",
            "job_title",
            "last_updated",
            "primary_contact_emails",
            "age_range",
            "is_married",
            "has_children",
            "income_range_lc",
            "is_homeowner",
            "seniority_level",
            "department",
            "company_address",
            "company_address2",
            "company_city",
            "company_state",
            "company_industry",
            "current_business_email_validation_status",
            "current_business_email_validation_date",
            "job_title_history",
            "education_history",
            "company_description",
            "company_related_domains",
            "social_connections",
            "company_zip_code",
            "company_phones",
        ]

        sql = f"""
            SELECT {", ".join(columns)} 
            FROM {self.delivr_table} 
            WHERE profile_pid_all IN %(profile_list)s
        """

        result = await self.click.query(sql, {"profile_list": profile_ids})
        rows = list(result.named_results())

        delivr_data = {}
        for row in rows:
            pid = row["profile_pid_all"]
            delivr_data[pid] = self.delivr_processor.process(row)

        return delivr_data

    def _build_time_filter(self, params: Dict[str, Any]) -> str:
        """Построение фильтра по времени"""
        filters = []
        if params.get("from_dt"):
            filters.append("visit_start >= %(from_dt)s")
        if params.get("to_dt"):
            filters.append("visit_start < %(to_dt)s")

        return " AND " + " AND ".join(filters) if filters else ""

    async def get_visited_date(self, lead_visit_id: UUID) -> datetime | None:
        sql = f"""
            SELECT visit_start
            FROM {self.visits_table}
            WHERE visit_id = %(lead_visit_id)s
            LIMIT 1
        """

        result = await self.click.query(
            sql, {"lead_visit_id": str(lead_visit_id)}
        )

        if not result.result_rows:
            return None

        return result.result_rows[0][0]
