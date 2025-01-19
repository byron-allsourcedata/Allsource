from pydantic import BaseModel
from typing import Optional

class PayoutsPartnerRequest(BaseModel):
    text: Optional[str] = None
    confirmation_status: str
    