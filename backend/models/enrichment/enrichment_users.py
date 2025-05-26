from sqlalchemy import Column, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

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
from .enrichment_professional_profiles import EnrichmentProfessionalProfile
from .enrichment_postals import EnrichmentPostal

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
    EnrichmentProfessionalProfile,
    back_populates='enrichment_user',
    cascade="all, delete-orphan",
    foreign_keys=[EnrichmentProfessionalProfile.asid],
    uselist=False,
    lazy="select"
)

EnrichmentUser.postal = relationship(
        EnrichmentPostal,
        back_populates='enrichment_user',
        foreign_keys=[EnrichmentPostal.asid],
        uselist=False,
        lazy="select"
    )
