from typing import Dict

from pydantic import BaseModel, Field

from schemas.similar_audiences import AudienceFeatureImportance


class B2CInsights(BaseModel):
    personal:   Dict[str, float] = Field(default_factory=dict)
    financial:  Dict[str, float] = Field(default_factory=dict)
    lifestyle:  Dict[str, float] = Field(default_factory=dict)
    voter:      Dict[str, float] = Field(default_factory=dict)
    other:      Dict[str, float] = Field(default_factory=dict)


class CalculateRequest(BaseModel):
    count_matched_persons: int
    audience_feature_importance: B2CInsights

