import logging
from datetime import datetime

import pytz
from sqlalchemy import desc, asc, or_
from sqlalchemy.orm import Session

from models.audience_smarts import AudienceSmart
from models.audience_smarts_use_cases import AudienceSmartsUseCase
from models.users import Users
from typing import Optional, Tuple, List
from sqlalchemy.engine.row import Row
from urllib.parse import unquote

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
            from_date: Optional[int] = None, 
            to_date: Optional[int] = None, 
            sort_by: Optional[str] = None,
            sort_order: Optional[str] = None,
            search_query: Optional[str] = None,
            statuses: Optional[str] = None,
            use_cases: Optional[str] = None,
    ) -> Tuple[List[Row], int]:

        query = (
            self.db.query(
                AudienceSmart.id,
                AudienceSmart.name,
                AudienceSmartsUseCase.alias,
                Users.full_name,
                AudienceSmart.created_at,
                AudienceSmart.total_records,
                AudienceSmart.validated_records,
                AudienceSmart.active_segment_records,
                AudienceSmart.status,
                AudienceSmartsUseCase.integrations,
            )
                .join(Users, Users.id == AudienceSmart.created_by_user_id)
                .join(AudienceSmartsUseCase, AudienceSmartsUseCase.id == AudienceSmart.use_case_id)
                .filter(AudienceSmart.user_id == user_id)
        )
        
        if statuses:
            status_list = [i.strip() for i in statuses.split(',')]
            query = query.filter(AudienceSmart.status.in_(status_list))
        
        if use_cases:
            use_case_aliases = [unquote(i.strip()) for i in use_cases.split(',')]
            query = query.filter(AudienceSmartsUseCase.alias.in_(use_case_aliases))

        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)

            query = query.filter(
                AudienceSmart.created_at >= start_date,
                AudienceSmart.created_at <= end_date
            )
        
        if search_query:
            query = query.filter(
                or_(
                    AudienceSmart.name.ilike(f"%{search_query}%"),
                    Users.full_name.ilike(f"%{search_query}%")
                )
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


    def search_audience_smart(self, start_letter: str, user_id: int):
        query = (
            self.db.query(
                AudienceSmart.name,
                Users.full_name
            )
                .join(Users, Users.id == AudienceSmart.created_by_user_id)
                .filter(AudienceSmart.user_id == user_id)
        )

        if start_letter:
            query = query.filter(
                or_(
                    AudienceSmart.name.ilike(f"{start_letter}%"),
                    Users.full_name.ilike(f"{start_letter}%")
                )
            )

        smarts = query.all()
        return smarts
    

    def delete_audience_smart(self, id: int) -> int:
        deleted_count = self.db.query(AudienceSmart).filter(
            AudienceSmart.id == id
        ).delete()
        self.db.commit()
        return deleted_count
    
    def update_audience_smart(self, id, new_name) -> int:
        updated_count = self.db.query(AudienceSmart).filter(
            AudienceSmart.id == id
        ).update({AudienceSmart.name: new_name}, synchronize_session=False)
        self.db.commit()
        return updated_count