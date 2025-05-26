from sqlalchemy import Column, event, TIMESTAMP, JSON, VARCHAR, Index, UUID, text, func
from .base import Base, create_timestamps, update_timestamps


class AudienceSmartsUseCase(Base):
    __tablename__ = 'audience_smarts_use_cases'
    __table_args__ = (
        # Index('audience_smarts_use_cases_pkey', 'id', unique=True),
    )
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    name = Column(
        VARCHAR(64),
        nullable=False
    )
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )
    recomended_validations = Column(
        JSON,
        nullable=True,
        name='recomended_validations'
    )
    alias = Column(
        VARCHAR(64),
        nullable=False,
        unique=True
    )
    integrations = Column(
        JSON,
        nullable=False
    )
    validations = Column(
        JSON,
        nullable=True
    )


event.listen(AudienceSmartsUseCase, "before_insert", create_timestamps)
event.listen(AudienceSmartsUseCase, "before_update", update_timestamps)
