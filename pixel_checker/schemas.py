from pydantic import BaseModel
from typing import List

class DomainsListResponse(BaseModel):
    domains: List[str]
