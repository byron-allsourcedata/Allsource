from sqlalchemy import Column, Integer, VARCHAR
from .base import Base


class LeadUser(Base):
    __tablename__ = 'leads_users'

    id = Column(Integer, primary_key=True, nullable=False)
    lead_id = Column(Integer, nullable=True)
    user_id = Column(Integer, nullable=False)
    status = Column(VARCHAR, default='New', nullable=False)
    funnel = Column(VARCHAR, default='Visitor', nullable=False)
    five_x_five_user_id = Column(Integer, nullable=True)
    klaviyo_user_id = Column(Integer, nullable=True)
    shopify_user_id = Column(Integer, nullable=True)
    bigcommerce_user_id = Column(Integer, nullable=True)
    mailchimp_user_id = Column(Integer, nullable=True)
