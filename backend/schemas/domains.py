from pydantic import BaseModel
from typing import Optional


class DomainScheme(BaseModel):
    domain: str


class DomainResponse(BaseModel):
    id: int
    domain: str
    data_provider_id: Optional[str] = None
    is_pixel_installed: bool
    enable: bool
    is_view_product_installed: bool
    is_add_to_cart_installed: bool
    is_converted_sales_installed: bool


class UpdateDomain(BaseModel):
    new_domain: str


class UpdateDomainRequest(BaseModel):
    domain_name: str
