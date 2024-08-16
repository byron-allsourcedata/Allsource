from pydantic import BaseModel, EmailStr
from typing import Optional


class IntegrationCreditional(BaseModel):
    shop_domain: str
    access_token: str


class Customer(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    mobile_phone: Optional[str]
    company_address: Optional[str]
    company_city: Optional[str]
    company_state: Optional[str]
    company_zip: Optional[str]
    business_email: Optional[EmailStr]
    time_spent: Optional[float]
    no_of_visits: Optional[int]
    no_of_page_visits: Optional[int]
    company_name: Optional[str]
    company_phone: Optional[str]
    company_revenue: Optional[float]
    company_employee_count: Optional[int]
