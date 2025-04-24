from typing import List
from uuid import UUID

from pydantic.v1 import UUID4

from persistence.audience_insights import AudienceInsightsPersistence
from schemas.insights import AudienceInsightData, PersonalProfiles
from enums import BaseEnum
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from schemas.lookalikes import CalculateRequest
from schemas.similar_audiences import AudienceFeatureImportance
from services.similar_audiences import SimilarAudienceService
from services.similar_audiences.exceptions import EqualTrainTargets, EmptyTrainDataset


class AudienceInsightsService:
    def __init__(self, insights_persistence_service: AudienceInsightsPersistence):
        self.insights_persistence_service = insights_persistence_service

    def get_source_insights(self, source_uuid: UUID, user: dict) -> dict:
        raw_data = self.insights_persistence_service.get_source_insights_info(source_uuid, user.get('id'))
        return self._build_response(raw_data)

    def get_lookalike_insights(self, lookalike_uuid: UUID, user: dict) -> dict:
        raw_data = self.insights_persistence_service.get_lookalike_insights_info(lookalike_uuid, user.get('id'))
        return self._build_response(raw_data)

    def _build_response(self, data: dict) -> dict:
        parsed = AudienceInsightData(
            b2b={
                "professional_profile": data.get("professional_profile", {}),
                "education_history": data.get("education_history", {}),
                "employment_history": data.get("employment_history", {}),
            },
            b2c={
                "personal_info": data.get("personal_profiles", {}),
                "financial_info": data.get("financial_info", {}),
                "lifestyle_info": data.get("lifestyle_info", {}),
                "voter_info": data.get("voter_info", {}),
            }
        )
        return parsed.dict()
