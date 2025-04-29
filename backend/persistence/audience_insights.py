from datetime import datetime
from decimal import Decimal
from uuid import UUID

import pytz
from pydantic.v1 import UUID4

from enums import LookalikeSize
from models.audience_sources import AudienceSource
from models.audience_lookalikes import AudienceLookalikes
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from models.enrichment_users import EnrichmentUser
from models.users_domains import UserDomains
from sqlalchemy.orm import Session
from typing import Optional, List
import math
from sqlalchemy import asc, desc, or_, func
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from urllib.parse import unquote
from models.enrichment_lookalike_scores import EnrichmentLookalikeScore
from uuid import UUID

from models.users import Users
from schemas.similar_audiences import AudienceData, AudienceFeatureImportance


class AudienceInsightsPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_source_insights_info(self, uuid_of_source: UUID, user_id: int) -> dict:
        source = self.db.query(
            AudienceSource.insights,
            AudienceSource.name,
            AudienceSource.target_schema
        ).filter(
            AudienceSource.id == uuid_of_source,
            AudienceSource.user_id == user_id
        ).first()

        if source and source.insights:
            return {
                "insights": source.insights,
                "name": source.name,
                "audience_type": source.target_schema
            }
        elif source:
            return {"insights": {},
                    "name": source.name,
                    "audience_type": source.target_schema
            }

        return {"insights": {}, "name": "", "audience_type": ""}

    def get_lookalike_insights_info(self, uuid_of_lookalike: UUID, user_id: int) -> dict:
        lookalike = self.db.query(
            AudienceLookalikes.insights,
            AudienceLookalikes.name,
            AudienceSource.target_schema,
            AudienceLookalikes.significant_fields
        ).join(AudienceSource, AudienceSource.id == AudienceLookalikes.source_uuid
               ).filter(
            AudienceLookalikes.id == uuid_of_lookalike,
            AudienceLookalikes.user_id == user_id
        ).first()

        if lookalike and lookalike.insights:
            return {
                "insights": lookalike.insights,
                "name": lookalike.name,
                "audience_type": lookalike.target_schema,
                "significant_fields": lookalike.significant_fields
            }
        elif lookalike:
            if lookalike.significant_fields:
                return {"insights": {},
                        "name": lookalike.name,
                        "audience_type": lookalike.target_schema,
                        "significant_fields": lookalike.significant_fields
                }
            else:
                return {"insights": {},
                        "name": lookalike.name,
                        "audience_type": lookalike.target_schema,
                        "significant_fields": {}
                        }

        return {"insights": {}, "name": "", "audience_type": "", "significant_fields": {}}

    def get_recent_sources(self, user_id: int) -> list[dict]:
        return (
            self.db.query(
                AudienceSource.id,
                AudienceSource.name,
                AudienceSource.source_type.label("type"),
                AudienceSource.matched_records,
                AudienceSource.created_at.label("created_date")
            )
                .filter(AudienceSource.user_id == user_id)
                .order_by(AudienceSource.created_at.desc())
                .limit(20)
                .all()
        )

    def get_recent_lookalikes(self, user_id: int) -> list[dict]:
        return (
            self.db.query(
                AudienceLookalikes.id,
                AudienceLookalikes.name,
                AudienceSource.source_type.label("type"),
                AudienceLookalikes.size,
                AudienceLookalikes.created_date
            )
                .join(AudienceSource, AudienceSource.id == AudienceLookalikes.source_uuid)
                .filter(AudienceLookalikes.user_id == user_id)
                .order_by(AudienceLookalikes.created_date.desc())
                .limit(20)
                .all()
        )

    def search_sources(self, user_id: int, query: str) -> list[dict]:
        return (
            self.db.query(
                AudienceSource.id,
                AudienceSource.name,
                AudienceSource.source_type.label("type"),
                AudienceSource.matched_records,
                AudienceSource.created_at.label("created_date")
            )
                .filter(
                AudienceSource.user_id == user_id,
                AudienceSource.name.ilike(f"%{query}%")
            )
                .order_by(AudienceSource.created_at.desc())
                .limit(20)
                .all()
        )

    def search_lookalikes(self, user_id: int, query: str) -> list[dict]:
        return (
            self.db.query(
                AudienceLookalikes.id,
                AudienceLookalikes.name,
                AudienceSource.source_type.label("type"),
                AudienceLookalikes.size,
                AudienceLookalikes.created_date
            )
                .join(AudienceSource, AudienceSource.id == AudienceLookalikes.source_uuid)
                .filter(
                AudienceLookalikes.user_id == user_id,
                AudienceLookalikes.name.ilike(f"%{query}%")
            )
                .order_by(AudienceLookalikes.created_date.desc())
                .limit(20)
                .all()
        )
