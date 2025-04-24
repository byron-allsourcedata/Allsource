from sqlalchemy import Column, Integer, TEXT, UUID, SmallInteger, Boolean, text, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import INT4RANGE
from sqlalchemy.inspection import inspect
from .base import Base
from sqlalchemy.orm import relationship
from models.emails_enrichment import EmailEnrichment
from models.enrichment_user_contact import EnrichmentUserContact
from models.professional_profile import ProfessionalProfile


class EnrichmentUser(Base):
    __tablename__ = 'enrichment_users2'
    __table_args__ = (
        UniqueConstraint('asid', name='enrichment_users_idx'),
        CheckConstraint('credit_rating >= 0 AND credit_rating <= 26', name='enrichment_users_credit_rating_check'),
        CheckConstraint('net_worth_code >= 0 AND net_worth_code <= 26', name='enrichment_users_net_worth_code_check'),
        CheckConstraint('has_children = ANY (ARRAY[0,1,2])', name='enrichment_users_has_children_check'),
        CheckConstraint('has_credit_card = ANY (ARRAY[0,1,2])', name='enrichment_users_has_credit_card_check'),
        CheckConstraint('homeowner_status = ANY (ARRAY[0,1,2])', name='enrichment_users_homeowner_status_check'),
        CheckConstraint('is_book_reader = ANY (ARRAY[0,1,2])', name='enrichment_users_is_book_reader_check'),
        CheckConstraint('is_online_purchaser = ANY (ARRAY[0,1,2])', name='enrichment_users_is_online_purchaser_check'),
        CheckConstraint('is_traveler = ANY (ARRAY[0,1,2])', name='enrichment_users_is_traveler_check'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, nullable=False)
    cid = Column(Integer, nullable=True)
    age = Column(INT4RANGE, nullable=False)
    gender = Column(SmallInteger, nullable=False)
    estimated_household_income_code = Column(SmallInteger, nullable=False)
    estimated_current_home_value_code = Column(SmallInteger, nullable=False)
    homeowner_status = Column(SmallInteger, nullable=False)
    has_children = Column(SmallInteger, nullable=False)
    number_of_children = Column(SmallInteger, nullable=False)
    credit_rating = Column(SmallInteger, nullable=False)
    net_worth_code = Column(SmallInteger, nullable=False)
    zip_code5 = Column(Integer, nullable=True)
    lat = Column(TEXT, nullable=True)
    lon = Column(TEXT, nullable=True)
    has_credit_card = Column(SmallInteger, nullable=False)
    length_of_residence_years = Column(SmallInteger, nullable=True)
    marital_status = Column(SmallInteger, nullable=False)
    occupation_group_code = Column(TEXT, nullable=True)
    is_book_reader = Column(SmallInteger, nullable=False)
    is_online_purchaser = Column(SmallInteger, nullable=False)
    state_abbr = Column(TEXT, nullable=True)
    is_traveler = Column(SmallInteger, nullable=False)
    rec_id = Column(Integer, nullable=True)
    asid = Column(UUID(as_uuid=True), nullable=True, unique=True)
    birth_year = Column(Integer, nullable=True)
    birth_month = Column(Integer, nullable=True)
    birth_day = Column(Integer, nullable=True)
    has_pets = Column(SmallInteger, nullable=True)
    ethnic_code = Column(TEXT, nullable=True)
    language_code = Column(TEXT, nullable=True)
    religion_code = Column(TEXT, nullable=True)
    business_owner = Column(TEXT, nullable=True)

    emails_enrichment = relationship(
        EmailEnrichment,
        back_populates="enrichment_user",
        cascade="all, delete-orphan",
        foreign_keys=[EmailEnrichment.enrichment_user_id]
    )
    # contacts = relationship(
    #     EnrichmentUserContact,
    #     back_populates="enrichment_user",
    #     cascade="all, delete-orphan",
    #     foreign_keys=[EnrichmentUserContact.enrichment_user_id]
    # )
    professional_profiles = relationship(
        ProfessionalProfile,
        back_populates="enrichment_user",
        cascade="all, delete-orphan",
        foreign_keys=[ProfessionalProfile.enrichment_user_id]
    )

    @classmethod
    def get_fields(cls, exclude_fields=None):
        exclude_fields = set(exclude_fields or [])
        return [
            column.key
            for column in inspect(cls).columns
            if column.key not in exclude_fields
        ]

    @classmethod
    def get_headers(cls, exclude_fields=None):
        fields = cls.get_fields(exclude_fields=exclude_fields)
        return [field.replace("_", " ").title() for field in fields]
