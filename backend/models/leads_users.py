from sqlalchemy import Column, Integer, VARCHAR, event, TIMESTAMP
from .base import Base, create_timestamps

class LeadUser(Base):
    __tablename__ = 'leads_users'
    id = Column(Integer, primary_key=True, nullable=False)
    user_id = Column(Integer, nullable=False)
    five_x_five_user_id = Column(Integer, nullable=False)
    status = Column(VARCHAR, default='New', nullable=False)
    funnel = Column(VARCHAR, default='Visitor', nullable=False)
    five_x_five_user_id = Column(Integer, nullable=True)
    klaviyo_user_id = Column(Integer, nullable=True)
    shopify_user_id = Column(Integer, nullable=True)
    bigcommerce_user_id = Column(Integer, nullable=True)
    mailchimp_user_id = Column(Integer, nullable=True)
    behavior_type = Column(VARCHAR, default='Visitor', nullable=False)
    created_at = Column(TIMESTAMP, nullable=True)

event.listen(LeadUser, "before_insert", create_timestamps)
