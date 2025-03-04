from typing import List

from pydantic import BaseModel


class LeadsRequest(BaseModel):
    leads_ids: List[int] = None

class ChargeCreditInfo(BaseModel):
    five_x_five_id: int

