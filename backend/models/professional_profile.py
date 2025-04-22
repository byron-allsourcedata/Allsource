from sqlalchemy import Column, TEXT, UUID, ForeignKey, text, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base


class ProfessionalProfile(Base):
    __tablename__ = 'professional_profiles'
    __table_args__ = (
        UniqueConstraint('asid', name='professional_profiles_asid_key'),
        UniqueConstraint('enrichment_user_id', name='professional_profiles_enrichment_user_id_key'),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text("gen_random_uuid()")
    )
    enrichment_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("enrichment_users.id", ondelete="CASCADE"),
        nullable=True
    )

    asid = Column(
        UUID(as_uuid=True),
        ForeignKey("enrichment_users.asid", ondelete="CASCADE"),
        nullable=True
    )
    asid = Column(UUID(as_uuid=True), nullable=True, unique=True)
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
        back_populates="professional_profiles",
        foreign_keys=[enrichment_user_id]
    )
