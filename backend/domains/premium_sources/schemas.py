from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel


PremiumSourceStatus = Literal["ready", "syncing", "synced", "failed"]


class PremiumSourceDto(BaseModel):
    id: UUID
    name: str
    user_id: int
    price: int
    rows: int
    status: PremiumSourceStatus
    created_at: datetime


class NewPremiumSource(BaseModel):
    name: str
    size: int
    rows: int
    aws_key: str


class UserPremiumSourcesDto(BaseModel):
    user_name: str
    premium_sources: list[PremiumSourceDto]
