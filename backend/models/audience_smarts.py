from sqlalchemy import Column, Integer, TIMESTAMP, JSON, VARCHAR, ForeignKey, Index, UUID, text, String, BigInteger, \
    PrimaryKeyConstraint
from .base import Base
from models.users import Users
from models.audience_smarts_use_cases import AudienceSmartsUseCase
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.sql import func

audience_smarts_statuses = ENUM(
    'unvalidated', 'validating', 'ready', 'synced', 'data_syncing', 'n_a', 'failed',
    name='audience_smarts_statuses', create_type=True
)


class AudienceSmart(Base):
    __tablename__ = 'audience_smarts'
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )

    name = Column(String(128), nullable=False)
    created_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    user_id = Column(
        BigInteger,
        ForeignKey('users.id'),
        nullable=True
    )
    created_by_user_id = Column(
        BigInteger,
        ForeignKey('users.id', onupdate='SET NULL'),
        nullable=True
    )
    total_records = Column(BigInteger, server_default='0', nullable=False)
    validated_records = Column(BigInteger, server_default='0', nullable=False)
    active_segment_records = Column(BigInteger, server_default='0', nullable=False)
    processed_active_segment_records = Column(BigInteger, server_default='0', nullable=False)
    status = Column(
        audience_smarts_statuses,
        server_default="'ready'",
        nullable=False
    )
    use_case_id = Column(
        UUID(as_uuid=True),
        ForeignKey('audience_smarts_use_cases.id', onupdate='SET NULL'),
        nullable=True
    )
    validations = Column(JSON, nullable=True)
    target_schema = Column(VARCHAR(128), nullable=True)
    
    __table_args__ = (
        Index('audience_smarts_active_segment_records_idx', active_segment_records),
        Index('audience_smarts_created_at_idx', created_at, unique=True),
        Index('audience_smarts_created_at_user_id_idx', created_at, user_id),
        Index('audience_smarts_status_idx', status),
        Index('audience_smarts_total_records_idx', total_records),
        Index('audience_smarts_use_case_id_idx', use_case_id),
        Index('audience_smarts_user_id_idx', user_id),
        Index('audience_smarts_user_created_at', user_id, created_at),
        Index('audience_smarts_pkey', id, unique=True),
    )
