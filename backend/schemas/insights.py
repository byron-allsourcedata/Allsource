from typing import Dict, Optional
from pydantic import BaseModel, Field

class Personal(BaseModel):
    gender: Optional[Dict[str, int]] = Field(default_factory=dict)
    location: Optional[Dict[str, int]] = Field(default_factory=dict)
    religion: Optional[Dict[str, int]] = Field(default_factory=dict)
    home_status: Optional[Dict[str, int]] = Field(default_factory=dict)
    age: Optional[Dict[str, int]] = Field(default_factory=dict)
    ethnicity: Optional[Dict[str, int]] = Field(default_factory=dict)
    language: Optional[Dict[str, int]] = Field(default_factory=dict)
    marital_status: Optional[Dict[str, int]] = Field(default_factory=dict)
    have_children: Optional[Dict[str, int]] = Field(default_factory=dict)
    children_ages: Optional[Dict[str, int]] = Field(default_factory=dict)
    pets: Optional[Dict[str, int]] = Field(default_factory=dict)
    education_level: Optional[Dict[str, int]] = Field(default_factory=dict)

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
