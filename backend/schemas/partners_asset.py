from pydantic import BaseModel
from typing import Optional
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
    join_date: Optional[str] = None
    commission: int
    subscription: str
    sources: Optional[str] = None
    last_payment_date: str
    status: str

