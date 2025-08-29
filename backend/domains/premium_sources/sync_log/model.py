from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class PremiumSourceSyncLogRecord:
    premium_source_id: UUID
    premium_source_sync_id: UUID
    row_id: int
    synced: str
    error_message: str | None
    updated_at: datetime

    @classmethod
    def columns(cls) -> list[str]:
        return [
            "premium_source_id",
            "premium_source_sync_id",
            "row_id",
            "synced",
            "error_message",
            "updated_at",
        ]

    def tuple(self) -> tuple[UUID, UUID, int, str, str | None, datetime]:
        return (
            self.premium_source_id,
            self.premium_source_sync_id,
            self.row_id,
            self.synced,
            self.error_message,
            self.updated_at,
        )
