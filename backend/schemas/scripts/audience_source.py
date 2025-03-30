from typing import List, Optional, Union

from pydantic import BaseModel


class PersonEntry(BaseModel):
    id: str
    email: str
    orders_amount: float
    orders_count: int
    recency: int

class DataForNormalize(BaseModel):
    matched_size: int
    all_size: int
    min_orders_amount: Optional[float] = 0
    max_orders_amount: Optional[float] = 1
    min_orders_count: Optional[int] = 0
    max_orders_count: Optional[int] = 1
    min_orders_date: Optional[str] = None
    max_orders_date: Optional[str] = None
    min_recency: Optional[float] = 0
    max_recency: Optional[float] = 1


class DataBodyNormalize(BaseModel):
    persons: List[PersonEntry]
    source_id: str
    data_for_normalize: DataForNormalize


class PersonRow(BaseModel):
    email: Optional[str] = ""
    transaction_date: Optional[str] = ""
    sale_amount: Optional[float] = 0.0
    user_id: Optional[int] = None


class DataBodyFromSource(BaseModel):
    persons: List[PersonRow]
    source_id: str
    user_id: int

class MessageBody(BaseModel):
    type: str
    data: Union[DataBodyFromSource, DataBodyNormalize]
