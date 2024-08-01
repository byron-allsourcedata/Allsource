from typing import List

from pydantic import BaseModel

from enums import AudienceInfoEnum


class AudienceInfoResponse(BaseModel):
    status: AudienceInfoEnum


class AudienceRequest(BaseModel):
    leads_ids: List[int] = None
    audience_id: str = None
    new_audience_name: str = None
    remove_leads_ids: List[int] = None
