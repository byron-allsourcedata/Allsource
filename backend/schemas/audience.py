from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

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
    id: UUID
    domain_id: int
    data_source: str
    audience_type: str
    audience_threshold: int
    status: str
    created_at: datetime
    exported_on: Optional[datetime] = None

class SourceResponse(BaseModel):
    id: UUID
    source_name: str
    source_origin: str
    source_type: str
    created_date: datetime
    created_by: str
    updated_date: datetime
    total_records: Optional[int] = None
    matched_records: int
    matched_records_status: str

    model_config = {
        "from_attributes": True
    }


class SourcesObjectResponse(BaseModel):
    source_list: List[SourceResponse]
    count: int