from typing import List

from pydantic import BaseModel


class LeadsRequest(BaseModel):
    leads_ids: List[int] = None
