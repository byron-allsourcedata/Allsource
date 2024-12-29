from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DomainScheme(BaseModel):
    domain: str

class AccountResponse(BaseModel):
    id: int
    account_name: str
    email: str
    join_date: Optional[str] = None
    plan_amount: str
    reward_status: str
    reward_amount: Optional[str] = None
    reward_payout_date: Optional[str] = None
    last_payment_date: Optional[str] = None
    status: str