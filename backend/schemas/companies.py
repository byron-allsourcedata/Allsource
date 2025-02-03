from typing import List

from pydantic import BaseModel


class CompaniesRequest(BaseModel):
    companies_ids: List[int] = None
