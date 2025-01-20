from pydantic import BaseModel
from typing import Optional
from typing import List

class PayoutsPartnerRequest(BaseModel):
    text: Optional[str] = None
    confirmation_status: str
    
class PayoutHistory(BaseModel):
    year_month: str
    total_revenue: float
    total_reward_amount: float
    total_rewards_paid: float

class PayoutHistoryResponse(BaseModel):
    history_list: List[PayoutHistory]
    total_count: int
    max_page: int