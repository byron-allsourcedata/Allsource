from sqlalchemy import Column, event, TIMESTAMP, JSON, VARCHAR, Index, UUID
from .base import Base, create_timestamps, update_timestamps

class AudienceSmartsUseCase(Base):
    __tablename__ = 'audience_smarts_use_cases'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    name = Column(VARCHAR(64), nullable=False)
    created_at = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, nullable=False)
    validations = Column(JSON, nullable=True)
    alias = Column(VARCHAR(64), nullable=False, unique=True)
    integrations = Column(JSON, nullable=False)

Index('audience_smarts_use_cases_pkey', AudienceSmartsUseCase.id)

event.listen(AudienceSmartsUseCase, "before_insert", create_timestamps)
event.listen(AudienceSmartsUseCase, "before_update", update_timestamps)
