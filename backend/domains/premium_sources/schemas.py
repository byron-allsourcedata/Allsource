from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel


PremiumSourceStatus = Literal["ready", "locked", "syncing", "synced", "failed"]


class BasePremiumSourceDto(BaseModel):
    id: UUID
    name: str
    user_id: int
    price: int
    rows: int
    created_at: datetime
    source_type: str


class PremiumSourceDto(BasePremiumSourceDto):
    status: PremiumSourceStatus


class NewPremiumSource(BaseModel):
    name: str
    size: int
    rows: int
    aws_key: str


class UserPremiumSourcesDto(BaseModel):
    user_name: str
    premium_sources: list[PremiumSourceDto]
