from sqlalchemy import Column, Integer
from sqlalchemy.dialects.postgresql import VARCHAR
from .base import Base


class Lead(Base):
    __tablename__ = 'leads'

    id = Column(Integer, primary_key=True)
    first_name = Column(VARCHAR)
    up_id = Column(VARCHAR)
    mobile_phone = Column(VARCHAR)
    business_email = Column(VARCHAR)
    last_name = Column(VARCHAR)
    trovo_id = Column(VARCHAR)
    partner_id = Column(VARCHAR)
    partner_uid = Column(VARCHAR)
    sha256_lower_case = Column(VARCHAR)
    ip = Column(VARCHAR)
    time_spent = Column(VARCHAR)
    no_of_visits = Column(Integer)
    no_of_page_visits = Column(Integer)
    age_min = Column(Integer)
    age_max = Column(Integer)
    gender = Column(VARCHAR(1))
