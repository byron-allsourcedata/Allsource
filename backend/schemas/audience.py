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
    domain_id: int
    file_url: Optional[str] = None
    rows: Optional[List[Row]] = None
    domain_id: Optional[int] = None


class AudienceResponse(BaseModel):
    id: UUID
    domain_id: int
    data_source: str
    audience_type: str
    audience_threshold: int
    status: str
    created_at: datetime
    exported_on: Optional[datetime] = None

class DomainsSourceResponse(BaseModel):
    domains: List[str]
    has_more: bool

class DomainsLeads(BaseModel):
    id: int
    name: str
    pixel_installed: bool
    converted_sales_count: int
    viewed_product_count: int
    visitor_count: int
    abandoned_cart_count: int
    total_count: int

class SourceResponse(BaseModel):
    id: UUID
    name: str
    source_origin: str
    source_type: str
    created_at: datetime
    created_by: str
    domain: Optional[str] = None
    total_records: Optional[int] = None
    matched_records: int
    matched_records_status: str
    processed_records: int

    model_config = {
        "from_attributes": True
    }

class SmartsResponse(BaseModel):
    id: UUID
    name: str
    use_case_alias: str
    created_by: str
    created_at: datetime
    total_records: int
    validated_records: int
    active_segment_records: int
    status: str

    model_config = {
        "from_attributes": True
    }

class SourcesObjectResponse(BaseModel):
    source_list: List[SourceResponse]
    count: int

class SmartsAudienceObjectResponse(BaseModel):
    audience_smarts_list: List[SmartsResponse]
    count: int

class UpdateSmartAudienceRequest(BaseModel):
    new_name: str