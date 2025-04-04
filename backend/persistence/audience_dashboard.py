from datetime import datetime, timezone, timedelta
from collections import defaultdict
from sqlalchemy.sql import func, select, union_all, literal_column, extract, case
from sqlalchemy.orm import aliased

from models.audience_lookalikes import AudienceLookalikes
from models.audience_smarts import AudienceSmart
from models.audience_sources import AudienceSource
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from models.leads_users import LeadUser



class DashboardAudiencePersistence:
    def __init__(self, db_session):
        self.db = db_session

    def get_dashboard_audience_data(self, from_date: int, to_date: int, user_id: int):
        from_dt = datetime.fromtimestamp(from_date, tz=timezone.utc)
        to_dt = datetime.fromtimestamp(to_date, tz=timezone.utc)

        daily_data = {}

        queries = [
            {
                'query': self.db.query(
                    func.date(LeadUser.created_at).label("date"),
                    func.count(LeadUser.id).label("count")
                )
                    .filter(
                    LeadUser.user_id == user_id,
                    LeadUser.created_at >= from_dt,
                    LeadUser.created_at <= to_dt
                )
                    .group_by(func.date(LeadUser.created_at)),
                'key': 'pixel_contacts'
            },
            {
                'query': self.db.query(
                    func.date(AudienceSource.created_at).label("date"),
                    func.count(AudienceSource.id).label("count")
                )
                    .filter(
                    AudienceSource.user_id == user_id,
                    AudienceSource.created_at >= from_dt,
                    AudienceSource.created_at <= to_dt
                )
                    .group_by(func.date(AudienceSource.created_at)),
                'key': 'sources_count'
            },
            {
                'query': self.db.query(
                    func.date(AudienceLookalikes.created_date).label("date"),
                    func.count(AudienceLookalikes.id).label("count")
                )
                    .filter(
                    AudienceLookalikes.user_id == user_id,
                    AudienceLookalikes.created_date >= from_dt,
                    AudienceLookalikes.created_date <= to_dt
                )
                    .group_by(func.date(AudienceLookalikes.created_date)),
                'key': 'lookalike_count'
            },
            {
                'query': self.db.query(
                    func.date(AudienceSmart.created_at).label("date"),
                    func.count(AudienceSmart.id).label("count")
                )
                    .filter(
                    AudienceSmart.user_id == user_id,
                    AudienceSmart.created_at >= from_dt,
                    AudienceSmart.created_at <= to_dt
                )
                    .group_by(func.date(AudienceSmart.created_at)),
                'key': 'smart_count'
            },
            {
                'query': self.db.query(
                    func.date(IntegrationUserSync.created_at).label("date"),
                    func.count(IntegrationUserSync.id).label("count")
                )
                    .join(UserIntegration, UserIntegration.id == IntegrationUserSync.integration_id)
                    .filter(
                    UserIntegration.user_id == user_id,
                    IntegrationUserSync.created_at >= from_dt,
                    IntegrationUserSync.created_at <= to_dt
                )
                    .group_by(func.date(IntegrationUserSync.created_at)),
                'key': 'sync_count'
            }
        ]

        for q in queries:
            for date, count in q['query']:
                date_str = date.isoformat()
                if date_str not in daily_data:
                    daily_data[date_str] = {
                        'pixel_contacts': 0,
                        'sources_count': 0,
                        'lookalike_count': 0,
                        'smart_count': 0,
                        'sync_count': 0
                    }
                daily_data[date_str][q['key']] = count

        # Сортировка по дате
        sorted_dates = sorted(daily_data.keys())

        # Накопление значений
        cumulative_data = {}
        accum = {
            'pixel_contacts': 0,
            'sources_count': 0,
            'lookalike_count': 0,
            'smart_count': 0,
            'sync_count': 0
        }

        for date in sorted_dates:
            day = daily_data[date]
            for key in accum:
                accum[key] += day.get(key, 0)
            cumulative_data[date] = accum.copy()

        total_counts = {
            "pixel_contacts": accum['pixel_contacts'],
            "sources_count": accum['sources_count'],
            "lookalike_count": accum['lookalike_count'],
            "smart_audience_count": accum['smart_count'],
            "data_sync_count": accum['sync_count'],
        }

        return {
            "daily_data": cumulative_data,
            "total_counts": total_counts
        }