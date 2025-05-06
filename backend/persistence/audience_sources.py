import logging
from datetime import datetime
from uuid import UUID

from sqlalchemy import desc, asc, select
from sqlalchemy.orm import Session

from enums import TypeOfSourceOrigin, TypeOfCustomer
from models.audience_sources import AudienceSource
from models.users import Users
from models.users_domains import UserDomains
from typing import Optional, Tuple, List
from sqlalchemy.engine.row import Row
from sqlalchemy.orm import Query

from persistence.utils import apply_filters

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
                AudienceSource.id,
                AudienceSource.name,
                AudienceSource.target_schema,
                AudienceSource.source_type,
                AudienceSource.source_origin,
                Users.full_name,
                AudienceSource.created_at,
                UserDomains.domain,
                AudienceSource.total_records,
                AudienceSource.matched_records,
                AudienceSource.matched_records_status,
                AudienceSource.processed_records,
            )
                .join(Users, Users.id == AudienceSource.created_by_user_id)
                .outerjoin(UserDomains, AudienceSource.domain_id == UserDomains.id)
                .filter(AudienceSource.user_id == user_id)
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
            'number_of_customers': AudienceSource.total_records,
            'created_date': AudienceSource.created_at,
            'matched_records': AudienceSource.matched_records,
        }
        if sort_by in sort_options:
            sort_column = sort_options[sort_by]
            query = query.order_by(
                asc(sort_column) if sort_order == 'asc' else desc(sort_column),
            )
        else:
            query = query.order_by(AudienceSource.created_at.desc()) 

        offset = (page - 1) * per_page
        sources = query.limit(per_page).offset(offset).all()
        count = query.count()
        
        return sources, count
    
    def get_source_by_id(self, source_id) -> Optional[AudienceSource]:
        return self.db.query(AudienceSource).filter(AudienceSource.id == source_id).first()

    def create_source(self, **creating_data) -> Optional[AudienceSource]:
        source_type = creating_data.get("source_type")
        if not source_type:
            source_type = 'viewed_product,visitor,abandoned_cart,converted_sales'

        source = AudienceSource(
            user_id=creating_data.get("user_id"),
            created_by_user_id=creating_data.get("user_id"),
            source_type=source_type,
            source_origin=creating_data.get("source_origin"),
            target_schema=creating_data.get("target_schema"),
            file_url=creating_data.get("file_url"),
            name=creating_data.get("source_name"),
            domain_id=creating_data.get("domain_id"),
            mapped_fields=creating_data.get("rows"),
        )

        self.db.add(source)
        self.db.commit()
        self.db.refresh(source)
        return source

    def delete_source(self, source_id: int) -> int:
        deleted_count = self.db.query(AudienceSource).filter(
            AudienceSource.id == source_id
        ).delete()
        self.db.commit()
        return deleted_count

    def get_domains_source(self, user_id: int, page: int, per_page: int):
        total_count = (
            self.db.query(AudienceSource)
            .join(UserDomains, AudienceSource.domain_id == UserDomains.id)
            .filter(AudienceSource.user_id == user_id)
            .distinct(UserDomains.domain)
            .count()
        )

        result = (
            self.db.query(AudienceSource, UserDomains.domain)
            .join(UserDomains, AudienceSource.domain_id == UserDomains.id)
            .filter(AudienceSource.user_id == user_id)
            .distinct(UserDomains.domain)
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )

        has_more = (page * per_page) < total_count
        return result, has_more

    def get_processing_sources(self, source_id: UUID):
        return (
            self.db
            .query(
                AudienceSource.id,
                AudienceSource.name,
                AudienceSource.target_schema,
                AudienceSource.source_type,
                AudienceSource.source_origin,
                Users.full_name.label("created_by"),
                AudienceSource.created_at,
                UserDomains.domain,
                AudienceSource.total_records,
                AudienceSource.matched_records,
                AudienceSource.matched_records_status,
                AudienceSource.processed_records,
            )
            .join(Users, Users.id == AudienceSource.created_by_user_id)
            .outerjoin(UserDomains, AudienceSource.domain_id == UserDomains.id)
            .filter(AudienceSource.id == str(source_id))
            .one_or_none()
        )
