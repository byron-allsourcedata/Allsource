import asyncio
from datetime import datetime, timezone, timedelta
from collections import defaultdict

import pytz
from sqlalchemy.sql import (
    func,
    select,
    union_all,
    literal_column,
    extract,
    case,
    literal,
)
from sqlalchemy.orm import aliased

from config import ClickhouseConfig
from db_dependencies import Db, AsyncClickHouse, AsyncDb
from enums import AudienceSmartStatuses, UserStatusInAdmin, DataSyncType
from models import Users
from models.audience_lookalikes import AudienceLookalikes
from models.audience_smarts import AudienceSmart
from models.audience_smarts_data_sources import AudienceSmartsDataSources
from sqlalchemy import and_, or_, String
from collections import OrderedDict
from models.audience_sources import AudienceSource
from models.users_domains import UserDomains
from models.audience_smarts_use_cases import AudienceSmartsUseCase
from models.leads_visits import LeadsVisits
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from models.leads_users import LeadUser
from typing import Optional, List, Dict

from resolver import injectable


@injectable
class DashboardAudiencePersistence:
    def __init__(self, db: Db, clickhouse: AsyncClickHouse, async_db: AsyncDb):
        self.db = db
        self.clickhouse = clickhouse
        self.async_db = async_db
        self.clickhouse_config = ClickhouseConfig()

    def get_sources_overview(
        self, user_id
    ) -> tuple[list[tuple[AudienceSource, str]], int]:
        source_rows = (
            self.db.query(AudienceSource, Users.full_name)
            .join(Users, Users.id == AudienceSource.created_by_user_id)
            .filter(AudienceSource.user_id == user_id)
            .order_by(AudienceSource.created_at.desc())
            .all()
        )
        installed_domains_count = (
            self.db.query(UserDomains)
            .filter(
                UserDomains.user_id == user_id,
                UserDomains.is_pixel_installed == True,
            )
            .count()
        )
        return source_rows, installed_domains_count

    def calculate_user_status(self):
        subquery_user_domains = (
            self.db.query(UserDomains.id)
            .filter(UserDomains.user_id == Users.id)
            .correlate(Users)
        )

        subquery_pixel_installed = (
            self.db.query(UserDomains.id)
            .filter(
                UserDomains.user_id == Users.id,
                UserDomains.is_pixel_installed == True,
            )
            .correlate(Users)
        )

        subquery_lead_user = (
            self.db.query(LeadUser.id)
            .join(UserDomains, LeadUser.domain_id == UserDomains.id)
            .filter(UserDomains.user_id == Users.id)
            .correlate(Users)
        )

        subquery_integration_user_sync = (
            self.db.query(IntegrationUserSync.id)
            .join(UserDomains, IntegrationUserSync.domain_id == UserDomains.id)
            .filter(UserDomains.user_id == Users.id)
            .correlate(Users)
        )

        return case(
            (
                Users.is_email_confirmed == False,
                UserStatusInAdmin.NEED_CONFIRM_EMAIL.value,
            ),
            (
                or_(
                    ~subquery_user_domains.exists(),
                    ~subquery_pixel_installed.exists(),
                ),
                UserStatusInAdmin.PIXEL_NOT_INSTALLED.value,
            ),
            (
                and_(
                    subquery_pixel_installed.filter(
                        func.timezone("UTC", func.now())
                        - UserDomains.pixel_installation_date
                        <= timedelta(hours=24)
                    ).exists(),
                    ~subquery_lead_user.exists(),
                ),
                UserStatusInAdmin.WAITING_CONTACTS.value,
            ),
            (
                and_(
                    subquery_pixel_installed.filter(
                        func.timezone("UTC", func.now())
                        - UserDomains.pixel_installation_date
                        > timedelta(hours=24)
                    ).exists(),
                    ~subquery_lead_user.exists(),
                ),
                UserStatusInAdmin.RESOLUTION_FAILED.value,
            ),
            (
                and_(
                    subquery_lead_user.exists(),
                    ~subquery_integration_user_sync.exists(),
                ),
                UserStatusInAdmin.SYNC_NOT_COMPLETED.value,
            ),
            (
                and_(
                    subquery_lead_user.exists(),
                    subquery_integration_user_sync.filter(
                        IntegrationUserSync.sync_status == False
                    ).exists(),
                ),
                UserStatusInAdmin.SYNC_ERROR.value,
            ),
            (
                subquery_integration_user_sync.filter(
                    IntegrationUserSync.sync_status == True
                ).exists(),
                UserStatusInAdmin.DATA_SYNCING.value,
            ),
        )

    def get_audience_metrics(
        self,
        last_login_date_start: int,
        last_login_date_end: int,
        join_date_start: int,
        join_date_end: int,
        search_query: str,
        statuses: str,
        exclude_test_users: bool,
    ):
        user_filters = [Users.role.contains(["customer"])]

        status_case = self.calculate_user_status()

        subq_domain_resolved = (
            self.db.query(UserDomains.user_id)
            .filter(
                UserDomains.user_id == Users.id,
                UserDomains.is_another_domain_resolved.is_(True),
            )
            .correlate(Users)
            .exists()
        )

        if statuses:
            formatted_statuses = [
                status.strip().lower() for status in statuses.split(",")
            ]

            filter_conditions = []

            if "multiple_domains" in formatted_statuses:
                filter_conditions.append(
                    case((subq_domain_resolved, True), else_=False).is_(True)
                )
                formatted_statuses.remove("multiple_domains")

            if formatted_statuses:
                filter_conditions.append(
                    func.lower(status_case).in_(formatted_statuses)
                )

            if filter_conditions:
                user_filters.append(or_(*filter_conditions))

        if exclude_test_users:
            user_filters.append(~Users.full_name.like("#test%"))

        if last_login_date_start:
            start_date = datetime.fromtimestamp(
                last_login_date_start, tz=pytz.UTC
            ).date()
            user_filters.append(func.DATE(Users.last_login) >= start_date)

        if last_login_date_end:
            end_date = datetime.fromtimestamp(
                last_login_date_end, tz=pytz.UTC
            ).date()
            user_filters.append(func.DATE(Users.last_login) <= end_date)

        if join_date_start:
            start_date = datetime.fromtimestamp(
                join_date_start, tz=pytz.UTC
            ).date()
            user_filters.append(func.DATE(Users.created_at) >= start_date)

        if join_date_end:
            end_date = datetime.fromtimestamp(join_date_end, tz=pytz.UTC).date()
            user_filters.append(func.DATE(Users.created_at) <= end_date)

        if search_query:
            user_filters.append(
                or_(
                    Users.email.ilike(f"%{search_query}%"),
                    Users.full_name.ilike(f"%{search_query}%"),
                )
            )

        queries = [
            {
                "query": self.db.query(
                    func.count(Users.id).label("count")
                ).filter(*user_filters),
                "key": "users_count",
            },
            {
                "query": self.db.query(
                    func.count(UserDomains.id).label("count")
                )
                .join(Users, Users.id == UserDomains.user_id)
                .filter(UserDomains.is_pixel_installed == True, *user_filters),
                "key": "pixel_contacts",
            },
            {
                "query": self.db.query(
                    func.count(AudienceSource.id).label("count")
                )
                .join(Users, Users.id == AudienceSource.user_id)
                .filter(*user_filters),
                "key": "sources_count",
            },
            {
                "query": self.db.query(
                    func.count(AudienceLookalikes.id).label("count")
                )
                .join(Users, Users.id == AudienceLookalikes.user_id)
                .filter(*user_filters),
                "key": "lookalike_count",
            },
            {
                "query": self.db.query(
                    func.count(AudienceSmart.id).label("count")
                )
                .join(Users, Users.id == AudienceSmart.user_id)
                .filter(*user_filters),
                "key": "smart_count",
            },
            {
                "query": self.db.query(
                    func.count(IntegrationUserSync.id).label("count")
                )
                .join(
                    UserDomains, UserDomains.id == IntegrationUserSync.domain_id
                )
                .join(Users, Users.id == UserDomains.user_id)
                .filter(*user_filters),
                "key": "sync_count",
            },
            {
                "query": self.db.query(
                    func.sum(Users.overage_leads_count).label("count")
                ).filter(*user_filters),
                "key": "overage_sum",
            },
        ]

        return queries

    def to_pg_naive_utc(self, dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt
        return dt.astimezone(timezone.utc).replace(tzinfo=None)

    async def _get_user_pixel_ids(self, user_id: int) -> list[str]:
        stmt = select(UserDomains.pixel_id).where(
            UserDomains.user_id == user_id,
            UserDomains.is_pixel_installed.is_(True),
            UserDomains.pixel_id.isnot(None),
        )

        result = await self.async_db.execute(stmt)
        pixel_ids = result.scalars().all()
        return [str(pid) for pid in pixel_ids if pid]

    async def _get_pixel_contacts_count_ch(
        self, pixel_ids: list[str], from_dt: datetime, to_dt: datetime
    ) -> int:
        if not pixel_ids:
            return 0

        sql = f"""
            SELECT count()
            FROM {ClickhouseConfig.database}.leads_users
            WHERE toString(pixel_id) IN %(pids)s
              AND updated_at BETWEEN %(from)s AND %(to)s
        """

        try:
            res = await self.clickhouse.query(
                sql, {"pids": pixel_ids, "from": from_dt, "to": to_dt}
            )

            if not res.first_row:
                return 0
            return int(res.first_row[0] or 0)

        except Exception:
            return 0

    async def _audience_sources_count(
        self, user_id: int, from_dt, to_dt
    ) -> int:
        from_dt = self.to_pg_naive_utc(from_dt)
        to_dt = self.to_pg_naive_utc(to_dt)

        stmt = select(func.count(AudienceSource.id)).where(
            AudienceSource.user_id == user_id,
            AudienceSource.created_at.between(from_dt, to_dt),
        )

        res = await self.async_db.execute(stmt)
        return int(res.scalar_one() or 0)

    async def _audience_lookalikes_count(self, user_id, from_dt, to_dt):
        from_dt = self.to_pg_naive_utc(from_dt)
        to_dt = self.to_pg_naive_utc(to_dt)

        stmt = select(func.count(AudienceLookalikes.id)).where(
            AudienceLookalikes.user_id == user_id,
            AudienceLookalikes.created_date.between(from_dt, to_dt),
        )
        res = await self.async_db.execute(stmt)
        return int(res.scalar_one() or 0)

    async def _audience_smart_count(self, user_id, from_dt, to_dt):
        from_dt = self.to_pg_naive_utc(from_dt)
        to_dt = self.to_pg_naive_utc(to_dt)

        stmt = select(func.count(AudienceSmart.id)).where(
            AudienceSmart.user_id == user_id,
            AudienceSmart.created_at.between(from_dt, to_dt),
        )
        res = await self.async_db.execute(stmt)
        return int(res.scalar_one() or 0)

    async def _audience_sync_count(self, user_id, from_dt, to_dt):
        from_dt = self.to_pg_naive_utc(from_dt)
        to_dt = self.to_pg_naive_utc(to_dt)

        stmt = (
            select(func.count(IntegrationUserSync.id))
            .join(
                UserIntegration,
                UserIntegration.id == IntegrationUserSync.integration_id,
            )
            .where(
                UserIntegration.user_id == user_id,
                IntegrationUserSync.sync_type == DataSyncType.AUDIENCE.value,
                IntegrationUserSync.created_at.between(from_dt, to_dt),
            )
        )
        res = await self.async_db.execute(stmt)
        return int(res.scalar_one() or 0)

    async def get_dashboard_audience_data(
        self, *, from_date: int, to_date: int, user_id: int
    ):
        from_dt = datetime.fromtimestamp(from_date, tz=timezone.utc)
        to_dt = datetime.fromtimestamp(to_date, tz=timezone.utc)

        pixel_ids = await self._get_user_pixel_ids(user_id)

        pixel_contacts_task = self._get_pixel_contacts_count_ch(
            pixel_ids, from_dt, to_dt
        )

        sources_count = await self._audience_sources_count(
            user_id, from_dt, to_dt
        )
        lookalike_count = await self._audience_lookalikes_count(
            user_id, from_dt, to_dt
        )
        smart_count = await self._audience_smart_count(user_id, from_dt, to_dt)
        sync_count = await self._audience_sync_count(user_id, from_dt, to_dt)

        pixel_contacts = await pixel_contacts_task

        return {
            "pixel_contacts": pixel_contacts,
            "sources_count": sources_count,
            "lookalike_count": lookalike_count,
            "smart_count": smart_count,
            "sync_count": sync_count,
        }

    def get_user_domains(self, user_id: int) -> list[str]:
        return [
            row[0]
            for row in self.db.query(UserDomains.domain)
            .filter(
                UserDomains.user_id == user_id,
                UserDomains.is_pixel_installed == True,
            )
            .all()
        ]

    async def get_contacts_for_pixel_contacts_statistics(self, user_id: int):
        """
        ClickHouse-based contacts statistics for the last 24 hours per domain.
        Returns list of tuples: (domain, behavior_type, count_converted_sales, lead_count)

        Logic:
        - For the given user, fetch all installed domains with non-null pixel_id from PostgreSQL.
        - In ClickHouse, aggregate leads from allsource_prod.leads_users filtered by these pixel_ids
          and time window (updated_at >= now-24h). Group by pixel_id and behavior_type and compute:
            * count_converted_sales = sum(is_converted_sales)
            * lead_count = count()
        - Map pixel_id back to domain name and return rows.

        Note: We use updated_at as the recency indicator for leads_users.
        """

        twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)

        # 1) Resolve user's domains and their pixel_ids from PostgreSQL
        domain_rows = (
            self.db.query(UserDomains.domain, UserDomains.pixel_id)
            .filter(
                and_(
                    UserDomains.user_id == user_id,
                    UserDomains.is_pixel_installed.is_(True),
                    UserDomains.pixel_id.isnot(None),
                )
            )
            .all()
        )
        if not domain_rows:
            return []

        pixel_to_domain: dict[str, str] = {}
        pixel_ids: list[str] = []
        for domain, pid in domain_rows:
            if pid is None:
                continue
            try:
                pid_str = str(pid)
            except Exception:
                continue
            pixel_to_domain[pid_str] = domain
            pixel_ids.append(pid_str)

        if not pixel_ids:
            return []

        # 2) Query ClickHouse for aggregated stats
        sql = f"""
            SELECT
                toString(pixel_id) AS pixel_id,
                coalesce(behavior_type, '') AS behavior_type,
                sum(toUInt64(is_converted_sales)) AS count_converted_sales,
                count() AS lead_count
            FROM {self.clickhouse_config.database}.leads_users
            WHERE toString(pixel_id) IN %(pids)s
              AND updated_at >= %(since)s
            GROUP BY pixel_id, behavior_type
        """
        try:
            res = await self.clickhouse.query(
                sql, {"pids": pixel_ids, "since": twenty_four_hours_ago}
            )
        except Exception:
            return []

        # clickhouse_connect returns QueryResult; support both dict rows and tuples
        rows = []
        if hasattr(res, "named_results"):
            rows = list(res.named_results())
        elif isinstance(res, list):
            rows = res

        out: list[tuple[str, str, int, int]] = []
        for r in rows:
            if isinstance(r, dict):
                pid = r.get("pixel_id")
                behavior = r.get("behavior_type") or ""
                conv = int(r.get("count_converted_sales") or 0)
                cnt = int(r.get("lead_count") or 0)
            else:
                pid, behavior, conv, cnt = r
                behavior = behavior or ""
                conv = int(conv or 0)
                cnt = int(cnt or 0)
            domain = pixel_to_domain.get(str(pid))
            if not domain:
                continue
            out.append((domain, behavior, conv, cnt))

        return out

    def get_last_sources_and_lookalikes(
        self, *, user_id: int, limit=5, smart_audiences: List[AudienceSmart]
    ):
        all_lookalike_ids = [
            lid
            for audience in smart_audiences
            for lid in (audience.inc_lookalike_ids or [])
        ]
        unique_lookalike_ids = set(all_lookalike_ids)
        priority_order = case(
            (AudienceLookalikes.id.in_(unique_lookalike_ids), 0), else_=1
        )

        lookalikes = (
            self.db.query(
                AudienceLookalikes.id.label("id"),
                AudienceSource.id.label("source_id"),
                AudienceSource.name.label("source_name"),
                AudienceSource.source_type.label("source_type"),
                AudienceSource.matched_records.label("matched_records"),
                AudienceLookalikes.name.label("lookalike_name"),
                AudienceLookalikes.created_date.label("created_at"),
                AudienceLookalikes.lookalike_size.label("lookalike_size"),
                AudienceLookalikes.size.label("size"),
                AudienceSource.target_schema.label("target_type"),
            )
            .join(
                AudienceSource,
                AudienceSource.id == AudienceLookalikes.source_uuid,
            )
            .filter(AudienceLookalikes.user_id == user_id)
            .order_by(priority_order, AudienceLookalikes.created_date.desc())
            .limit(limit)
            .all()
        )

        all_source_ids = [
            lid
            for audience in smart_audiences
            for lid in (audience.inc_source_ids or [])
        ]
        unique_source_ids = set(all_source_ids)
        priority_audience_source_order = case(
            (AudienceSource.id.in_(unique_source_ids), 0), else_=1
        )

        sources = (
            self.db.query(
                AudienceSource.id.label("id"),
                AudienceSource.name.label("source_name"),
                AudienceSource.created_at.label("created_at"),
                AudienceSource.source_type.label("source_type"),
                AudienceSource.matched_records.label("matched_records"),
                AudienceSource.target_schema.label("target_type"),
                AudienceSource.total_records.label("no_of_customers"),
                UserDomains.domain.label("domain"),
            )
            .join(
                UserDomains,
                AudienceSource.domain_id == UserDomains.id,
                isouter=True,
            )
            .filter(AudienceSource.user_id == user_id)
            .order_by(
                priority_audience_source_order, AudienceSource.created_at.desc()
            )
            .limit(limit)
            .all()
        )

        return sources, lookalikes

    def get_chains_data_syncs(self, *, ids, type):
        DataSourcesFromSource = aliased(
            AudienceSmartsDataSources, name="datasource_from_source"
        )
        DataSourcesFromLookalike = aliased(
            AudienceSmartsDataSources, name="datasource_from_lookalike"
        )

        if type == "sources":
            stmt = (
                select(
                    AudienceSource,
                    AudienceLookalikes,
                    AudienceSmart,
                    IntegrationUserSync,
                )
                .select_from(AudienceSource)
                .outerjoin(
                    AudienceLookalikes,
                    AudienceLookalikes.source_uuid == AudienceSource.id,
                )
                .outerjoin(
                    DataSourcesFromSource,
                    DataSourcesFromSource.source_id == AudienceSource.id,
                )
                .outerjoin(
                    DataSourcesFromLookalike,
                    DataSourcesFromLookalike.lookalike_id
                    == AudienceLookalikes.id,
                )
                .outerjoin(
                    AudienceSmart,
                    or_(
                        AudienceSmart.id
                        == DataSourcesFromSource.smart_audience_id,
                        AudienceSmart.id
                        == DataSourcesFromLookalike.smart_audience_id,
                    ),
                )
                .outerjoin(
                    IntegrationUserSync,
                    IntegrationUserSync.smart_audience_id == AudienceSmart.id,
                )
                .where(AudienceSource.id.in_(ids))
            )
        elif type == "lookalikes":
            stmt = (
                select(
                    AudienceSource,
                    AudienceLookalikes,
                    AudienceSmart,
                    IntegrationUserSync,
                )
                .select_from(AudienceLookalikes)
                .join(
                    AudienceSource,
                    AudienceSource.id == AudienceLookalikes.source_uuid,
                )
                .outerjoin(
                    AudienceSmartsDataSources,
                    AudienceSmartsDataSources.lookalike_id
                    == AudienceLookalikes.id,
                )
                .outerjoin(
                    AudienceSmart,
                    AudienceSmart.id
                    == AudienceSmartsDataSources.smart_audience_id,
                )
                .outerjoin(
                    IntegrationUserSync,
                    IntegrationUserSync.smart_audience_id == AudienceSmart.id,
                )
                .where(AudienceLookalikes.id.in_(ids))
            )
        elif type == "smart_audiences":
            stmt = (
                select(
                    AudienceSource,
                    AudienceLookalikes,
                    AudienceSmart,
                    IntegrationUserSync,
                )
                .select_from(AudienceSmart)
                .join(
                    DataSourcesFromSource,
                    DataSourcesFromSource.smart_audience_id == AudienceSmart.id,
                )
                .outerjoin(
                    AudienceSource,
                    AudienceSource.id == DataSourcesFromSource.source_id,
                )
                .outerjoin(
                    AudienceLookalikes,
                    AudienceLookalikes.id == DataSourcesFromSource.lookalike_id,
                )
                .outerjoin(
                    IntegrationUserSync,
                    IntegrationUserSync.smart_audience_id == AudienceSmart.id,
                )
                .where(AudienceSmart.id.in_(ids))
            )
        elif type == "data_sync":
            stmt = (
                select(
                    AudienceSource,
                    AudienceLookalikes,
                    AudienceSmart,
                    IntegrationUserSync,
                )
                .select_from(IntegrationUserSync)
                .join(
                    AudienceSmart,
                    IntegrationUserSync.smart_audience_id == AudienceSmart.id,
                )
                .join(
                    DataSourcesFromSource,
                    DataSourcesFromSource.smart_audience_id == AudienceSmart.id,
                )
                .outerjoin(
                    AudienceSource,
                    AudienceSource.id == DataSourcesFromSource.source_id,
                )
                .outerjoin(
                    AudienceLookalikes,
                    AudienceLookalikes.id == DataSourcesFromSource.lookalike_id,
                )
                .where(IntegrationUserSync.id.in_(ids))
            )
        return self.db.execute(stmt).fetchall()

    def get_last_lookalike_smart_audiences(
        self, user_id: int, limit: int, smart_audiences: List[AudienceSmart]
    ):
        smart_audience_ids = [data_sync.id for data_sync in smart_audiences]
        priority_order = case(
            (AudienceSmart.id.in_(smart_audience_ids), 0), else_=1
        )
        lookalike_smart_audiences = (
            self.db.query(
                AudienceSmart.id.label("id"),
                AudienceSmart.created_at.label("created_at"),
                AudienceSmart.name.label("audience_name"),
                AudienceSmartsUseCase.name.label("use_case"),
                AudienceSmart.active_segment_records.label("active_segment"),
                AudienceLookalikes.name.label("lookalike_name"),
                AudienceLookalikes.lookalike_size.label("lookalike_size"),
                AudienceLookalikes.size.label("size"),
            )
            .join(
                AudienceSmartsUseCase,
                AudienceSmartsUseCase.id == AudienceSmart.use_case_id,
            )
            .join(
                AudienceSmartsDataSources,
                AudienceSmartsDataSources.smart_audience_id == AudienceSmart.id,
            )
            .join(
                AudienceLookalikes,
                AudienceSmartsDataSources.lookalike_id == AudienceLookalikes.id,
            )
            .filter(AudienceSmart.user_id == user_id)
            .order_by(priority_order, AudienceSmart.created_at.desc())
            .limit(limit)
            .all()
        )
        return lookalike_smart_audiences

    def get_last_smart_audiences_and_data_syncs(self, *, user_id: int, limit=5):
        data_syncs = (
            self.db.query(
                IntegrationUserSync.id.label("id"),
                AudienceSmart.id.label("smart_audience_id"),
                AudienceSmart.name.label("audience_name"),
                AudienceSmart.status.label("status"),
                IntegrationUserSync.created_at.label("created_at"),
                IntegrationUserSync.sent_contacts.label("synced_contacts"),
                UserIntegration.service_name.label("destination"),
            )
            .join(
                UserIntegration,
                UserIntegration.id == IntegrationUserSync.integration_id,
            )
            .join(
                AudienceSmart,
                AudienceSmart.id == IntegrationUserSync.smart_audience_id,
            )
            .join(
                AudienceSmartsUseCase,
                AudienceSmartsUseCase.id == AudienceSmart.use_case_id,
            )
            .filter(UserIntegration.user_id == user_id)
            .order_by(IntegrationUserSync.created_at.desc())
            .limit(limit)
            .all()
        )

        sync_ids = [data_sync.smart_audience_id for data_sync in data_syncs]

        include_agg = (
            self.db.query(
                AudienceSmartsDataSources.smart_audience_id.label(
                    "smart_audience_id"
                ),
                func.array_agg(AudienceSource.id).label("inc_source_ids"),
                func.array_agg(AudienceSource.name).label("inc_source_names"),
                func.array_agg(AudienceLookalikes.id).label(
                    "inc_lookalike_ids"
                ),
                func.array_agg(AudienceLookalikes.name).label(
                    "inc_lookalike_names"
                ),
            )
            .outerjoin(
                AudienceSource,
                AudienceSmartsDataSources.source_id == AudienceSource.id,
            )
            .outerjoin(
                AudienceLookalikes,
                AudienceSmartsDataSources.lookalike_id == AudienceLookalikes.id,
            )
            .filter(AudienceSmartsDataSources.data_type == "include")
            .group_by(AudienceSmartsDataSources.smart_audience_id)
            .subquery()
        )

        exclude_agg = (
            self.db.query(
                AudienceSmartsDataSources.smart_audience_id.label(
                    "smart_audience_id"
                ),
                func.array_agg(AudienceSource.id).label("exc_source_ids"),
                func.array_agg(AudienceSource.name).label("exc_source_names"),
                func.array_agg(AudienceLookalikes.id).label(
                    "exc_lookalike_ids"
                ),
                func.array_agg(AudienceLookalikes.name).label(
                    "exc_lookalike_names"
                ),
            )
            .outerjoin(
                AudienceSource,
                AudienceSmartsDataSources.source_id == AudienceSource.id,
            )
            .outerjoin(
                AudienceLookalikes,
                AudienceSmartsDataSources.lookalike_id == AudienceLookalikes.id,
            )
            .filter(AudienceSmartsDataSources.data_type == "exclude")
            .group_by(AudienceSmartsDataSources.smart_audience_id)
            .subquery()
        )

        priority_order = case((AudienceSmart.id.in_(sync_ids), 0), else_=1)

        audience_smart_results = (
            self.db.query(
                AudienceSmart.id.label("id"),
                AudienceSmart.created_at,
                AudienceSmart.name.label("audience_name"),
                AudienceSmartsUseCase.name.label("use_case"),
                AudienceSmart.active_segment_records.label("active_segment"),
                include_agg.c.inc_source_ids,
                include_agg.c.inc_source_names,
                include_agg.c.inc_lookalike_ids,
                include_agg.c.inc_lookalike_names,
                exclude_agg.c.exc_source_ids,
                exclude_agg.c.exc_source_names,
                exclude_agg.c.exc_lookalike_ids,
                exclude_agg.c.exc_lookalike_names,
            )
            .join(
                AudienceSmartsUseCase,
                AudienceSmartsUseCase.id == AudienceSmart.use_case_id,
            )
            .outerjoin(
                include_agg, include_agg.c.smart_audience_id == AudienceSmart.id
            )
            .outerjoin(
                exclude_agg, exclude_agg.c.smart_audience_id == AudienceSmart.id
            )
            .filter(AudienceSmart.user_id == user_id)
            .order_by(priority_order, AudienceSmart.created_at.desc())
            .limit(limit)
            .all()
        )
        return audience_smart_results, data_syncs

    def get_contacts_for_pixel_contacts_by_domain_id(
        self,
        *,
        user_id: int,
        domain_id: int,
        from_date: Optional[int] = None,
        to_date: Optional[int] = None,
    ):
        one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)

        query = (
            self.db.query(
                func.date(LeadsVisits.start_date).label("date"),
                LeadUser.behavior_type,
                func.sum(
                    case((LeadUser.is_converted_sales == True, 1), else_=0)
                ).label("count_converted_sales"),
                func.count(LeadUser.id).label("count"),
            )
            .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)
            .filter(
                LeadUser.user_id == user_id,
                LeadsVisits.start_date >= one_year_ago,
                LeadUser.domain_id == domain_id,
            )
        )

        if from_date is not None and to_date is not None:
            from_dt = datetime.fromtimestamp(from_date, tz=timezone.utc)
            to_dt = datetime.fromtimestamp(to_date, tz=timezone.utc)
            query = query.filter(LeadsVisits.start_date.between(from_dt, to_dt))

        results = (
            query.group_by(
                func.date(LeadsVisits.start_date), LeadUser.behavior_type
            )
            .order_by(func.date(LeadsVisits.start_date))
            .all()
        )

        return results
