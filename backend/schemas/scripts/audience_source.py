from typing import List, Optional, Union

from pydantic import BaseModel


class PersonEntry(BaseModel):
    id: str
    email: str
    sum_amount: float
    count: int
    recency: float

class DataForNormalize(BaseModel):
    matched_size: int
    all_size: int
    min_amount: Optional[float] = 0
    max_amount: Optional[float] = 1
    min_count: Optional[int] = 0
    max_count: Optional[int] = 1
    min_start_date: Optional[str] = None
    max_start_date: Optional[str] = None
    min_recency: Optional[float] = 0
    max_recency: Optional[float] = 1


class DataBodyNormalize(BaseModel):
    persons: List[PersonEntry]
    source_id: str
    data_for_normalize: DataForNormalize


class PersonRow(BaseModel):
    email: Optional[str] = ""
    date: Optional[str] = ""
    sale_amount: Optional[float] = 0.0
    user_id: Optional[int] = None
    status: Optional[str] = None


class DataBodyFromSource(BaseModel):
    persons: List[PersonRow]
    source_id: str
    user_id: int

class MessageBody(BaseModel):
    type: str
    data: Union[DataBodyFromSource, DataBodyNormalize]
    status: Optional[str] = None
