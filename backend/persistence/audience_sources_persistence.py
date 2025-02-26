import logging
from sqlalchemy import desc, asc
from sqlalchemy.orm import Session
from models.audience_sources import AudienceSource
from models.users import Users


logger = logging.getLogger(__name__)

class AudienceSourcesPersistence:    
    def __init__(self, db: Session):
        self.db = db


    def get_sources(self, user_id, page, per_page, sort_by, sort_order):

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

            )
                .join(Users, Users.id == AudienceSource.created_by_user_id)
                .filter(AudienceSource.user_id == user_id)
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

