from sqlalchemy import Column, Integer, VARCHAR, TIMESTAMP
from datetime import datetime
from .base import Base


class KlaviyoUsers(Base):

    __tablename__ = 'klaviyo_users'
    id = Column(Integer, primary_key=True)
    email = Column(VARCHAR, nullable=False)
    phone_number = Column(VARCHAR)
    first_name = Column(VARCHAR)
    last_name = Column(VARCHAR)
    organization = Column(VARCHAR)
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP)
    klaviyo_user_id = Column(VARCHAR)
    ip = Column(VARCHAR)
    external_id = Column(VARCHAR)
    city = Column(VARCHAR)
    zip = Column(VARCHAR)
    timezone = Column(VARCHAR)
    anonymous_id = Column(VARCHAR)
    