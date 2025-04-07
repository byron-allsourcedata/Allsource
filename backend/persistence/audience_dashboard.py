from datetime import datetime, timezone, timedelta
from collections import defaultdict
from sqlalchemy.sql import func, select, union_all, literal_column, extract, case
from sqlalchemy.orm import aliased

from models.audience_lookalikes import AudienceLookalikes
from models.audience_smarts import AudienceSmart
from sqlalchemy import and_, or_
from models.audience_sources import AudienceSource
from models.users_domains import UserDomains
from models.audience_smarts_use_cases import AudienceSmartsUseCase
from models.leads_visits import LeadsVisits
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from models.leads_users import LeadUser



class DashboardAudiencePersistence:
    def __init__(self, db_session):
        self.db = db_session
    
    def get_dashboard_audience_data(self, *, from_date: int, to_date: int, user_id: int):
        from_dt = datetime.fromtimestamp(from_date, tz=timezone.utc)
        to_dt = datetime.fromtimestamp(to_date, tz=timezone.utc)

        queries = [
            {
                'query': self.db.query(
                    func.count(LeadUser.id).label("count")
                )
                .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)
                    .filter(
                        and_(
                            LeadUser.user_id == user_id,
                            or_(
                                and_(
                                    LeadsVisits.start_date == from_dt.date(),
                                    LeadsVisits.start_time >= from_dt.time()
                                ),  
                                and_(
                                    LeadsVisits.end_date == to_dt.date(),
                                    LeadsVisits.end_time <= to_dt.time()
                                ),  
                                and_(
                                    LeadsVisits.start_date > from_dt.date(),
                                    LeadsVisits.start_date < to_dt.date()
                                )
                            )
                        )
                ),
                'key': 'pixel_contacts'
            },
            {
                'query': self.db.query(
                    func.count(AudienceSource.id).label("count")
                )
                    .filter(
                    AudienceSource.user_id == user_id,
                    AudienceSource.created_at >= from_dt,
                    AudienceSource.created_at <= to_dt
                ),
                'key': 'sources_count'
            },
            {
                'query': self.db.query(
                    func.count(AudienceLookalikes.id).label("count")
                )
                    .filter(
                    AudienceLookalikes.user_id == user_id,
                    AudienceLookalikes.created_date >= from_dt,
                    AudienceLookalikes.created_date <= to_dt
                ),
                'key': 'lookalike_count'
            },
            {
                'query': self.db.query(
                    func.count(AudienceSmart.id).label("count")
                )
                    .filter(
                    AudienceSmart.user_id == user_id,
                    AudienceSmart.created_at >= from_dt,
                    AudienceSmart.created_at <= to_dt
                ),
                'key': 'smart_count'
            },
            {
                'query': self.db.query(
                    func.count(IntegrationUserSync.id).label("count")
                )
                    .join(UserIntegration, UserIntegration.id == IntegrationUserSync.integration_id)
                    .filter(
                        UserIntegration.user_id == user_id,
                        IntegrationUserSync.created_at >= from_dt,
                        IntegrationUserSync.created_at <= to_dt
                    ),
                'key': 'sync_count'
            }
        ]
        return queries
    
    def get_contacts_for_pixel_contacts_statistics(self, *, user_id: int):
        twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
        return  self.db.query(
                    UserDomains.domain,
                    LeadUser.behavior_type,
                    func.sum(
                        case(
                            (LeadUser.is_converted_sales == True, 1),
                            else_=0
                        )
                    ).label("count_converted_sales"),
                    func.count(LeadUser.id).label("lead_count")
                )\
                .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)\
                .join(UserDomains, UserDomains.id == LeadUser.domain_id)\
                .filter(
                    and_(
                        LeadUser.user_id == user_id,
                        LeadsVisits.start_date >= twenty_four_hours_ago.date()
                        )
                )\
                .group_by(
                    UserDomains.domain,
                    LeadUser.behavior_type
                ).all()
    
    def get_dashboard_result_categories(self, *, from_date, to_date, user_id):
        from_dt = datetime.fromtimestamp(from_date, tz=timezone.utc)
        to_dt = datetime.fromtimestamp(to_date, tz=timezone.utc)
        queries = [
            {
                'query': self.db.query(
                    AudienceSmart.name.label('smart_audience_name'),
                    AudienceSmartsUseCase.name.label('use_case_name'),
                    AudienceSmart.active_segment_records.label('active_segment_records'),
                    AudienceSmart.created_at.label('smart_audience_created_at'),
                    IntegrationUserSync.created_at.label('sync_created_at'),
                    IntegrationUserSync.list_name.label('list_name')
                )
                .join(AudienceSmartsUseCase, AudienceSmartsUseCase.id == AudienceSmart.use_case_id)
                .join(IntegrationUserSync, IntegrationUserSync.smart_audience_id == AudienceSmart.id)
                .filter(
                    AudienceSmart.user_id == user_id,
                )
                .order_by(AudienceSmart.created_at.desc()).limit(1),
                'key': 'smart_audiences'
            },
            {
                'query': self.db.query(
                    IntegrationUserSync.list_name.label('list_name'),
                    IntegrationUserSync.created_at.label('sync_created_at'),
                    IntegrationUserSync.sent_contacts.label('sent_contacts'),
                    AudienceSmartsUseCase.name.label('use_case_name'),
                )
                    .join(UserIntegration, UserIntegration.id == IntegrationUserSync.integration_id)
                    .join(AudienceSmart, AudienceSmart.id == IntegrationUserSync.smart_audience_id)
                    .join(AudienceSmartsUseCase, AudienceSmartsUseCase.id == AudienceSmart.use_case_id)
                    .filter(
                        UserIntegration.user_id == user_id,
                        IntegrationUserSync.created_at >= from_dt,
                        IntegrationUserSync.created_at <= to_dt
                    )
                    .order_by(IntegrationUserSync.created_at.desc()).limit(1),
                'key': 'data_syncs'
            }
        ]
        return queries
    
    def get_last_sources_and_lookalikes(self, *, user_id):
        sources = self.db.query(
            AudienceSource.name.label('name'),
            AudienceSource.created_at.label('created_at'),
            AudienceSource.source_type.label('source_type'),
            AudienceSource.matched_records.label('matched_records'),
        ).filter(
            AudienceSource.user_id == user_id
        ).order_by(AudienceSource.created_at.desc()).limit(5).all()

        lookalikes = self.db.query(
            AudienceLookalikes.name.label('name'),
            AudienceLookalikes.created_date.label('created_at'),
            AudienceLookalikes.lookalike_size.label('lookalike_size'),
            AudienceLookalikes.size.label('size')
        ).filter(
            AudienceLookalikes.user_id == user_id
        ).order_by(AudienceLookalikes.created_date.desc()).limit(5).all()
        
        return sources, lookalikes
                     
    def get_contacts_for_pixel_contacts_by_domain_id(self, *, user_id: int, domain_id: int):
        one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)

        results = self.db.query(
                func.date(LeadUser.created_at).label("date"),
                LeadUser.behavior_type,
                func.sum(
                    case(
                        (LeadUser.is_converted_sales == True, 1),
                        else_=0
                    )
                ).label("count_converted_sales"),
                func.count(LeadUser.id).label("count")
            )\
            .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)\
            .filter(
                LeadUser.user_id == user_id,
                LeadsVisits.start_date >= one_year_ago,
                LeadUser.domain_id == domain_id
            )\
            .group_by(
                func.date(LeadUser.created_at),
                LeadUser.behavior_type
            )\
            .order_by(func.date(LeadUser.created_at))\
            .all()

        return results
