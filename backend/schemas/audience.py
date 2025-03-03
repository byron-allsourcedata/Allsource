from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class AudienceRequest(BaseModel):
    data_source: str
    audience_type: str
    audience_threshold: int
    
class HeadingSubstitutionRequest(BaseModel):
    headings: List[str]

class Row(BaseModel):
    type: str
    value: str

class NewSource(BaseModel):
    source_type: str
    source_origin: str
    source_name: str
    file_url: str
    rows: List[Row]

class AudienceResponse(BaseModel):
    id: int
    domain_id: int
    data_source: str
    audience_type: str
    audience_threshold: int
    status: str
    created_at: datetime
    exported_on: Optional[datetime] = None

