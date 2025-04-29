from typing import Dict, Optional, Iterable

from pydantic import BaseModel, Field

from schemas.similar_audiences import AudienceFeatureImportance

class LookalikeCreateRequest(BaseModel):
    uuid_of_source: str
    lookalike_size: str
    lookalike_name: str
    audience_feature_importance: Optional[Dict]


class UpdateLookalikeRequest(BaseModel):
    uuid_of_lookalike: str
    name_of_lookalike: str

class B2CInsights(BaseModel):
    personal:               Dict[str, float] = Field(default_factory=dict)
    financial:              Dict[str, float] = Field(default_factory=dict)
    lifestyle:              Dict[str, float] = Field(default_factory=dict)
    voter:                  Dict[str, float] = Field(default_factory=dict)

class B2BInsights(BaseModel):
    employment_history:     Dict[str, float] = Field(default_factory=dict)
    professional_profile:   Dict[str, float] = Field(default_factory=dict)

class CalculateRequest(BaseModel):
    count_matched_persons:              int
    audience_feature_importance_b2c:   Optional[B2CInsights]=B2BInsights()
    audience_feature_importance_b2b:    Optional[B2BInsights]=B2CInsights()
    audience_feature_importance_other: Dict[str, float]

    @staticmethod
    def _make_zero_dicts(**key_sets: Iterable[str]) -> Dict[str, Dict[str, float]]:
        return {
            category: {key: 0.0 for key in keys}
            for category, keys in key_sets.items()
        }

