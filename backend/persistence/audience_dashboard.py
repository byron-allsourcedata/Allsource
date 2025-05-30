from datetime import datetime, timezone, timedelta
from collections import defaultdict
from sqlalchemy.sql import func, select, union_all, literal_column, extract, case, literal
from sqlalchemy.orm import aliased
from enums import AudienceSmartStatuses
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


class DashboardAudiencePersistence:
    def __init__(self, db_session):
        self.db = db_session

    def get_sources_overview(self, user_id) -> tuple[list[tuple[AudienceSource, str]], int]:
        source_rows = (

            self.db
            .query(AudienceSource, Users.full_name)
            .join(Users, Users.id == AudienceSource.created_by_user_id)
            .filter(AudienceSource.user_id == user_id)
            .order_by(AudienceSource.created_at.desc())
            .all()
        )
        installed_domains_count = (
            self.db
            .query(UserDomains)
            .filter(
                UserDomains.user_id == user_id,
                UserDomains.is_pixel_installed == True,
            )
            .count()
        )
        return source_rows, installed_domains_count

    def get_audience_metrics(self):
        queries = [
            {
                'query': self.db.query(
                    func.count(Users.id).label("count"))
                    .filter(Users.role.contains(['customer'])),
                'key': 'users_count'
            },
            {
                'query': self.db.query(
                    func.count(UserDomains.id).label("count")
                )
                .join(Users, Users.id == UserDomains.user_id)\
                .filter(UserDomains.is_pixel_installed == True, Users.role.contains(['customer'])),
                'key': 'pixel_contacts'
            },
            {
                'query': self.db.query(
                    func.count(AudienceSource.id).label("count")
                )
                .join(Users, Users.id == AudienceSource.user_id) \
                .filter(Users.role.contains(['customer'])),
                'key': 'sources_count'
            },
            {
                'query': self.db.query(
                    func.count(AudienceLookalikes.id).label("count")
                )
                .join(Users, Users.id == AudienceLookalikes.user_id) \
                .filter(Users.role.contains(['customer'])),
                'key': 'lookalike_count'
            },
            {
                'query': self.db.query(
                    func.count(AudienceSmart.id).label("count")
                )
                .join(Users, Users.id == AudienceSmart.user_id) \
                .filter(Users.role.contains(['customer'])),
                'key': 'smart_count'
            },
            {
                'query': self.db.query(
                    func.count(IntegrationUserSync.id).label("count")
                )
                .join(UserDomains, UserDomains.id == IntegrationUserSync.domain_id) \
                .join(Users, Users.id == UserDomains.user_id) \
                .filter(Users.role.contains(['customer'])),
                'key': 'sync_count'
            }
        ]
        return queries

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

    def get_user_domains(self, user_id: int) -> list[str]:
        return [
            row[0] for row in self.db.query(UserDomains.domain)
                .filter(UserDomains.user_id == user_id, UserDomains.is_pixel_installed == True)
                .all()
        ]

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
            
    def get_last_sources_and_lookalikes(self, *, user_id: int, limit=5, smart_audiences: List[AudienceSmart]):
        all_lookalike_ids = [
            lid
            for audience in smart_audiences
            for lid in (audience.inc_lookalike_ids or [])
        ]
        unique_lookalike_ids = set(all_lookalike_ids)
        priority_order = case(
            (AudienceLookalikes.id.in_(unique_lookalike_ids), 0),
            else_=1
        )
        
        lookalikes = self.db.query(
            AudienceLookalikes.id.label('id'),
            AudienceSource.id.label('source_id'),
            AudienceSource.name.label('source_name'),
            AudienceSource.source_type.label('source_type'),
            AudienceSource.matched_records.label('matched_records'),
            AudienceLookalikes.name.label('lookalike_name'),
            AudienceLookalikes.created_date.label('created_at'),
            AudienceLookalikes.lookalike_size.label('lookalike_size'),
            AudienceLookalikes.size.label('size'),
            AudienceSource.target_schema.label('target_type')
        )\
        .join(AudienceSource, AudienceSource.id == AudienceLookalikes.source_uuid)\
        .filter(
            AudienceLookalikes.user_id == user_id
        )\
        .order_by(
                priority_order,
                AudienceLookalikes.created_date.desc()
            )\
        .limit(limit).all()
        
        all_source_ids = [
            lid
            for audience in smart_audiences
            for lid in (audience.inc_source_ids or [])
        ]
        unique_source_ids = set(all_source_ids)
        priority_audience_source_order = case(
            (AudienceSource.id.in_(unique_source_ids), 0),
            else_=1
        )
        
        sources = self.db.query(
            AudienceSource.id.label('id'),
            AudienceSource.name.label('source_name'),
            AudienceSource.created_at.label('created_at'),
            AudienceSource.source_type.label('source_type'),
            AudienceSource.matched_records.label('matched_records'),
            AudienceSource.target_schema.label('target_type'),
            AudienceSource.total_records.label('no_of_customers'),
            UserDomains.domain.label('domain')
        ) \
            .join(UserDomains, AudienceSource.domain_id == UserDomains.id, isouter=True) \
            .filter(
            AudienceSource.user_id == user_id
        )\
        .order_by(
                priority_audience_source_order,
                AudienceSource.created_at.desc()
            )\
        .limit(limit).all()

        return sources, lookalikes
    
    def get_chains_data_syncs(self, *, ids, type):
        DataSourcesFromSource = aliased(AudienceSmartsDataSources, name="datasource_from_source")
        DataSourcesFromLookalike = aliased(AudienceSmartsDataSources, name="datasource_from_lookalike")

        if type == 'sources':
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
                    AudienceLookalikes.source_uuid == AudienceSource.id
                )
                .outerjoin(
                    DataSourcesFromSource,
                    DataSourcesFromSource.source_id == AudienceSource.id
                )
                .outerjoin(
                    DataSourcesFromLookalike,
                    DataSourcesFromLookalike.lookalike_id == AudienceLookalikes.id
                )
                .outerjoin(
                    AudienceSmart,
                    or_(
                        AudienceSmart.id == DataSourcesFromSource.smart_audience_id,
                        AudienceSmart.id == DataSourcesFromLookalike.smart_audience_id
                    )
                )
                .outerjoin(
                    IntegrationUserSync,
                    IntegrationUserSync.smart_audience_id == AudienceSmart.id
                )
                .where(AudienceSource.id.in_(ids))
            )
        elif type == 'lookalikes':
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
                    AudienceSource.id == AudienceLookalikes.source_uuid
                )
                .outerjoin(
                    AudienceSmartsDataSources,
                    AudienceSmartsDataSources.lookalike_id == AudienceLookalikes.id
                )
                .outerjoin(
                    AudienceSmart, AudienceSmart.id == AudienceSmartsDataSources.smart_audience_id
                )
                .outerjoin(
                    IntegrationUserSync,
                    IntegrationUserSync.smart_audience_id == AudienceSmart.id
                )
                .where(AudienceLookalikes.id.in_(ids))
            )
        elif type == 'smart_audiences':
            stmt = (
                select(
                    AudienceSource,
                    AudienceLookalikes,
                    AudienceSmart,
                    IntegrationUserSync,
                )
                .select_from(AudienceSmart)
                .join(
                    DataSourcesFromSource, DataSourcesFromSource.smart_audience_id == AudienceSmart.id
                )
                .outerjoin(
                    AudienceSource,
                    AudienceSource.id == DataSourcesFromSource.source_id
                )
                .outerjoin(
                    AudienceLookalikes,
                    AudienceLookalikes.id == DataSourcesFromSource.lookalike_id
                )
                .outerjoin(
                    IntegrationUserSync,
                    IntegrationUserSync.smart_audience_id == AudienceSmart.id
                )
                .where(AudienceSmart.id.in_(ids))
            )
        elif type == 'data_sync':
            stmt = (
                select(
                    AudienceSource,
                    AudienceLookalikes,
                    AudienceSmart,
                    IntegrationUserSync,
                )
                .select_from(IntegrationUserSync)
                .join(
                    AudienceSmart, IntegrationUserSync.smart_audience_id == AudienceSmart.id
                )
                .join(
                    DataSourcesFromSource, DataSourcesFromSource.smart_audience_id == AudienceSmart.id
                )
                .outerjoin(
                    AudienceSource, AudienceSource.id == DataSourcesFromSource.source_id
                )
                .outerjoin(
                    AudienceLookalikes, AudienceLookalikes.id == DataSourcesFromSource.lookalike_id
                )
                .where(IntegrationUserSync.id.in_(ids))
            )
        return self.db.execute(stmt).all()
    
    def get_last_lookalike_smart_audiences(self, user_id: int, limit: int, smart_audiences: List[AudienceSmart]):
        smart_audience_ids = [data_sync.id for data_sync in smart_audiences]
        priority_order = case(
            (AudienceSmart.id.in_(smart_audience_ids), 0),
            else_=1
        )
        lookalike_smart_audiences = (
            self.db.query(
                AudienceSmart.id.label('id'),
                AudienceSmart.created_at.label('created_at'),
                AudienceSmart.name.label('audience_name'),
                AudienceSmartsUseCase.name.label('use_case'),
                AudienceSmart.active_segment_records.label('active_segment'),
                AudienceLookalikes.name.label('lookalike_name'),
                AudienceLookalikes.lookalike_size.label('lookalike_size'),
                AudienceLookalikes.size.label('size')
            )
            .join(AudienceSmartsUseCase, AudienceSmartsUseCase.id == AudienceSmart.use_case_id)
            .join(AudienceSmartsDataSources, AudienceSmartsDataSources.smart_audience_id == AudienceSmart.id)
            .join(AudienceLookalikes, AudienceSmartsDataSources.lookalike_id == AudienceLookalikes.id)
            .filter(AudienceSmart.user_id == user_id)
            .order_by(
                priority_order,
                AudienceSmart.created_at.desc()
            )
            .limit(limit)
            .all()
        )
        return lookalike_smart_audiences

    def get_last_smart_audiences_and_data_syncs(self, *, user_id: int, limit=5):
        data_syncs = self.db.query(
                        IntegrationUserSync.id.label('id'),
                        AudienceSmart.id.label('smart_audience_id'),
                        AudienceSmart.name.label('audience_name'),
                        AudienceSmart.status.label('status'),
                        IntegrationUserSync.created_at.label('created_at'),
                        IntegrationUserSync.sent_contacts.label('synced_contacts'),
                        UserIntegration.service_name.label('destination'),
                    )\
                    .join(UserIntegration, UserIntegration.id == IntegrationUserSync.integration_id)\
                    .join(AudienceSmart, AudienceSmart.id == IntegrationUserSync.smart_audience_id)\
                    .join(AudienceSmartsUseCase, AudienceSmartsUseCase.id == AudienceSmart.use_case_id)\
                    .filter(
                        UserIntegration.user_id == user_id
                    )\
                    .order_by(IntegrationUserSync.created_at.desc()).limit(limit).all()
                    
        sync_ids = [data_sync.smart_audience_id for data_sync in data_syncs]
                
        include_agg = (
            self.db.query(
                AudienceSmartsDataSources.smart_audience_id.label('smart_audience_id'),
                func.array_agg(AudienceSource.id).label('inc_source_ids'),
                func.array_agg(AudienceSource.name).label('inc_source_names'),
                func.array_agg(AudienceLookalikes.id).label('inc_lookalike_ids'),
                func.array_agg(AudienceLookalikes.name).label('inc_lookalike_names'),
            )
            .outerjoin(AudienceSource, AudienceSmartsDataSources.source_id == AudienceSource.id)
            .outerjoin(AudienceLookalikes, AudienceSmartsDataSources.lookalike_id == AudienceLookalikes.id)
            .filter(AudienceSmartsDataSources.data_type == 'include')
            .group_by(AudienceSmartsDataSources.smart_audience_id)
            .subquery()
        )

        exclude_agg = (
            self.db.query(
                AudienceSmartsDataSources.smart_audience_id.label('smart_audience_id'),
                func.array_agg(AudienceSource.id).label('exc_source_ids'),
                func.array_agg(AudienceSource.name).label('exc_source_names'),
                func.array_agg(AudienceLookalikes.id).label('exc_lookalike_ids'),
                func.array_agg(AudienceLookalikes.name).label('exc_lookalike_names'),
            )
            .outerjoin(AudienceSource, AudienceSmartsDataSources.source_id == AudienceSource.id)
            .outerjoin(AudienceLookalikes, AudienceSmartsDataSources.lookalike_id == AudienceLookalikes.id)
            .filter(AudienceSmartsDataSources.data_type == 'exclude')
            .group_by(AudienceSmartsDataSources.smart_audience_id)
            .subquery()
        )

        
        priority_order = case(
            (AudienceSmart.id.in_(sync_ids), 0),
            else_=1
        )

        audience_smart_results = (
            self.db.query(
                AudienceSmart.id.label('id'),
                AudienceSmart.created_at,
                AudienceSmart.name.label('audience_name'),
                AudienceSmartsUseCase.name.label('use_case'),
                AudienceSmart.active_segment_records.label('active_segment'),
                include_agg.c.inc_source_ids,
                include_agg.c.inc_source_names,
                include_agg.c.inc_lookalike_ids,
                include_agg.c.inc_lookalike_names,
                exclude_agg.c.exc_source_ids,
                exclude_agg.c.exc_source_names,
                exclude_agg.c.exc_lookalike_ids,
                exclude_agg.c.exc_lookalike_names,
            )
            .join(AudienceSmartsUseCase, AudienceSmartsUseCase.id == AudienceSmart.use_case_id)
            .outerjoin(include_agg, include_agg.c.smart_audience_id == AudienceSmart.id)
            .outerjoin(exclude_agg, exclude_agg.c.smart_audience_id == AudienceSmart.id)
            .filter(AudienceSmart.user_id == user_id)
            .order_by(
                priority_order,
                AudienceSmart.created_at.desc()
            )\
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

        query = self.db.query(
            func.date(LeadsVisits.start_date).label("date"),
            LeadUser.behavior_type,
            func.sum(
                case(
                    (LeadUser.is_converted_sales == True, 1),
                    else_=0
                )
            ).label("count_converted_sales"),
            func.count(LeadUser.id).label("count")
        ).join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id).filter(
            LeadUser.user_id == user_id,
            LeadsVisits.start_date >= one_year_ago,
            LeadUser.domain_id == domain_id,
        )

        if from_date is not None and to_date is not None:
            from_dt = datetime.fromtimestamp(from_date, tz=timezone.utc)
            to_dt = datetime.fromtimestamp(to_date, tz=timezone.utc)
            query = query.filter(LeadsVisits.start_date.between(from_dt, to_dt))

        results = query.group_by(
            func.date(LeadsVisits.start_date),
            LeadUser.behavior_type
        ).order_by(func.date(LeadsVisits.start_date)).all()

        return results
