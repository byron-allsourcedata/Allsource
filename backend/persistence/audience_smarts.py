import logging
from datetime import datetime

from sqlalchemy import desc, asc, select
from sqlalchemy.orm import Session

from models.audience_smarts import AudienceSmart
from models.audience_smarts_use_cases import AudienceSmartsUseCase
from models.users import Users
from models.users_domains import UserDomains
from typing import Optional, Tuple, List
from sqlalchemy.engine.row import Row
from sqlalchemy.orm import Query

from persistence.utils import apply_filters

logger = logging.getLogger(__name__)

class AudienceSmartsPersistence:    
    def __init__(self, db: Session):
        self.db = db


    def get_audience_smarts(
            self,
            user_id: int,
            page: int,
            per_page: int,
            sort_by: Optional[str] = None,
            sort_order: Optional[str] = None,
            name: Optional[str] = None,
            source_origin: Optional[str] = None,
            source_type: Optional[str] = None,
            domain_name: Optional[str] = None,
            created_date_start: Optional[datetime] = None,
            created_date_end: Optional[datetime] = None
    ) -> Tuple[List[Row], int]:

        query = (
            self.db.query(
                AudienceSmart.id,
                AudienceSmart.name,
                AudienceSmartsUseCase.name,
                Users.full_name,
                AudienceSmart.created_at,
                UserDomains.domain,
                AudienceSmart.total_records,
                AudienceSmart.validated_records,
                AudienceSmart.active_segment_records,
                AudienceSmart.status,
            )
                .join(Users, Users.id == AudienceSmart.created_by_user_id)
                .join(AudienceSmartsUseCase, AudienceSmartsUseCase.id == AudienceSmart.use_case_id)
                .filter(AudienceSmart.user_id == user_id)
        )

        source_type_list = source_type.split(',') if source_type else []
        source_origin_list = source_origin.split(',') if source_origin else []
        domain_name_list = domain_name.split(',') if domain_name else []

        query = apply_filters(
            query,
            name=name,
            source_type_list=source_type_list,
            source_origin_list=source_origin_list,
            domain_name_list=domain_name_list,
            created_date_start=created_date_start,
            created_date_end=created_date_end
        )

        sort_options = {
            'number_of_customers': AudienceSmart.total_records,
            'created_date': AudienceSmart.created_at,
            'active_segment_records': AudienceSmart.active_segment_records,
        }
        if sort_by in sort_options:
            sort_column = sort_options[sort_by]
            query = query.order_by(
                asc(sort_column) if sort_order == 'asc' else desc(sort_column),
            )
        else:
            query = query.order_by(AudienceSmart.created_at.desc()) 

        offset = (page - 1) * per_page
        smarts = query.limit(per_page).offset(offset).all()
        count = query.count()
        
        return smarts, count
