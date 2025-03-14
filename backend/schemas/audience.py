from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from enums import LeadStatus
from uuid import UUID

class AudienceRequest(BaseModel):
    data_source: str
    audience_type: str
    audience_threshold: int
    
class HeadingSubstitutionRequest(BaseModel):
    source_type: str
    headings: List[str]

class Row(BaseModel):
    type: str
    value: str

class SourceIDs(BaseModel):
    sources_ids: List[str]

class NewSource(BaseModel):
    source_type: str
    source_origin: str
    source_name: str
    file_url: str
    rows: List[Row]
    type: str
    domain_id: int
    statuses: Optional[List[str]] = [LeadStatus.VISITOR.value]

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
    name: str
    source_origin: str
    source_type: str
    created_at: datetime
    created_by: str
    updated_at: datetime
    total_records: Optional[int] = None
    matched_records: int
    matched_records_status: str

    model_config = {
        "from_attributes": True
    }


class SourcesObjectResponse(BaseModel):
    source_list: List[SourceResponse]
    count: int