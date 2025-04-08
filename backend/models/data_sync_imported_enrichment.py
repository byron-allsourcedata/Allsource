from sqlalchemy import Column, Integer, VARCHAR, Index
from sqlalchemy.dialects.postgresql import TIMESTAMP
from .base import Base

class DataSyncImportedEncrichment(Base):
    __tablename__ = 'data_sync_imported_encrichment'

    id = Column(Integer, primary_key=True)
    status = Column(VARCHAR(64), nullable=False)
    service_name = Column(VARCHAR(128), nullable=False)
    data_sync_id = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP(precision=7), nullable=True)
    updated_at = Column(TIMESTAMP(precision=7), nullable=True)
    enrichment_user_id = Column(Integer, nullable=False)
    
    __table_args__ = (
        Index('data_sync_imported_leads_five_x_five_up_id_service_name_data_sy', 'five_x_five_up_id','service_name','data_sync_id','lead_users_id'),
        Index('data_sync_imported_leads_data_sync_id_status_idx', 'data_sync_id','status'),
    )