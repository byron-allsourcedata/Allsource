from typing import List, Optional, Dict
from pydantic import BaseModel, RootModel
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
    target_schema: str
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

class DataSource(BaseModel):
    name: str
    source_type: str
    size: int

class ValidationHistory(BaseModel):
    type_validation: str
    count_submited: int
    count_validated: int
    count_cost: int

class DataSourcesResponse(BaseModel):
    includes: List[DataSource]
    excludes: List[DataSource]

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
    target_schema: str
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
    processed_active_segment_records: int
    status: str
    integrations: Optional[List[str]]

    model_config = {
        "from_attributes": True
    }


class DataSource(BaseModel):
    include: List[str]
    exclude: List[str]


class DataSourcesFormat(BaseModel):
    lookalike_ids: DataSource
    source_ids: DataSource

class SourcesObjectResponse(BaseModel):
    source_list: List[SourceResponse]
    count: int

class SmartsAudienceObjectResponse(BaseModel):
    audience_smarts_list: List[SmartsResponse]
    count: int

class UpdateSmartAudienceRequest(BaseModel):
    new_name: str

class CreateSmartAudienceRequest(BaseModel):
    smart_audience_name: str
    use_case: str
    data_sources: List[dict]
    validation_params: Optional[dict] = None
    contacts_to_validate: Optional[int] = None
    is_validate_skip: Optional[bool] = None
    total_records: int
    active_segment_records: int
    target_schema: Optional[str] = None
