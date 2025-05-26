from datetime import datetime
from typing import Optional, Dict

from pydantic import BaseModel

from models import AudienceSource


class AudienceResult:
    pass


class SourceInfo(BaseModel):
    name: str
    target_schema: str
    source: str
    type: str
    created_date: datetime
    created_by: str
    number_of_customers: int
    matched_records: int
    matched_records_status: str


class Lookalike(BaseModel):
    pass

class LookalikeInfo(BaseModel):
    lookalike: Dict
    name: str
    source_type: str
    full_name: str
    source_origin: str
    domain: Optional[str]
    target_schema: str
