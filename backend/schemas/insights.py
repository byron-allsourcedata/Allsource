from typing import Dict, Any
from pydantic import BaseModel, model_validator


class LookalikeCreateRequest(BaseModel):
    uuid_of_source: str
    lookalike_size: str
    lookalike_name: str

class UpdateLookalikeRequest(BaseModel):
    uuid_of_lookalike: str
    name_of_lookalike: str


class PersonalProfiles(BaseModel):
    gender: Dict[str, float] = {}
    state: Dict[str, float] = {}
    religion: Dict[str, float] = {}
    age: Dict[str, float] = {}
    ethnicity: Dict[str, float] = {}
    languages: Dict[str, float] = {}
    education_level: Dict[str, float] = {}

    have_children: Dict[str, float] = {}
    marital_status: Dict[str, float] = {}
    homeowner: Dict[str, float] = {}

    @staticmethod
    def _to_percent(data: Dict[str, int]) -> Dict[str, float]:
        total = sum(data.values())
        if total == 0:
            return {k: 0.0 for k in data}
        return {k: round(v / total * 100, 2) for k, v in data.items()}

    @model_validator(mode="after")
    def calculate_percentages(self) -> "PersonalProfiles":
        values = self.model_dump()
        for key, val in values.items():
            if isinstance(val, dict):
                setattr(self, key, self._to_percent(val))
        return self


class B2CInsight(BaseModel):
    personal_info: PersonalProfiles
    financial_info: Dict[str, Any] = {}
    lifestyle_info: Dict[str, Any] = {}
    voter_info: Dict[str, Any] = {}


class B2BInsight(BaseModel):
    professional_profile: Dict[str, Any] = {}
    education_history: Dict[str, Any] = {}
    employment_history: Dict[str, Any] = {}


class AudienceInsightData(BaseModel):
    b2c: B2CInsight
    b2b: B2BInsight
