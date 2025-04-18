from sqlalchemy import Column, Integer, TEXT, UUID, SmallInteger, TIMESTAMP, ForeignKey, text
from sqlalchemy.orm import relationship
from .base import Base

class EnrichmentUserContact(Base):
    __tablename__ = 'enrichment_users_contacts'

    id = Column(UUID(as_uuid=True), primary_key=True, nullable=False, server_default=text("gen_random_uuid()"))
    enrichment_user_id = Column(UUID(as_uuid=True), ForeignKey("enrichment_users.id"), nullable=False)
    asid = Column(UUID(as_uuid=True), nullable=False)
    up_id = Column(TEXT, nullable=False)
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
    business_email_last_seen_date = Column(TIMESTAMP, nullable=True)
    personal_email_last_seen = Column(TIMESTAMP, nullable=True)
    mobile_phone_dnc = Column(TEXT, nullable=True)
    business_email_validation_status = Column(TEXT, nullable=True)
    personal_email_validation_status = Column(TEXT, nullable=True)
    linkedin_url = Column(TEXT, nullable=True)
    email = Column(TEXT, nullable=True)

    enrichment_user = relationship("EnrichmentUser", back_populates="contacts")