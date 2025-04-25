from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, model_validator
from schemas.mapping.audience_insights_mapping import ETHNICITY_MAP, LANGUAGE_MAP, RELIGION_MAP,\
    YES_NO_UNKNOWN_MAPS, NET_WORTH_RANGE_MAP, CREDIT_SCORE_RANGE_MAP


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
    def _map_keys(data: Dict[str, int], key_map: Dict[str, str]) -> Dict[str, int]:
        return {key_map.get(k, k): v for k, v in data.items()}

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
            if not isinstance(val, dict):
                continue

            if key in YES_NO_UNKNOWN_MAPS:
                mapped = {YES_NO_UNKNOWN_MAPS[key].get(k, k): v for k, v in val.items()}
                total = sum(mapped.values())
                if total == 0:
                    setattr(self, key, {k: 0.0 for k in mapped})
                else:
                    percent_mapped = {k: round(v / total * 100, 2) for k, v in mapped.items()}
                    setattr(self, key, percent_mapped)
            else:
                if key == "ethnicity":
                    val = self._map_keys(val, ETHNICITY_MAP)
                elif key == "languages":
                    val = self._map_keys(val, LANGUAGE_MAP)
                elif key == "religion":
                    val = self._map_keys(val, RELIGION_MAP)

                setattr(self, key, self._to_percent(val))

        return self


class FinancialProfiles(BaseModel):
    income_range: Dict[str, float] = {}
    credit_score_range: Dict[str, float] = {}
    credit_cards: Dict[str, float] = {}
    net_worth_range: Dict[str, float] = {}
    bank_card: Dict[str, float] = {}
    mail_order_donor: Dict[str, float] = {}
    credit_card_premium: Dict[str, float] = {}
    credit_card_new_issue: Dict[str, float] = {}
    donor: Dict[str, float] = {}
    credit_range_of_new_credit: Dict[str, float] = {}
    investor: Dict[str, float] = {}
    number_of_credit_lines: Dict[str, float] = {}

    @staticmethod
    def _to_percent(data: Dict[str, int]) -> Dict[str, float]:
        total = sum(data.values())
        if total == 0:
            return {k: 0.0 for k in data}
        return {k: round(v / total * 100, 2) for k, v in data.items()}

    @model_validator(mode="after")
    def calculate_percentages(self) -> "FinancialProfiles":
        values = self.model_dump()

        for key, val in values.items():
            if not isinstance(val, dict):
                continue

            if key == "net_worth_range":
                mapped = {NET_WORTH_RANGE_MAP.get(k, k): v for k, v in val.items()}
                setattr(self, key, self._to_percent(mapped))

            elif key == "credit_score_range":
                mapped = {CREDIT_SCORE_RANGE_MAP.get(k, k): v for k, v in val.items()}
                setattr(self, key, self._to_percent(mapped))

            else:
                setattr(self, key, self._to_percent(val))

        return self


class LifestyleProfiles(BaseModel):
    online_purchaser: Dict[str, float] = {}
    travel_interest: Dict[str, float] = {}
    fitness_interest: Dict[str, float] = {}
    tech_interest: Dict[str, float] = {}
    outdoor_interest: Dict[str, float] = {}
    beauty_cosmetic_interest: Dict[str, float] = {}
    cooking_interest: Dict[str, float] = {}
    mail_order_buyer: Dict[str, float] = {}
    golf_interest: Dict[str, float] = {}
    book_reader: Dict[str, float] = {}
    smoker: Dict[str, float] = {}
    diy_interest: Dict[str, float] = {}
    own_pets: Dict[str, float] = {}
    health_and_beauty_interest: Dict[str, float] = {}
    automotive: Dict[str, float] = {}

    @staticmethod
    def _to_percent(data: Dict[str, int]) -> Dict[str, float]:
        total = sum(data.values())
        if total == 0:
            return {k: 0.0 for k in data}
        return {k: round(v / total * 100, 2) for k, v in data.items()}

    @model_validator(mode="after")
    def calculate_percentages(self) -> "LifestyleProfiles":
        values = self.model_dump()
        for key, val in values.items():
            if isinstance(val, dict):
                setattr(self, key, self._to_percent(val))
        return self


class VoterProfiles(BaseModel):
    congressional_district: Dict[str, float] = {}
    voting_propensity: Dict[str, float] = {}
    political_party: Dict[str, float] = {}

    @staticmethod
    def _to_percent(data: Dict[str, int]) -> Dict[str, float]:
        total = sum(data.values())
        if total == 0:
            return {k: 0.0 for k in data}
        return {k: round(v / total * 100, 2) for k, v in data.items()}

    @model_validator(mode="after")
    def calculate_percentages(self) -> "VoterProfiles":
        values = self.model_dump()
        for key, val in values.items():
            if isinstance(val, dict):
                setattr(self, key, self._to_percent(val))
        return self


class B2CInsight(BaseModel):
    personal_info: PersonalProfiles
    financial: FinancialProfiles
    lifestyle: LifestyleProfiles
    voter: VoterProfiles


class B2BInsight(BaseModel):
    professional_profile: Dict[str, Any] = {}
    education_history: Dict[str, Any] = {}
    employment_history: Dict[str, Any] = {}


class AudienceInsightData(BaseModel):
    b2c: B2CInsight
    b2b: B2BInsight


class Personal(BaseModel):
    gender: Dict[str, int] = Field(default_factory=dict)
    state: Dict[str, int] = Field(default_factory=dict)
    religion: Dict[str, int] = Field(default_factory=dict)
    homeowner: Dict[str, int] = Field(default_factory=dict)
    age: Dict[str, int] = Field(default_factory=dict)
    ethnicity: Dict[str, int] = Field(default_factory=dict)
    languages: Dict[str, int] = Field(default_factory=dict)
    marital_status: Dict[str, int] = Field(default_factory=dict)
    have_children: Dict[str, int] = Field(default_factory=dict)
    education_level: Dict[str, int] = Field(default_factory=dict)
    children_ages: Dict[str, int] = Field(default_factory=dict)
    pets: Dict[str, int] = Field(default_factory=dict)


class Financial(BaseModel):
    income_range: Optional[Dict[str, int]] = Field(default_factory=dict)
    credit_score_range: Optional[Dict[str, int]] = Field(default_factory=dict)
    credit_cards: Optional[Dict[str, int]] = Field(default_factory=dict)
    net_worth_range: Optional[Dict[str, int]] = Field(default_factory=dict)
    bank_card: Optional[Dict[str, int]] = Field(default_factory=dict)
    mail_order_donor: Optional[Dict[str, int]] = Field(default_factory=dict)
    credit_card_premium: Optional[Dict[str, int]] = Field(default_factory=dict)
    credit_card_new_issue: Optional[Dict[str, int]] = Field(default_factory=dict)
    donor: Optional[Dict[str, int]] = Field(default_factory=dict)
    credit_range_of_new_credit: Optional[Dict[str, int]] = Field(default_factory=dict)
    investor: Optional[Dict[str, int]] = Field(default_factory=dict)
    number_of_credit_lines: Optional[Dict[str, int]] = Field(default_factory=dict)


class Lifestyle(BaseModel):
    own_pets: Optional[Dict[str, int]] = Field(default_factory=dict)
    cooking_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    travel_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    mail_order_buyer: Optional[Dict[str, int]] = Field(default_factory=dict)
    online_purchaser: Optional[Dict[str, int]] = Field(default_factory=dict)
    book_reader: Optional[Dict[str, int]] = Field(default_factory=dict)
    health_and_beauty_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    fitness_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    outdoor_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    tech_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    diy_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    automotive: Optional[Dict[str, int]] = Field(default_factory=dict)
    smoker: Optional[Dict[str, int]] = Field(default_factory=dict)
    golf_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    beauty_cosmetic_interest: Optional[Dict[str, int]] = Field(default_factory=dict)


class Voter(BaseModel):
    congressional_district: Optional[Dict[str, int]] = Field(default_factory=dict)
    voting_propensity: Optional[Dict[str, int]] = Field(default_factory=dict)
    political_party: Optional[Dict[str, int]] = Field(default_factory=dict)


class InsightsByCategory(BaseModel):
    personal_profile: Optional[Personal] = Field(default_factory=Personal)
    financial: Optional[Financial] = Field(default_factory=Financial)
    lifestyle: Optional[Lifestyle] = Field(default_factory=Lifestyle)
    voter: Optional[Voter] = Field(default_factory=Voter)
