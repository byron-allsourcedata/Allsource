from datetime import datetime, timezone

from sqlalchemy import Column, TIMESTAMP, UUID, text, String, Text, event

from .base import Base, update_timestamps


class AudienceSetting(Base):
    __tablename__ = 'audience_settings'

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    alias = Column(String, nullable=False)
    value = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

event.listen(AudienceSetting, "before_update", update_timestamps)
