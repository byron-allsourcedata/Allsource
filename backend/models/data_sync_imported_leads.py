from datetime import datetime, timezone

from sqlalchemy import Column, BigInteger, TIMESTAMP, VARCHAR, ForeignKey, Index, UniqueConstraint, event

from .base import Base, update_timestamps


class DataSyncImportedLead(Base):
    __tablename__ = 'data_sync_imported_leads'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    status = Column(VARCHAR(64), nullable=False)
    five_x_five_up_id = Column(VARCHAR, nullable=False)
    service_name = Column(VARCHAR(128), nullable=False)
    data_sync_id = Column(
        BigInteger,
        ForeignKey('integrations_users_sync.id', ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False
    )
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    lead_users_id = Column(
        BigInteger,
        ForeignKey('leads_users.id', ondelete='CASCADE', onupdate='CASCADE'),
        nullable=True
    )

    __table_args__ = (
        Index(
            'data_sync_imported_leads_data_sync_id_status_idx',
            'data_sync_id',
            'status'
        ),
        UniqueConstraint(
            'five_x_five_up_id',
            'service_name',
            'data_sync_id',
            'lead_users_id',
            name='data_sync_imported_leads_five_x_five_up_id_service_name_data_sy'
        ),
    )

event.listen(DataSyncImportedLead, "before_update", update_timestamps)