from sqlalchemy import Column, event, Integer, TIMESTAMP, JSON, VARCHAR, ForeignKey, Index, UUID
from .base import Base, create_timestamps, update_timestamps
from models.users import Users
from models.audience_smarts_use_cases import AudienceSmartsUseCase

class AudienceSmart(Base):
    __tablename__ = 'audience_smarts'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    name = Column(VARCHAR(128), nullable=False)
    user_id = Column(Integer, ForeignKey(Users.id), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey(Users.id, onupdate='SET NULL'), nullable=True)
    created_at = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, nullable=False)
    validated_records = Column(Integer(8), default=0, nullable=False)
    total_records = Column(Integer(8), default=0, nullable=False)
    active_segment_records = Column(Integer(8), default=0, nullable=False)
    status = Column(VARCHAR(16), default='unvalidated', nullable=False)
    validations = Column(JSON, nullable=True)
    use_case_id = Column(UUID, ForeignKey(AudienceSmartsUseCase.id), nullable=True)

Index('audience_smarts_pkey', AudienceSmart.id)
Index('audience_smarts_user_id_idx', AudienceSmart.user_id)
Index('audience_smarts_created_at_idx', AudienceSmart.created_at)
Index('audience_smarts_total_records_idx', AudienceSmart.total_records)
Index('audience_smarts_active_segment_records_idx', AudienceSmart.active_segment_records)
Index('audience_smarts_use_case_id_idx', AudienceSmart.use_case_id)
Index('audience_smarts_status_idx', AudienceSmart.status)

event.listen(AudienceSmart, "before_insert", create_timestamps)
event.listen(AudienceSmart, "before_update", update_timestamps)
