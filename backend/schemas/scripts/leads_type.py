from typing import Optional

from pydantic import BaseModel


class BaseLead(BaseModel):
    email: Optional[str] = "example@example.com"
    first_name: Optional[str] = "example first name"
    last_name: Optional[str] = "example last name"
    phone_number: Optional[str] = "12345678901"

class CustomerConversions(BaseLead):
    transaction_date: Optional[str] = ""
    order_amount: Optional[float] = 0.00

class FailedLeads(BaseLead):
    lead_date: Optional[str] = ""

class Interest(BaseLead):
    interest_date: Optional[str] = ""