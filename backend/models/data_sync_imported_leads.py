from sqlalchemy import Column, Integer, VARCHAR, Index, TIMESTAMP, event

from .base import Base, create_timestamps


class DataSyncImportedLeads(Base):
    __tablename__ = 'data_sync_imported_leads'

    id = Column(Integer, primary_key=True)
    status = Column(VARCHAR(64), nullable=False)
    access_token = Column(VARCHAR(128), nullable=False)
    five_x_five_up_id = Column(Integer, nullable=False)
    service_name = Column(VARCHAR(128), nullable=False)
    integration_id = Column(Integer, nullable=False)
    message = Column(VARCHAR(128), nullable=True)
    created_at = Column(TIMESTAMP, nullable=True)
    
    __table_args__ = (
        Index('data_sync_imported_leads_access_token_five_x_five_up_id_service', 'access_token', 'five_x_five_up_id', 'service_name', 'integration_id'),
    )

event.listen(DataSyncImportedLeads, "before_insert", create_timestamps)