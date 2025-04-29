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
        response = self._build_response(raw_data.get("insights", {}))
        response["name"] = raw_data.get("name", "")
        response["audience_type"] = raw_data.get("audience_type", "")
        return response

    def get_lookalike_insights(self, lookalike_uuid: UUID, user: dict) -> dict:
        raw_data = self.insights_persistence_service.get_lookalike_insights_info(lookalike_uuid, user.get('id'))
        response = self._build_response(raw_data.get("insights", {}))
        response["name"] = raw_data.get("name", "")
        response["audience_type"] = raw_data.get("audience_type", "")
        response["significant_fields"] = raw_data.get("significant_fields", {})
        return response

    def get_data_sources(self, user: dict) -> dict:
        user_id = user["id"]
        sources = self.insights_persistence_service.get_recent_sources(user_id)
        lookalikes = self.insights_persistence_service.get_recent_lookalikes(user_id)

        return self._combine_limit_20(sources, lookalikes)

    def search_data_sources(self, user: dict, query: str) -> dict:
        user_id = user["id"]
        sources = self.insights_persistence_service.search_sources(user_id, query)
        lookalikes = self.insights_persistence_service.search_lookalikes(user_id, query)

        return self._combine_limit_20(sources, lookalikes)

    def _build_response(self, data: dict) -> dict:
        parsed = AudienceInsightData(
            b2b={
                "professional_profile": data.get("professional_profile", {}),
                "education": data.get("education_history", {}),
                "employment_history": data.get("employment_history", {}),
            },
            b2c={
                "personal_info": data.get("personal_profile", {}),
                "financial": data.get("financial", {}),
                "lifestyle": data.get("lifestyle", {}),
                "voter": data.get("voter", {}),
            }
        )
        return parsed.dict()

    def _combine_limit_20(self, sources: list, lookalikes: list) -> dict:
        source_data = [
            {
                "id": str(item.id),
                "name": item.name,
                "type": item.type,
                "data_source_type": "sources",
                "size": item.matched_records,
                "created_date": item.created_date.isoformat()
            }
            for item in sources
        ]

        lookalike_data = [
            {
                "id": str(item.id),
                "name": item.name,
                "type": item.type,
                "data_source_type": "lookalikes",
                "size": item.size,
                "created_date": item.created_date.isoformat()
            }
            for item in lookalikes
        ]

        combined = source_data + lookalike_data
        combined.sort(key=lambda x: x["created_date"], reverse=True)
        combined = combined[:20]

        return {
            "source": [x for x in combined if x["data_source_type"] == "sources"],
            "lookalike": [x for x in combined if x["data_source_type"] == "lookalikes"]
        }

