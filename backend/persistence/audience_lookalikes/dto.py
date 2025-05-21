from datetime import datetime

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
    lookalike: Lookalike
    name: str
    source_type: str
    full_name: str
    source_origin: str
    domain: str
    target_schema: str


class CreatedLookalike(BaseModel):
    pass
    # return {
    #     "id": lookalike.id,
    #     "name": lookalike.name,
    #     "source": sources.source,
    #     "source_type": sources.type,
    #     "size": lookalike.size,
    #     "size_progress": lookalike.processed_size,
    #     "train_model_size": lookalike.train_model_size,
    #     "processed_train_model_size": lookalike.processed_train_model_size,
    #     "lookalike_size": lookalike.lookalike_size,
    #     "created_date": lookalike.created_date,
    #     "created_by": created_by,
    # }