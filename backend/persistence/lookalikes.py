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
        return self.db.query(AudienceSource).where(AudienceSource.uuid == uuid_of_source,
                                                   AudienceSource.user_id == user_id).first()

    def get_user_name(self, user_id):
        user = self.db.query(Users).filter(Users.id == user_id).first()
        return user.name if user else None

    def create_lookalike(self, uuid_of_source, user_id, lookalike_size, lookalike_name, created_by_user_id):
        source = self.get_source_info(uuid_of_source, user_id)
        if not source:
            raise HTTPException(status_code=404, detail="Source not found or access denied")

        lookalike = Lookalikes(
            name=lookalike_name,
            source=source.source_origin,
            source_type=source.source_type,
            lookalike_size=lookalike_size,
            user_id=user_id,
            created_by_user_id=created_by_user_id,
        )
        self.db.add(lookalike)
        self.db.commit()
        self.db.refresh(lookalike)

        created_by_name = self.get_user_name(created_by_user_id)

        return {
            "name": lookalike.name,
            "source": lookalike.source,
            "source_type": lookalike.source_type,
            "lookalike_size": lookalike.lookalike_size,
            "created_date": lookalike.created_date,
            "created_by": created_by_name
        }
