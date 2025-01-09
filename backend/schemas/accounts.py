from pydantic import BaseModel
from typing import Optional, Union, List

class ErrorResponse(BaseModel):
    code: int
    message: str

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

class AccountsObjectResponse(BaseModel):
    status: bool
    error: Optional[ErrorResponse] = None
    data: Optional[Union[List[AccountResponse], AccountResponse]] = None