from sqlalchemy import Column, Integer, TEXT, UUID, SmallInteger, Boolean, text
from sqlalchemy.dialects.postgresql import INT4RANGE
from sqlalchemy.inspection import inspect
from .base import Base
from sqlalchemy.orm import relationship
from models.emails_enrichment import EmailEnrichment
from models.enrichment_user_contact import EnrichmentUserContact
from models.professional_profile import ProfessionalProfile


class EnrichmentUser(Base):
    __tablename__ = 'enrichment_users'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False,
                server_default=text("gen_random_uuid()"))
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

    emails_enrichment = relationship("EmailEnrichment", back_populates="enrichment_user", cascade="all, delete-orphan")
    contacts = relationship("EnrichmentUserContact", back_populates="enrichment_user", cascade="all, delete-orphan")
    professional_profiles = relationship(
        "ProfessionalProfile",
        back_populates="enrichment_user",
        cascade="all, delete-orphan"
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