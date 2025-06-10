from decimal import Decimal

from pydantic import BaseModel


class Stats(BaseModel):
    min_recency: Decimal
    max_recency: Decimal
    min_inv: Decimal
    max_inv: Decimal