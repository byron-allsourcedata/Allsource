from typing import List

from pydantic import BaseModel


class LeadsRequest(BaseModel):
    leads_ids: List[str] = None


class ChargeCreditInfo(BaseModel):
    five_x_five_id: int
