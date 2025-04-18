from sqlalchemy import Column, TEXT, UUID, ForeignKey, TIMESTAMP
from .base import Base
from models.enrichment_users import EnrichmentUser
from sqlalchemy.orm import relationship


class EnrichmentUserContact(Base):
    __tablename__ = 'enrichment_users_contacts'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    enrichment_user_id = Column(UUID(as_uuid=True), ForeignKey(EnrichmentUser.id), nullable=True)
    asid = Column(UUID(as_uuid=True), nullable=False)
    up_id = Column(TEXT, nullable=False)
    business_email_last_seen_date = Column(TIMESTAMP, nullable=False)
    personal_email_last_seen = Column(TIMESTAMP, nullable=False)
    rsid = Column(TEXT, nullable=True)
    name_prefix = Column(TEXT, nullable=True)
    first_name = Column(TEXT, nullable=True)
    middle_name = Column(TEXT, nullable=True)
    last_name = Column(TEXT, nullable=True)
    name_suffix = Column(TEXT, nullable=True)
    business_email = Column(TEXT, nullable=True)
    personal_email = Column(TEXT, nullable=True)
    other_emails = Column(TEXT, nullable=True)
    phone_mobile1 = Column(TEXT, nullable=True)
    phone_mobile2 = Column(TEXT, nullable=True)
    mobile_phone_dnc = Column(TEXT, nullable=True)
    business_email_validation_status = Column(TEXT, nullable=True)
    personal_email_validation_status = Column(TEXT, nullable=True)
    linkedin_url = Column(TEXT, nullable=True)
    email = Column(TEXT, nullable=True)

    enrichment_user = relationship("EnrichmentUser", back_populates="contacts")