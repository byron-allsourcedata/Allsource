from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DomainScheme(BaseModel):
    domain: str

class PartnersAssetResponse(BaseModel):
    id: int
    title: str
    type: str
    preview_url: str
    file_url: str
    file_extension: str
    file_size: str

class PartnersResponse(BaseModel):
    id: int
    partner_name: str
    email: str
    join_date: Optional[datetime] = None
    commission: int
    subscription: str
    sources: Optional[str] = None
    last_payment_date: Optional[datetime] = None
    status: str

class PartnerCreateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    company_name: Optional[str] = None
    commission: str
    isMaster: Optional[bool] = False

class PartnerUpdateRequest(BaseModel):
    message: Optional[str] = None
    status: Optional[str] = None
    commission: Optional[str] = None

class PartnerUserData(BaseModel):
    subscription: Optional[str] = None
    payment_date: Optional[datetime] = None