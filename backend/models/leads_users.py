from sqlalchemy import Column, Integer, VARCHAR, event, TIMESTAMP, ForeignKey, Boolean
from .base import Base, create_timestamps


class LeadUser(Base):
    __tablename__ = 'leads_users'
    id = Column(Integer, primary_key=True, nullable=False)
    domain_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    five_x_five_user_id = Column(Integer, nullable=False)
    klaviyo_user_id = Column(Integer, nullable=True)
    shopify_user_id = Column(Integer, nullable=True)
    bigcommerce_user_id = Column(Integer, nullable=True)
    mailchimp_user_id = Column(Integer, nullable=True)
    behavior_type = Column(VARCHAR, nullable=False, default='visitor')
    created_at = Column(TIMESTAMP, nullable=True)
    first_visit_id = Column(Integer, nullable=False)
    is_returning_visitor = Column(Boolean, nullable=False, default=False)
    is_converted_sales = Column(Boolean, nullable=False, default=False)
    total_visit = Column(Integer, nullable=True)
    avarage_visit_time = Column(Integer, nullable=True)
    total_visit_time = Column(Integer, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)


event.listen(LeadUser, "before_insert", create_timestamps)
