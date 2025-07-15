from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, model_validator
from datetime import datetime
from schemas.mapping.audience_insights_mapping import (
    YES_NO_UNKNOWN_MAPS,
)


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
    def _map_keys(
        data: Dict[str, int], key_map: Dict[str, str]
    ) -> Dict[str, int]:
        return {key_map.get(k, k): v for k, v in data.items()}

    @staticmethod
    def _to_percent(data: Dict[str, int]) -> Dict[str, float]:
        def is_unknown(key: str) -> bool:
            lowered = key.lower()
            return "unknown" in lowered or lowered in {
                "u",
                "ux",
                "u1",
                "u2",
                "u9",
                "u0",
                "uv",
                "um",
                "unspecified",
                "undeclared",
                "undisclosed",
            }

        # filtered_data = {k: v for k, v in data.items() if not is_unknown(k)}
        filtered_data = data.copy()
        total = sum(filtered_data.values())
        if total == 0:
            return {k: 0.0 for k in filtered_data}
        return {k: round(v / total * 100, 2) for k, v in filtered_data.items()}

    @model_validator(mode="after")
    def calculate_percentages(self) -> "PersonalProfiles":
        values = self.model_dump()

        for key, val in values.items():
            if not isinstance(val, dict):
                continue

            if key in YES_NO_UNKNOWN_MAPS:
                mapped = {
                    YES_NO_UNKNOWN_MAPS[key].get(k, k): v
                    for k, v in val.items()
                }
                total = sum(mapped.values())
                setattr(
                    self,
                    key,
                    {k: round(v / total * 100, 2) for k, v in mapped.items()}
                    if total
                    else {k: 0.0 for k in mapped},
                )
            elif key == "gender":
                filtered = {k: v for k, v in val.items() if k != "2"}
                total = sum(filtered.values())
                if total == 0:
                    setattr(self, key, {k: 0.0 for k in filtered})
                else:
                    percent = {
                        k: round(v / total * 100, 2)
                        for k, v in filtered.items()
                    }
                    setattr(self, key, percent)
            else:
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
        def is_unknown(key: str) -> bool:
            lowered = key.lower()
            return "unknown" in lowered or lowered in {
                "u",
                "ux",
                "u1",
                "u2",
                "u9",
                "u0",
                "uv",
                "um",
                "unspecified",
                "undeclared",
                "undisclosed",
            }

        # filtered_data = {k: v for k, v in data.items() if not is_unknown(k)}
        filtered_data = data.copy()
        total = sum(filtered_data.values())
        if total == 0:
            return {k: 0.0 for k in filtered_data}
        return {k: round(v / total * 100, 2) for k, v in filtered_data.items()}

    @staticmethod
    def _map_data(data: dict[str, str], map_dict: dict) -> dict:
        return {data.get(k, k): v for k, v in map_dict.items()}

    @model_validator(mode="after")
    def calculate_percentages(self) -> "FinancialProfiles":
        values = self.model_dump()

        for key, val in values.items():
            if not isinstance(val, dict):
                continue

            if key == "credit_cards":
                continue

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
        def is_unknown(key: str) -> bool:
            lowered = key.lower()
            return "unknown" in lowered or lowered in {
                "u",
                "ux",
                "u1",
                "u2",
                "u9",
                "u0",
                "uv",
                "um",
                "unspecified",
                "undeclared",
                "undisclosed",
            }

        # filtered_data = {k: v for k, v in data.items() if not is_unknown(k)}
        filtered_data = data.copy()
        total = sum(filtered_data.values())
        if total == 0:
            return {k: 0.0 for k in filtered_data}
        return {k: round(v / total * 100, 2) for k, v in filtered_data.items()}

    @model_validator(mode="after")
    def calculate_percentages(self) -> "LifestyleProfiles":
        values = self.model_dump()

        special_null_fields = {"online_purchaser", "travel_interest", "smoker"}
        for key, val in values.items():
            if not isinstance(val, dict):
                continue

            if key in special_null_fields:
                normalized_val: Dict[str, int] = {}
                for k, v in val.items():
                    if k is None or k.lower() == "unknown":
                        normalized_val["false"] = (
                            normalized_val.get("False", 0) + v
                        )
                    else:
                        normalized_val[k] = normalized_val.get(k, 0) + v
                val = normalized_val

            setattr(self, key, self._to_percent(val))
        return self


class VoterProfiles(BaseModel):
    congressional_district: Dict[str, float] = {}
    voting_propensity: Dict[str, float] = {}
    political_party: Dict[str, float] = {}

    @staticmethod
    def _to_percent(data: Dict[str, int]) -> Dict[str, float]:
        def is_unknown(key: str) -> bool:
            lowered = key.lower()
            return "unknown" in lowered or lowered in {
                "u",
                "ux",
                "u1",
                "u2",
                "u9",
                "u0",
                "uv",
                "um",
                "unspecified",
                "undeclared",
                "undisclosed",
            }

        # filtered_data = {k: v for k, v in data.items() if not is_unknown(k)}
        filtered_data = data.copy()
        total = sum(filtered_data.values())
        if total == 0:
            return {k: 0.0 for k in filtered_data}
        return {k: round(v / total * 100, 2) for k, v in filtered_data.items()}

    @model_validator(mode="after")
    def calculate_percentages(self) -> "VoterProfiles":
        values = self.model_dump()

        for key, val in values.items():
            if not isinstance(val, dict):
                continue

            # if (
            #     key in ("congressional_district", "political_party")
            #     and "unknown" in val
            # ):
            #     val.pop("unknown")

            setattr(self, key, self._to_percent(val))

        return self


class B2CInsight(BaseModel):
    personal_info: PersonalProfiles
    financial: FinancialProfiles
    lifestyle: LifestyleProfiles
    voter: VoterProfiles


class ProfessionalProfiles(BaseModel):
    current_job_title: Dict[str, float] = {}
    job_location: Dict[str, float] = {}
    job_level: Dict[str, float] = {}
    primary_industry: Dict[str, float] = {}
    current_company_name: Dict[str, float] = {}
    job_start_date: Dict[str, float] = {}
    company_size: Dict[str, float] = {}
    annual_sales: Dict[str, float] = {}
    department: Dict[str, float] = {}
    job_duration: Dict[str, float] = {}

    @staticmethod
    def _to_percent(data: Dict[str, int]) -> Dict[str, float]:
        def is_unknown(key: str) -> bool:
            lowered = key.lower()
            return "unknown" in lowered or lowered in {
                "u",
                "ux",
                "u1",
                "u2",
                "u9",
                "u0",
                "uv",
                "um",
                "unspecified",
                "undeclared",
                "undisclosed",
            }

        # filtered_data = {k: v for k, v in data.items() if not is_unknown(k)}
        filtered_data = data.copy()
        total = sum(filtered_data.values())
        if total == 0:
            return {k: 0.0 for k in filtered_data}
        return {k: round(v / total * 100, 2) for k, v in filtered_data.items()}

    @model_validator(mode="after")
    def calculate_percentages(self) -> "ProfessionalProfiles":
        values = self.model_dump()

        for key, val in values.items():
            if not isinstance(val, dict):
                continue

            # if "unknown" in val:
            #     val.pop("unknown")

            setattr(self, key, self._to_percent(val))

        return self


class EmploymentHistoryProfiles(BaseModel):
    job_location: Dict[str, float] = {}
    number_of_jobs: Dict[str, float] = {}
    company_name: Dict[str, float] = {}
    job_tenure: Dict[str, float] = {}
    job_title: Dict[str, float] = {}

    @staticmethod
    def _to_percent(data: Dict[str, int]) -> Dict[str, float]:
        def is_unknown(key: str) -> bool:
            lowered = key.lower()
            return "unknown" in lowered or lowered in {
                "u",
                "ux",
                "u1",
                "u2",
                "u9",
                "u0",
                "uv",
                "um",
                "unspecified",
                "undeclared",
                "undisclosed",
            }

        # filtered_data = {k: v for k, v in data.items() if not is_unknown(k)}
        filtered_data = data.copy()
        total = sum(filtered_data.values())
        if total == 0:
            return {k: 0.0 for k in filtered_data}
        return {k: round(v / total * 100, 2) for k, v in filtered_data.items()}

    @model_validator(mode="after")
    def calculate_percentages(self) -> "EmploymentHistoryProfiles":
        values = self.model_dump()

        for key, val in values.items():
            if not isinstance(val, dict):
                continue

            setattr(self, key, self._to_percent(val))

        return self


class EducationProfiles(BaseModel):
    degree: Optional[Dict[str, float]] = Field(default_factory=dict)
    institution_name: Optional[Dict[str, float]] = Field(default_factory=dict)
    education_start_date: Optional[Dict[str, float]] = Field(
        default_factory=dict
    )
    education_end_date: Optional[Dict[str, float]] = Field(default_factory=dict)
    education_description: Optional[Dict[str, float]] = Field(
        default_factory=dict
    )
    post_graduation_time: Optional[Dict[str, float]] = Field(
        default_factory=dict
    )

    @staticmethod
    def _to_percent(data: Dict[str, int]) -> Dict[str, float]:
        # TODO
        filtered_data = data.copy()
        total = sum(filtered_data.values())

        if total == 0:
            return {k: 0.0 for k in filtered_data}

        return {k: round(v / total * 100, 2) for k, v in filtered_data.items()}

    def _calculate_post_graduation_time(self) -> Dict[int | None, int]:
        def is_valid_date(date_str: str, date_format: str = "%Y-%m-%d") -> bool:
            try:
                datetime.strptime(date_str, date_format)
                return True
            except ValueError:
                return False

        date_format = "%Y-%m-%d"
        today = datetime.today()

        post_graduation_time: Dict[int | None, int] = {}
        post_graduation_time[None] = 0

        for raw_date in self.education_end_date:
            if is_valid_date(raw_date, date_format):
                graduated_date = datetime.strptime(raw_date, date_format)

                if graduated_date <= today:
                    years = int((today - graduated_date).days / 365.25)

                    if years not in post_graduation_time:
                        post_graduation_time[years] = 1
                    else:
                        post_graduation_time[years] += 1
            else:
                post_graduation_time[None] += 1  # if date in invalid format

        return post_graduation_time

    def _dates_to_bins(self) -> Dict[str, int]:
        bins = {
            "Under year": 0,
            "1 - 3 years": 0,
            "3 - 5 years": 0,
            "5 - 10 years": 0,
            "More than 10 years": 0,
            "unknown": 0,
        }

        post_graduation_time = self._calculate_post_graduation_time()

        for years in post_graduation_time:
            if years is None:
                bins["unknown"] += 1
            elif years < 1:
                bins["Under year"] += 1
            elif 1 <= years < 3:
                bins["1 - 3 years"] += 1
            elif 3 <= years < 5:
                bins["3 - 5 years"] += 1
            elif 5 <= years < 10:
                bins["5 - 10 years"] += 1
            elif 10 <= years:
                bins["More than 10 years"] += 1
            else:
                bins["unknown"] += 1

        return bins

    @model_validator(mode="after")
    def calculate_percentages(self) -> "EducationProfiles":
        values = self.model_dump()

        for key, val in values.items():
            if not isinstance(val, dict):
                continue
            setattr(self, key, self._to_percent(val))

        bins = self._dates_to_bins()
        percent_bins = self._to_percent(bins)
        setattr(self, "post_graduation_time", percent_bins)

        return self


class B2BInsight(BaseModel):
    professional_profile: ProfessionalProfiles
    education_history: EducationProfiles
    employment_history: EmploymentHistoryProfiles


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
    credit_cards: Optional[Dict[str, float]] = Field(default_factory=dict)
    net_worth_range: Optional[Dict[str, int]] = Field(default_factory=dict)
    bank_card: Optional[Dict[str, int]] = Field(default_factory=dict)
    mail_order_donor: Optional[Dict[str, int]] = Field(default_factory=dict)
    credit_card_premium: Optional[Dict[str, int]] = Field(default_factory=dict)
    credit_card_new_issue: Optional[Dict[str, int]] = Field(
        default_factory=dict
    )
    donor: Optional[Dict[str, int]] = Field(default_factory=dict)
    credit_range_of_new_credit: Optional[Dict[str, int]] = Field(
        default_factory=dict
    )
    investor: Optional[Dict[str, int]] = Field(default_factory=dict)
    number_of_credit_lines: Optional[Dict[str, int]] = Field(
        default_factory=dict
    )


class Lifestyle(BaseModel):
    own_pets: Optional[Dict[str, int]] = Field(default_factory=dict)
    cooking_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    travel_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    mail_order_buyer: Optional[Dict[str, int]] = Field(default_factory=dict)
    online_purchaser: Optional[Dict[str, int]] = Field(default_factory=dict)
    book_reader: Optional[Dict[str, int]] = Field(default_factory=dict)
    health_and_beauty_interest: Optional[Dict[str, int]] = Field(
        default_factory=dict
    )
    fitness_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    outdoor_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    tech_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    diy_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    automotive: Optional[Dict[str, int]] = Field(default_factory=dict)
    smoker: Optional[Dict[str, int]] = Field(default_factory=dict)
    golf_interest: Optional[Dict[str, int]] = Field(default_factory=dict)
    beauty_cosmetic_interest: Optional[Dict[str, int]] = Field(
        default_factory=dict
    )


class Voter(BaseModel):
    congressional_district: Optional[Dict[str, int]] = Field(
        default_factory=dict
    )
    voting_propensity: Optional[Dict[str, int]] = Field(default_factory=dict)
    political_party: Optional[Dict[str, int]] = Field(default_factory=dict)


class EmploymentHistory(BaseModel):
    job_title: Optional[Dict[str, int]] = Field(default_factory=dict)
    company_name: Optional[Dict[str, int]] = Field(default_factory=dict)
    start_date: Optional[Dict[str, int]] = Field(default_factory=dict)
    end_date: Optional[Dict[str, int]] = Field(default_factory=dict)
    is_current: Optional[Dict[str, int]] = Field(default_factory=dict)
    job_location: Optional[Dict[str, int]] = Field(default_factory=dict)
    job_description: Optional[Dict[str, int]] = Field(default_factory=dict)
    job_tenure: Optional[Dict[str, int]] = Field(default_factory=dict)
    number_of_jobs: Optional[Dict[str, float]] = Field(default_factory=dict)


class EducationProfile(BaseModel):
    degree: Optional[Dict[str, int]] = Field(default_factory=dict)
    institution_name: Optional[Dict[str, int]] = Field(default_factory=dict)
    education_start_date: Optional[Dict[str, int]] = Field(default_factory=dict)
    education_end_date: Optional[Dict[str, int]] = Field(default_factory=dict)
    education_description: Optional[Dict[str, int]] = Field(
        default_factory=dict
    )


class ProfessionalProfile(BaseModel):
    current_job_title: Optional[Dict[str, int]] = Field(default_factory=dict)
    current_company_name: Optional[Dict[str, int]] = Field(default_factory=dict)
    job_start_date: Optional[Dict[str, int]] = Field(default_factory=dict)
    job_duration: Optional[Dict[str, int]] = Field(default_factory=dict)
    job_location: Optional[Dict[str, int]] = Field(default_factory=dict)
    job_level: Optional[Dict[str, int]] = Field(default_factory=dict)
    department: Optional[Dict[str, int]] = Field(default_factory=dict)
    company_size: Optional[Dict[str, int]] = Field(default_factory=dict)
    primary_industry: Optional[Dict[str, int]] = Field(default_factory=dict)
    annual_sales: Optional[Dict[str, int]] = Field(default_factory=dict)


class InsightsByCategory(BaseModel):
    personal_profile: Optional[Personal] = Field(default_factory=Personal)
    financial: Optional[Financial] = Field(default_factory=Financial)
    lifestyle: Optional[Lifestyle] = Field(default_factory=Lifestyle)
    voter: Optional[Voter] = Field(default_factory=Voter)
    employment_history: Optional[EmploymentHistory] = Field(
        default_factory=EmploymentHistory
    )
    professional_profile: Optional[ProfessionalProfile] = Field(
        default_factory=ProfessionalProfile
    )
    education_history: Optional[EducationProfile] = Field(
        default_factory=EducationProfile
    )
