from typing import List
from uuid import UUID

from pydantic.v1 import UUID4

from persistence.audience_insights import AudienceInsightsPersistence
from schemas.insights import AudienceInsightData, PersonalProfiles
from enums import BaseEnum
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from schemas.lookalikes import CalculateRequest
from schemas.mapping.audience_insights_mapping import YES_NO_UNKNOWN_MAPS
from schemas.similar_audiences import AudienceFeatureImportance
from services.similar_audiences import SimilarAudienceService
from services.similar_audiences.exceptions import (
    EqualTrainTargets,
    EmptyTrainDataset,
)


class AudienceInsightsService:
    def __init__(
        self, insights_persistence_service: AudienceInsightsPersistence
    ):
        self.insights_persistence_service = insights_persistence_service

    def get_source_insights(
        self, source_uuid: UUID, user: dict, is_debug: bool
    ) -> dict:
        raw_data = self.insights_persistence_service.get_source_insights_info(
            source_uuid, user.get("id")
        )
        response = self._build_response(raw_data.get("insights", {}), is_debug)
        response["name"] = raw_data.get("name", "")
        response["audience_type"] = raw_data.get("audience_type", "")
        response["significant_fields"] = raw_data.get("significant_fields", "")
        return response

    def get_lookalike_insights(
        self, lookalike_uuid: UUID, user: dict, is_debug: bool
    ) -> dict:
        raw_data = (
            self.insights_persistence_service.get_lookalike_insights_info(
                lookalike_uuid, user.get("id")
            )
        )
        response = self._build_response(raw_data.get("insights", {}), is_debug)
        response["name"] = raw_data.get("name", "")
        response["audience_type"] = raw_data.get("audience_type", "")
        response["significant_fields"] = raw_data.get("significant_fields", {})
        return response

    def get_data_sources(self, user: dict) -> dict:
        user_id = user["id"]
        sources = self.insights_persistence_service.get_recent_sources(user_id)
        lookalikes = self.insights_persistence_service.get_recent_lookalikes(
            user_id
        )

        return self._combine_limit_20(sources, lookalikes)

    def search_data_sources(self, user: dict, query: str) -> dict:
        user_id = user["id"]
        sources = self.insights_persistence_service.search_sources(
            user_id, query
        )
        lookalikes = self.insights_persistence_service.search_lookalikes(
            user_id, query
        )

        return self._combine_limit_20(sources, lookalikes)

    @staticmethod
    def _build_response(data: dict, is_debug: bool) -> dict:
        # B2B
        professional_profile = data.get("professional_profile", {})
        education_history = data.get("education_history", {})
        employment_history = data.get("employment_history", {})

        # B2C
        personal_info = data.get("personal_profile", {})
        financial = data.get("financial", {})
        lifestyle = data.get("lifestyle", {})
        voter = data.get("voter", {})

        # Deleting unknown values
        if not is_debug:
            # B2B
            for key, val in professional_profile.items():
                if "unknown" in val:
                    val.pop("unknown")

            for key, val in employment_history.items():
                if "unknown" in val:
                    val.pop("unknown")

            for key, val in education_history.items():
                # TODO: unknown values can be find
                # without debug in post_graduation time
                if "unknown" in val:
                    val.pop("unknown")

            # B2C
            for key, val in personal_info.items():
                if "unknown" in val:
                    val.pop("unknown")

            for key, val in financial.items():
                if "unknown" in val:
                    val.pop("unknown")

            for key, val in voter.items():
                if (
                    key in ("congressional_district", "political_party")
                    and "unknown" in val
                ):
                    val.pop("unknown")

        parsed = AudienceInsightData(
            b2b={
                "professional_profile": professional_profile,
                "education_history": education_history,
                "employment_history": employment_history,
            },
            b2c={
                "personal_info": personal_info,
                "financial": financial,
                "lifestyle": lifestyle,
                "voter": voter,
            },
        )

        parsed = parsed.model_dump()
        parsed["is_debug"] = is_debug

        return parsed

    def _combine_limit_20(self, sources: list, lookalikes: list) -> dict:
        source_data = [
            {
                "id": str(item.id),
                "name": item.name,
                "type": item.type,
                "data_source_type": "sources",
                "size": item.matched_records,
                "disabled": item.matched_records_status != "complete",
                "created_date": item.created_date.isoformat(),
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
                "disabled": item.train_model_size
                != item.processed_train_model_size
                or item.processed_train_model_size == 0,
                "created_date": item.created_date.isoformat(),
            }
            for item in lookalikes
        ]

        combined = source_data + lookalike_data
        combined.sort(key=lambda x: x["created_date"], reverse=True)
        combined = combined[:20]

        return {
            "source": [
                x for x in combined if x["data_source_type"] == "sources"
            ],
            "lookalike": [
                x for x in combined if x["data_source_type"] == "lookalikes"
            ],
        }
