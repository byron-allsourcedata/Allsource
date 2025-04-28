from typing import Dict, Optional

from pydantic import BaseModel, Field

from schemas.similar_audiences import AudienceFeatureImportance

class LookalikeCreateRequest(BaseModel):
    uuid_of_source: str
    lookalike_size: str
    lookalike_name: str
    audience_feature_importance: Optional[AudienceFeatureImportance]


class UpdateLookalikeRequest(BaseModel):
    uuid_of_lookalike: str
    name_of_lookalike: str

class B2CInsights(BaseModel):
    personal:               Dict[str, float] = Field(default_factory=dict)
    financial:              Dict[str, float] = Field(default_factory=dict)
    lifestyle:              Dict[str, float] = Field(default_factory=dict)
    voter:                  Dict[str, float] = Field(default_factory=dict)
    employment_history:     Dict[str, float] = Field(default_factory=dict)
    professional_profile:   Dict[str, float] = Field(default_factory=dict)

class B2BInsights(BaseModel):
    employment_history:     Dict[str, float] = Field(default_factory=dict)
    professional_profile:   Dict[str, float] = Field(default_factory=dict)

class CalculateRequest(BaseModel):
    count_matched_persons:              int
    audience_feature_importance_b2c:   Optional[B2CInsights]=B2BInsights()
    audience_feature_importance_b2b:    Optional[B2BInsights]=B2CInsights()
    audience_feature_importance_other: Dict[str, float]

