from pydantic import BaseModel, Field
from typing import Optional

class ShopifyPayloadModel(BaseModel):
    code: Optional[str] = None
    hmac: Optional[str] = None
    host: Optional[str] = None
    shop: Optional[str] = None
    state: Optional[str] = None
    timestamp: Optional[str] = None
    
class UtmParams(BaseModel):
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None

class AuthGoogleData(BaseModel):
    token: str
    is_with_card: bool = Field(default=False)
    teams_token: Optional[str] = None
    spi: Optional[str] = None
    awc: Optional[str] = None
    shopify_data: Optional[ShopifyPayloadModel] = None
    coupon: Optional[str] = None
    ift: Optional[str] = None
    utm_params: Optional[UtmParams] = None

    
