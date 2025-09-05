from pydantic import BaseModel
from typing import Optional, Union, List
from datetime import datetime


class ErrorResponse(BaseModel):
    code: int
    message: str


class MonthlyCommission(BaseModel):
    title: str
    percentage: int
    revenue: float


class PartnerResponse(BaseModel):
    id: int
    is_master: bool = False
    commission: int
    monthly_comissions: list[MonthlyCommission]


class PartnersResponse(BaseModel):
    id: int
    partner_name: str
    email: str
    isMaster: Optional[bool] = False
    join_date: Optional[datetime] = None
    commission: int
    subscription: Optional[str] = None
    sources: Optional[str] = None
    last_payment_date: Optional[datetime] = None
    status: str
    count: Optional[int] = None
    reward_amount: Optional[float] = None
    reward_status: Optional[str] = None
    reward_payout_date: Optional[datetime] = None
    whitelabel_settings_enabled: Optional[bool] = False
    isActive: bool = False


class PartnersObjectResponse(BaseModel):
    status: Optional[bool] = False
    error: Optional[ErrorResponse] = None
    message: Optional[str] = None
    data: Optional[Union[List[PartnersResponse], PartnersResponse]] = None


class PartnerCreateRequest(BaseModel):
    name: str
    email: str
    commission: int
    is_master: Optional[bool] = False
    master_id: Optional[int] = None


class OpportunityStatus(BaseModel):
    status: bool
    message: Optional[str] = None


class PartnerUpdateRequest(BaseModel):
    commission: int
    name: str


class PartnerUserData(BaseModel):
    subscription: Optional[str] = None
    payment_date: Optional[datetime] = None
    sources: Optional[str] = None


class PromoteUserRequest(BaseModel):
    user_id: int
    commission: int
    is_master: Optional[bool] = False
