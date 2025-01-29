from pydantic import BaseModel, Field
from typing import Optional
from schemas.users import ShopifyPayloadModel, UtmParams

class AuthGoogleData(BaseModel):
    token: str
    is_with_card: bool = Field(default=False)
    teams_token: Optional[str] = None
    referral_token: Optional[str] = None
    spi: Optional[str] = None
    awc: Optional[str] = None
    pft: Optional[str] = None
    shopify_data: Optional[ShopifyPayloadModel] = None
    coupon: Optional[str] = None
    ift: Optional[str] = None
    ftd: Optional[str] = None
    referral: Optional[str] = None
    shop_hash: Optional[str] = None
    utm_params: Optional[UtmParams] = None
    source_platform:Optional[str] = None

    
