from datetime import datetime
from typing import Dict

from pydantic import BaseModel


class Personal(BaseModel):
    gender: Dict[str, int]
    location: Dict[str, int]
    religion: Dict[str, int]
    home_status: Dict[str, int]
    age: Dict[str, int]
    ethnicity: Dict[str, int]
    language: Dict[str, int]
    marital_status: Dict[str, int]
    have_children: Dict[str, int]
    children_ages: Dict[str, int]
    pets: Dict[str, int]
    education_level: Dict[str, int]

class Financial(BaseModel):
    income_range: Dict[str, int]
    credit_score_range: Dict[str, int]
    credit_cards: Dict[str, int]
    net_worth_range: Dict[str, int]
    bank_card: Dict[str, int]
    mail_order_donor: Dict[str, int]
    credit_card_premium: Dict[str, int]
    credit_card_new_issue: Dict[str, int]
    donor: Dict[str, int]
    credit_range_of_new_credit: Dict[str, int]
    investor: Dict[str, int]
    number_of_credit_lines: Dict[str, int]

class Lifestyle(BaseModel):
    own_pets: Dict[str, int]
    cooking_interest: Dict[str, int]
    travel_interest: Dict[str, int]
    mail_order_buyer: Dict[str, int]
    online_purchaser: Dict[str, int]
    book_reader: Dict[str, int]
    health_and_beauty_interest: Dict[str, int]
    fitness_interest: Dict[str, int]
    outdoor_interest: Dict[str, int]
    tech_interest: Dict[str, int]
    diy_interest: Dict[str, int]
    automotive: Dict[str, int]
    smoker: Dict[str, int]
    golf_interest: Dict[str, int]
    beauty_cosmetic_interest: Dict[str, int]

class Voter(BaseModel):
    congressional_district: Dict[str, int]
    voting_propensity: Dict[str, int]
    political_party: Dict[str, int]

class InsightsByCategory(BaseModel):
    personal_profile: Personal
    financial: Financial
    lifestyle: Lifestyle
    voter: Voter
