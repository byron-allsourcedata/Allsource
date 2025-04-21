from sqlalchemy import (
    Column,
    Date,
    Boolean,
    String,
    Text,
    ForeignKey,
    text
)
from sqlalchemy.dialects.postgresql import UUID
from .base import Base


class EnrichmentEmploymentHistory(Base):
    __tablename__ = 'enrichment_employment_history'

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    asid = Column(
        UUID(as_uuid=True),
        ForeignKey(
            'enrichment_user_ids.asid',
            ondelete='CASCADE',
            onupdate='CASCADE'
        ),
        nullable=False
    )
    job_title = Column(String(100), nullable=True)
    company_name = Column(String(100), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_current = Column(Boolean, nullable=False)
    location = Column('location', String(100), nullable=True)
    job_description = Column(Text, nullable=True)
