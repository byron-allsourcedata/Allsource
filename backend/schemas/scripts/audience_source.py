import re
from decimal import Decimal
from typing import List, Optional, Union, Literal

from pydantic import BaseModel


class PersonEntry(BaseModel):
    id: str
    email: str
    asid: str
    sum_amount: float
    count: int
    recency: float


class MatchedPerson(BaseModel):
    orders_amount: Decimal | None
    orders_count: int
    start_date: str | None
    enrichment_user_asid: str | None
    email: str | None


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
    asid: Optional[str] = ""
    sale_amount: Optional[str] = "0.0"
    user_id: Optional[int] = None
    lead_id: Optional[int] = None
    status: Optional[str] = None

    def get_sale_amount(self) -> Decimal:
        if not self.sale_amount:
            return Decimal("0.0")

        cleaned = re.sub(r"[^\d.]", "", self.sale_amount)

        try:
            return Decimal(cleaned)
        except (ValueError, ArithmeticError):
            return Decimal("0.0")


class DataBodyFromSource(BaseModel):
    persons: List[PersonRow]
    source_id: str
    user_id: int


class MessageBody(BaseModel):
    type: str
    data: Union[DataBodyFromSource, DataBodyNormalize]
    status: Optional[str] = None
