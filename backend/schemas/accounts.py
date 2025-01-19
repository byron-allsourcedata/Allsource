from pydantic import BaseModel
from typing import Optional, Union, List
from datetime import datetime

class ErrorResponse(BaseModel):
    code: int
    message: str

class AccountResponse(BaseModel):
    id: int
    account_name: str
    email: str
    join_date: Optional[datetime] = None
    plan_amount: str
    reward_status: str
    reward_amount: Optional[str] = None
    reward_payout_date: Optional[datetime] = None 
    last_payment_date: Optional[datetime] = None
    status: str

class AccountsObjectResponse(BaseModel):
    items: Optional[List[AccountResponse]] = None
    totalCount: int

class AccountUserData(BaseModel):
    plan_amount: Optional[str] = None
    reward_amount: Optional[str] = None
    payment_date: Optional[datetime] = None