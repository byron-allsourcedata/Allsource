from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel

PremiumSyncStatus = Literal["ready", "syncing", "synced", "disabled", "failed"]


class PremiumSyncSchema(BaseModel):
    name: str
    created_by: str
    created_at: datetime
    last_sync: datetime
    sync_platform: str
    rows: int
    records_synced: int
    progress: int
    status: PremiumSyncStatus


class CreateGoogleAdsPremiumSyncRequest(BaseModel):
    premium_source_id: UUID
    user_integration_id: int
    customer_id: str
    list_id: str
    list_name: str


class MetaCampaign(BaseModel):
    bid_amount: str
    campaign_id: str
    campaign_name: str


class CreateMetaPremiumSyncRequest(BaseModel):
    customer_id: str
    list_id: str
    list_name: str
    campaign: MetaCampaign


class UnprocessedPremiumSourceRow(BaseModel):
    row_id: int
    sha256_email: str


class PremiumRowIdsBatch(BaseModel):
    premium_source_id: UUID
    premium_source_sync_id: UUID
    row_ids: list[int]


class UnprocessedPremiumSourceBatch(BaseModel):
    premium_source_id: UUID
    premium_source_sync_id: UUID
    rows: list[UnprocessedPremiumSourceRow]

    def to_row_ids_batch(self) -> PremiumRowIdsBatch:
        return PremiumRowIdsBatch(
            premium_source_id=self.premium_source_id,
            premium_source_sync_id=self.premium_source_sync_id,
            row_ids=[row.row_id for row in self.rows],
        )
