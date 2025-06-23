from typing import TypedDict, List, Optional, Literal
from datetime import date
from pydantic import BaseModel


class AdditionalPixel(BaseModel):
    is_view_product_installed: bool
    is_add_to_cart_installed: bool
    is_converted_sales_installed: bool


class SyncDict(BaseModel):
    createdDate: Optional[str]
    list_name: Optional[str]
    lastSync: Optional[str]
    platform: Optional[str]
    contacts: Optional[int]
    createdBy: Optional[str]
    status: Optional[str]
    syncStatus: Optional[bool]


class DailyLeadStat(BaseModel):
    date: date
    lead_count: int


class ManagementResult(BaseModel):
    id: int
    domain_name: str
    pixel_status: Optional[bool]
    additional_pixel: List[AdditionalPixel]
    resulutions: List[DailyLeadStat]
    data_syncs: List[SyncDict]


class EmailFormRequest(BaseModel):
    email: str
    type: Literal["view_product", "add_to_cart", "converted_sale"]
