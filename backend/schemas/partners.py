from pydantic import BaseModel
from typing import Optional, Union, List
from datetime import datetime

class ErrorResponse(BaseModel):
    code: int
    message: str
    
class PartnersResponse(BaseModel):
    id: int
    partner_name: str
    email: str
    isMaster: Optional[bool] = False
    join_date: Optional[datetime] = None
    commission: int
    subscription: str
    sources: Optional[str] = None
    last_payment_date: Optional[datetime] = None
    status: str
    count: Optional[int] = None
    reward_amount: Optional[str] = None
    reward_status: Optional[str] = None
    reward_payout_date: Optional[str] = None
    isActive: bool = False

class PartnersObjectResponse(BaseModel):
    status: bool
    error: Optional[ErrorResponse] = None
    message: Optional[str] = None
    data: Optional[Union[List[PartnersResponse], PartnersResponse]] = None

class PartnerCreateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    company_name: Optional[str] = None
    commission: str
    is_master: Optional[bool] = False
    masterId: Optional[int] = None

class OpportunityStatus(BaseModel):
    status: bool
    message: Optional[str] = None

class PartnerUpdateRequest(BaseModel):    
    commission: int
    name: str
    company_name: str

class PartnerUserData(BaseModel):
    subscription: Optional[str] = None
    payment_date: Optional[datetime] = None
    sources: Optional[str] = None