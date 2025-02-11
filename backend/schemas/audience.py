from typing import List, Optional

from pydantic import BaseModel

from enums import AudienceInfoEnum

class AudienceRequest(BaseModel):
    data_source: str
    audience_type: str
    audience_threshold: int
