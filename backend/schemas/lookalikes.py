from pydantic import BaseModel

from schemas.similar_audiences import AudienceFeatureImportance


class CalculateRequest(BaseModel):
    count_matched_persons: int
    audience_feature_importance: AudienceFeatureImportance