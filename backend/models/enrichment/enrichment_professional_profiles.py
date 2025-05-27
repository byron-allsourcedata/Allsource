from sqlalchemy import Column, TEXT, UUID, ForeignKey, text, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from models.base import Base


class EnrichmentProfessionalProfile(Base):
    __tablename__ = 'enrichment_professional_profiles'
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text("gen_random_uuid()")
    )

    asid = Column(
        UUID(as_uuid=True),
        ForeignKey("enrichment_users.asid", ondelete="CASCADE"),
        nullable=True
    )
    
    current_job_title = Column(TEXT, nullable=True)
    current_company_name = Column(TEXT, nullable=True)
    job_start_date = Column(TEXT, nullable=True)
    job_duration = Column(TEXT, nullable=True)
    job_location = Column(TEXT, nullable=True)
    job_level = Column(TEXT, nullable=True)
    department = Column(TEXT, nullable=True)
    company_size = Column(TEXT, nullable=True)
    primary_industry = Column(TEXT, nullable=True)
    annual_sales = Column(TEXT, nullable=True)
    
    __table_args__ = (
        Index('professional_profiles_asid_idx', asid, unique=True),
    )

from .enrichment_users import EnrichmentUser
    
EnrichmentProfessionalProfile.enrichment_user = relationship(
        EnrichmentUser,
        back_populates="professional_profiles",
        foreign_keys=[EnrichmentProfessionalProfile.asid]
    )
