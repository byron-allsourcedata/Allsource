from sqlalchemy import Column, Integer, VARCHAR, event, TIMESTAMP, ForeignKey, Boolean
from .base import Base, create_timestamps

class LeadUser(Base):
    __tablename__ = 'leads_users'
    id = Column(Integer, primary_key=True, nullable=False)
    user_id = Column(Integer, nullable=False)
    five_x_five_user_id = Column(Integer, nullable=False)
    five_x_five_user_id = Column(Integer, nullable=True)
    klaviyo_user_id = Column(Integer, nullable=True)
    shopify_user_id = Column(Integer, nullable=True)
    bigcommerce_user_id = Column(Integer, nullable=True)
    mailchimp_user_id = Column(Integer, nullable=True)
    behavior_type = Column(VARCHAR, nullable=False, default='visitor')
    created_at = Column(TIMESTAMP, nullable=True)
    first_visit_id = Column(Integer, ForeignKey('leads_visits.id'), nullable=False)
    is_converted_sales = Column(Boolean, nullable=False, default=False)
    is_returning_visitor = Column(Boolean, nullable=False, default=False)
    is_abandoned_cart = Column(Boolean, nullable=False, default=False)
    is_landed_to_cart = Column(Boolean, nullable=False, default=False)

event.listen(LeadUser, "before_insert", create_timestamps)
