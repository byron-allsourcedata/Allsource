from pydantic import BaseModel
from typing import Optional
from schemas.similar_audiences import AudienceFeatureImportance


class CalculateRequest(BaseModel):
    count_matched_persons: int
    audience_feature_importance: AudienceFeatureImportance


class LookalikeCreateRequest(BaseModel):
    uuid_of_source: str
    lookalike_size: str
    lookalike_name: str
    audience_feature_importance: Optional[AudienceFeatureImportance]


class UpdateLookalikeRequest(BaseModel):
    uuid_of_lookalike: str
    name_of_lookalike: str
