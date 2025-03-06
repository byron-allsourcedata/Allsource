from datetime import datetime, timezone
from models.audience_sources import AudienceSource
from models.lookalikes import Lookalikes
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
import re

from models.users import Users


class LookalikesPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_source_info(self, uuid_of_source, user_id):
        source = self.db.query(AudienceSource, Users.full_name).join(Users, Users.id == AudienceSource.created_by_user_id) \
            .filter(AudienceSource.id == uuid_of_source, AudienceSource.user_id == user_id).first()

        return source

    def create_lookalike(self, uuid_of_source, user_id, lookalike_size, lookalike_name, created_by_user_id):
        source_info = self.get_source_info(uuid_of_source, user_id)
        if not source_info:
            raise HTTPException(status_code=404, detail="Source not found or access denied")

        sources, created_by = source_info

        lookalike = Lookalikes(
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
