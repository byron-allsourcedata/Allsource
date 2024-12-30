from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enums import PartnersAssetsInfoEnum


class PartnersAssetResponse(BaseModel):
    id: int
    title: str
    type: str
    preview_url: Optional[str] = None
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
    last_payment_date: str
    status: str



class PartnersAssetsInfoResponse(BaseModel):
    status: PartnersAssetsInfoEnum
    data: Optional[Any] = None

