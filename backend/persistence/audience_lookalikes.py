from datetime import datetime

import pytz

from models.audience_sources import AudienceSource
from models.audience_lookalikes import AudienceLookalikes
from models.users_domains import UserDomains
from sqlalchemy.orm import Session
from typing import Optional
import math
from sqlalchemy import asc, desc, or_
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from urllib.parse import unquote

from models.users import Users


class AudienceLookalikesPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_source_info(self, uuid_of_source, user_id):
        source = self.db.query(AudienceSource, Users.full_name).join(Users, Users.id == AudienceSource.created_by_user_id) \
            .filter(AudienceSource.id == uuid_of_source, AudienceSource.user_id == user_id).first()

        return source

    def get_lookalikes(self, user_id: int, page: Optional[int] = None, per_page: Optional[int] = None, from_date: Optional[int] = None, to_date: Optional[int] = None,
                       sort_by: Optional[str] = None, sort_order: Optional[str] = None,
                       lookalike_size: Optional[str] = None, lookalike_type: Optional[str] = None,
                       search_query: Optional[str] = None):
        query = self.db.query(
            AudienceLookalikes,
            AudienceSource.name,
            AudienceSource.source_type,
            Users.full_name,
            AudienceSource.source_origin,
            UserDomains.domain)\
            .join(AudienceSource, AudienceLookalikes.source_uuid == AudienceSource.id)\
            .outerjoin(UserDomains, AudienceSource.domain_id == UserDomains.id)\
            .join(Users, Users.id == AudienceSource.created_by_user_id)\
            .filter(AudienceLookalikes.user_id == user_id)
            
        if search_query:
            query = query.filter(
                or_(
                    AudienceLookalikes.name.ilike(f"%{search_query}%"),
                    AudienceSource.name.ilike(f"%{search_query}%"),
                    Users.full_name.ilike(f"%{search_query}%")
                )
            )

        sort_options = {
            'name': AudienceLookalikes.name,
            'created_date': AudienceLookalikes.created_date,
            'size': AudienceLookalikes.size,
        }
        if sort_by:
            sort_column = sort_options[sort_by]
            if sort_order == 'asc':
                query = query.order_by(asc(sort_column))
            elif sort_order == 'desc':
                query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(desc(AudienceLookalikes.created_date))

        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)

            query = query.filter(
                AudienceLookalikes.created_date >= start_date,
                AudienceLookalikes.created_date <= end_date
            )
        if lookalike_size:
            sizes = [unquote(i.strip()) for i in lookalike_size.split(',')]
            query = query.filter(AudienceLookalikes.lookalike_size.in_(sizes))

        if lookalike_type:
            types = [unquote(i.strip()).replace(' ', '_') for i in lookalike_type.split(',')]
            filters = [AudienceSource.source_type.ilike(f"%{t}%") for t in types]
            query = query.filter(or_(*filters))

        offset = (page - 1) * per_page
        lookalikes = query.limit(per_page).offset(offset).all()
        count = query.count()
        max_page = math.ceil(count / per_page)
        result = [
            {
                **lookalike.__dict__,
                "source": source_name,
                "source_type": source_type,
                "created_by": created_by,
                "source_origin": source_origin,
                "domain": domain,
            }
            for lookalike, source_name, source_type, created_by, source_origin, domain in lookalikes
        ]
        
        return result, count, max_page

    def create_lookalike(self, uuid_of_source, user_id, lookalike_size,
                         lookalike_name, created_by_user_id):
        source_info = self.get_source_info(uuid_of_source, user_id)
        if not source_info:
            raise HTTPException(status_code=404, detail="Source not found or access denied")

        sources, created_by = source_info

        lookalike = AudienceLookalikes(
            name=lookalike_name,
            lookalike_size=lookalike_size,
            user_id=user_id,
            created_date=datetime.utcnow(),
            created_by_user_id=created_by_user_id,
            source_uuid=uuid_of_source,
        )
        self.db.add(lookalike)
        self.db.commit()

        return {
            "id": lookalike.id,
            "name": lookalike.name,
            "source": sources.source_origin,
            "source_type": sources.source_type,
            "lookalike_size": lookalike.lookalike_size,
            "created_date": lookalike.created_date,
            "created_by": created_by,
        }

    def delete_lookalike(self, uuid_of_lookalike, user_id):
        delete_lookalike = self.db.query(AudienceLookalikes).filter(
            AudienceLookalikes.id == uuid_of_lookalike,
            AudienceLookalikes.user_id == user_id
        ).first()

        if delete_lookalike:
            try:
                self.db.delete(delete_lookalike)
                self.db.commit()
                return True
            except IntegrityError:
                self.db.rollback()
                raise
        return False

    def update_lookalike(self, uuid_of_lookalike, name_of_lookalike, user_id):
        query = self.db.query(AudienceLookalikes).filter(
            AudienceLookalikes.id == uuid_of_lookalike,
            AudienceLookalikes.user_id == user_id
        )

        updated_rows = query.update({AudienceLookalikes.name: name_of_lookalike}, synchronize_session=False)
        self.db.commit()

        return updated_rows > 0

    def search_lookalikes(self, start_letter, user_id):
        query = self.db.query(
            AudienceLookalikes, AudienceSource.name.label('source_name'), AudienceSource.source_type, Users.full_name) \
            .join(AudienceSource, AudienceLookalikes.source_uuid == AudienceSource.id) \
            .join(Users, Users.id == AudienceSource.created_by_user_id) \
            .filter(AudienceLookalikes.user_id == user_id)

        if start_letter:
            query = query.filter(
                or_(
                    AudienceLookalikes.name.ilike(f"{start_letter}%"),
                    AudienceSource.name.ilike(f"{start_letter}%"),
                    Users.full_name.ilike(f"{start_letter}%")
                )
            )

        lookalike_data = query.all()

        return lookalike_data

    def get_all_sources(self, user_id):
        source = self.db.query(AudienceSource, Users.full_name).join(Users,
                                                                     Users.id == AudienceSource.created_by_user_id) \
            .filter(AudienceSource.user_id == user_id).all()

        return source

