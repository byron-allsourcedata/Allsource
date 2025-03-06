import logging
from sqlalchemy import desc, asc
from sqlalchemy.orm import Session
from models.audience_sources import AudienceSource
from models.users import Users
from typing import Optional, Tuple, List
from sqlalchemy.engine.row import Row


logger = logging.getLogger(__name__)

class AudienceSourcesPersistence:    
    def __init__(self, db: Session):
        self.db = db


    def get_sources(
        self, 
        user_id: int, 
        page: int, 
        per_page: int, 
        sort_by: Optional[str] = None, 
        sort_order: Optional[str] = None
    ) -> Tuple[List[Row], int]:

        query = (
            self.db.query(
                AudienceSource.id,
                AudienceSource.name,
                AudienceSource.source_type,
                AudienceSource.source_origin,
                Users.full_name,
                AudienceSource.created_at,
                AudienceSource.updated_at,
                AudienceSource.total_records,
                AudienceSource.matched_records,
                AudienceSource.matched_records_status,

            )
                .join(Users, Users.id == AudienceSource.created_by_user_id)
                .filter(AudienceSource.user_id == user_id)
                .order_by(AudienceSource.created_at.asc())
        )

        sort_options = {
            'total_records': AudienceSource.total_records,
            'matched_records': AudienceSource.matched_records,
        }
        if sort_by in sort_options:
            sort_column = sort_options[sort_by]
            query = query.order_by(asc(sort_column) if sort_order == 'asc' else desc(sort_column))


        offset = (page - 1) * per_page
        sources = query.limit(per_page).offset(offset).all()
        count = query.count()
        
        return sources, count


    def create_source(self, **creating_data) -> Optional[AudienceSource]:
        source = AudienceSource(
            user_id=creating_data.get("user_id"),
            created_by_user_id=creating_data.get("user_id"),
            source_type=creating_data.get("source_type"),
            source_origin=creating_data.get("source_origin"),
            file_url=creating_data.get("file_url"),
            name=creating_data.get("source_name"),
            mapped_fields=creating_data.get("rows"),
        )

        self.db.add(source)
        self.db.commit()
        return source
    

    def delete_source(self, source_id: int) -> int:
        deleted_count = self.db.query(AudienceSource).filter(
            AudienceSource.id == source_id
        ).delete()
        self.db.commit()
        return deleted_count
