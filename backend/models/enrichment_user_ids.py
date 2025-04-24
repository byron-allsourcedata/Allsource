from sqlalchemy import Column, UniqueConstraint, text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import Base
from models.enrichment_personal_profiles import EnrichmentPersonalProfiles
from models.enrichment_user_contact import EnrichmentUserContact

class EnrichmentUserId(Base):
    __tablename__ = 'enrichment_users'
    __table_args__ = (
        UniqueConstraint('asid', name='enrichment_user_ids_asid_key'),
        Index("ix_enrichment_users_asid", "asid"),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    asid = Column(
        UUID(as_uuid=True),
        nullable=False
    )

    contacts = relationship(
        "EnrichmentUserContact",
        back_populates="enrichment_user",
        foreign_keys="[EnrichmentUserContact.asid]"
    )

    personal_profiles = relationship(
        "EnrichmentPersonalProfiles",
        back_populates="enrichment_user",
        foreign_keys="[EnrichmentPersonalProfiles.asid]"
    )
