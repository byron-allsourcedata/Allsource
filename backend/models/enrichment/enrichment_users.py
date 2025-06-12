from sqlalchemy import Column, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID

from models.base import Base


class EnrichmentUser(Base):
    __tablename__ = "enrichment_users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text("gen_random_uuid()"),
    )
    asid = Column(UUID(as_uuid=True), nullable=False)
    __table_args__ = (UniqueConstraint(asid, name="enrichment_user_ids_asid_key"),)
