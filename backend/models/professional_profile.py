from sqlalchemy import Column, TEXT, UUID, ForeignKey, text
from sqlalchemy.orm import relationship
from .base import Base

class ProfessionalProfile(Base):
    __tablename__ = 'professional_profiles'

    id = Column(UUID(as_uuid=True), primary_key=True, nullable=False, server_default=text("gen_random_uuid()"))
    asid = Column(UUID(as_uuid=True), ForeignKey("enrichment_users.asid"), nullable=True)
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

    enrichment_user = relationship(
        "EnrichmentUser",
        back_populates="professional_profiles"
    )
