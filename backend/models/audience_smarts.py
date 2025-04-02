from sqlalchemy import Column, Integer, TIMESTAMP, JSON, VARCHAR, ForeignKey, Index, UUID
from .base import Base
from models.users import Users
from models.audience_smarts_use_cases import AudienceSmartsUseCase
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.sql import func

audience_smarts_statuses = ENUM('unvalidated', 'validating', 'ready', 'synced', name='audience_smarts_statuses', create_type=True)

class AudienceSmart(Base):
    __tablename__ = 'audience_smarts'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    name = Column(VARCHAR(128), nullable=False)
    user_id = Column(Integer, ForeignKey(Users.id), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey(Users.id, onupdate='SET NULL'), nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.now(), onupdate=func.now())
    validated_records = Column(Integer, default=0, nullable=False)
    total_records = Column(Integer, default=0, nullable=False)
    active_segment_records = Column(Integer, default=0, nullable=False)
    processed_active_segment_records = Column(Integer, default=0, nullable=False)
    status = Column(audience_smarts_statuses, default='unvalidated', nullable=False)
    validations = Column(JSON, nullable=True)
    use_case_id = Column(UUID, ForeignKey(AudienceSmartsUseCase.id), nullable=True)

Index('audience_smarts_user_id_idx', AudienceSmart.user_id)
Index('audience_smarts_created_at_idx', AudienceSmart.created_at)
Index('audience_smarts_total_records_idx', AudienceSmart.total_records)
Index('audience_smarts_active_segment_records_idx', AudienceSmart.active_segment_records)
Index('audience_smarts_use_case_id_idx', AudienceSmart.use_case_id)
Index('audience_smarts_status_idx', AudienceSmart.status)
