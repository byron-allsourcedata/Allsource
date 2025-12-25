from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    BigInteger,
    TIMESTAMP,
    VARCHAR,
    text,
    Boolean,
    ForeignKey,
    Index,
    event,
)
from sqlalchemy.dialects.postgresql import UUID

from .base import Base, update_timestamps


class DataSyncImportedLead(Base):
    __tablename__ = "data_sync_imported_leads"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    status = Column(VARCHAR(64), nullable=False)
    is_validation = Column(Boolean, nullable=False, server_default=text("true"))
    service_name = Column(VARCHAR(128), nullable=False)
    data_sync_id = Column(
        BigInteger,
        ForeignKey(
            "integrations_users_sync.id", ondelete="CASCADE", onupdate="CASCADE"
        ),
        nullable=False,
    )
    created_at = Column(
        TIMESTAMP,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )
    updated_at = Column(
        TIMESTAMP,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )
    # Legacy PG lead id (nullable for ClickHouse-sourced rows)
    lead_users_id = Column(
        BigInteger,
        nullable=True,
    )
    # ClickHouse lead UUID (v1)
    ch_lead_id = Column(UUID(as_uuid=True), nullable=True)

    __table_args__ = (
        Index(
            "data_sync_imported_leads_data_sync_id_status_idx",
            data_sync_id,
            status,
        ),
        Index(
            "data_sync_imported_leads_lead_users_id_data_sync_id_idx",
            lead_users_id,
            data_sync_id,
            unique=True,
        ),
        Index(
            "data_sync_imported_leads_is_validation_status_idx",
            is_validation,
            status,
            unique=False,
        ),
        Index(
            "data_sync_imported_leads_ch_lead_id_data_sync_id_idx",
            ch_lead_id,
            data_sync_id,
            unique=True,
        ),
        Index(
            "data_sync_imported_leads_ch_lead_id_idx",
            ch_lead_id,
        ),
    )


event.listen(DataSyncImportedLead, "before_update", update_timestamps)
