from sqlalchemy import Column, UniqueConstraint, text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, backref

from models.base import Base

class EnrichmentUser(Base):
    __tablename__ = 'enrichment_users'

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
    __table_args__ = (
        UniqueConstraint(asid, name='enrichment_user_ids_asid_key'),
    )
    
from .enrichment_user_contact import EnrichmentUserContact
from .enrichment_personal_profiles import EnrichmentPersonalProfiles
from .professional_profile import ProfessionalProfile
from .emails_enrichment import EmailEnrichment

EnrichmentUser.contacts = relationship(
    EnrichmentUserContact,
    back_populates='enrichment_user',
    foreign_keys=[EnrichmentUserContact.asid],
    uselist=False,
    lazy="select"
)

EnrichmentUser.personal_profiles = relationship(
    EnrichmentPersonalProfiles,
    back_populates='enrichment_user',
    foreign_keys=[EnrichmentPersonalProfiles.asid],
    uselist=False,
    lazy="select"
)

EnrichmentUser.professional_profiles = relationship(
    ProfessionalProfile,
    back_populates='enrichment_user',
    cascade="all, delete-orphan",
    foreign_keys=[ProfessionalProfile.asid],
    uselist=False,
    lazy="select"
)

EnrichmentUser.emails_enrichment = relationship(
    EmailEnrichment,
    back_populates='enrichment_user',
    cascade="all, delete-orphan",
    lazy="select"
)
