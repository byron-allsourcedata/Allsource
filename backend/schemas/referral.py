from pydantic import BaseModel, Field
from typing import Optional
from typing import List

class OverviewResponse(BaseModel):
    connected_stripe_account_id: Optional[str] = Field(None)
    is_stripe_connected: Optional[bool] = Field(None)
    
class ReferralDetailsResponse(BaseModel):
    discount_codes: Optional[List[dict]] = None
    referral_code: str

