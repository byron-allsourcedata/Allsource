from datetime import datetime, timezone

from sqlalchemy import Column, TIMESTAMP, JSON, VARCHAR, Index, UUID, text, func, event

from .base import Base, update_timestamps


class AudienceSmartsUseCase(Base):
    __tablename__ = 'audience_smarts_use_cases'

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
    updated_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
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

    __table_args__ = (
        Index('audience_smarts_use_cases_pkey', id, unique=True),
    )

event.listen(AudienceSmartsUseCase, "before_update", update_timestamps)
