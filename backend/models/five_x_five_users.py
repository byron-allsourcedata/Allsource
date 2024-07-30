from sqlalchemy import Column, Integer, TEXT
from sqlalchemy.dialects.postgresql import VARCHAR

from .base import Base


class FiveXFiveUser(Base):
    __tablename__ = '5x5_users'

    id = Column(Integer, primary_key=True)
    up_id = Column(VARCHAR)
    cc_id = Column(VARCHAR)
    first_name = Column(VARCHAR)
    programmatic_business_emails = Column(TEXT)
    mobile_phone = Column(TEXT)
    direct_number = Column(TEXT)
    gender = Column(VARCHAR)
    age_range = Column(VARCHAR)
    personal_phone = Column(VARCHAR)
    business_email = Column(VARCHAR)
    last_name = Column(VARCHAR)
    personal_city = Column(VARCHAR)
    personal_state = Column(VARCHAR)
