from datetime import datetime, timezone

import pytz

from models.audience_sources import AudienceSource
from models.audience_lookalikes import AudienceLookalikes
from sqlalchemy.orm import Session
from typing import Optional, Tuple, List
import math
from sqlalchemy import asc, desc, and_, or_
from fastapi import HTTPException
import re

from models.users import Users


class AudienceLookalikesPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_source_info(self, uuid_of_source, user_id):
        source = self.db.query(AudienceSource, Users.full_name).join(Users, Users.id == AudienceSource.created_by_user_id) \
            .filter(AudienceSource.id == uuid_of_source, AudienceSource.user_id == user_id).first()

        return source

    def get_lookalikes(self, user_id: int, page: int, per_page: int, from_date: int, to_date: int,
                       sort_by: Optional[str] = None, sort_order: Optional[str] = None):
        query = self.db.query(
            AudienceLookalikes, AudienceSource.source_type, AudienceSource.source_origin, Users.full_name)\
            .join(AudienceSource, AudienceLookalikes.source_uuid == AudienceSource.id)\
            .join(Users, Users.id == AudienceSource.created_by_user_id)\
            .filter(AudienceSource.user_id == user_id)

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

        offset = (page - 1) * per_page
        lookalikes = query.limit(per_page).offset(offset).all()
        count = query.count()
        max_page = math.ceil(count / per_page)
        result = [
            {
                **lookalike.__dict__,
                "source": source_origin,
                "source_type": source_type,
                "created_by": created_by
            }
            for lookalike, source_type, source_origin, created_by in lookalikes
        ]

        return result, count, max_page

    def create_lookalike(self, uuid_of_source, user_id, lookalike_size, lookalike_name, created_by_user_id):
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
            "name": lookalike.name,
            "source": sources.source_origin,
            "source_type": sources.source_type,
            "lookalike_size": lookalike.lookalike_size,
            "created_date": lookalike.created_date,
            "created_by": created_by,
        }

    def delete_lookalike(self, uuid_of_lookalike, user_id):
        delete_lookalike = self.db.query(AudienceLookalikes).filter(
            AudienceLookalikes.id == uuid_of_lookalike, AudienceLookalikes.user_id == user_id).first()
        if delete_lookalike:
            self.db.delete(delete_lookalike)
            self.db.commit()
            return True
        return False

    def update_lookalike(self, uuid_of_lookalike, name_of_lookalike, user_id):
        query = self.db.query(AudienceLookalikes).filter(
            AudienceLookalikes.id == uuid_of_lookalike,
            AudienceLookalikes.user_id == user_id
        )

        updated_rows = query.update({AudienceLookalikes.name: name_of_lookalike}, synchronize_session=False)
        self.db.commit()

        return updated_rows > 0

