from sqlalchemy import Column, Integer, VARCHAR, event, TIMESTAMP, ForeignKey, Boolean, Index
from .base import Base, create_timestamps


class LeadUser(Base):
    __tablename__ = 'leads_users'
    id = Column(Integer, primary_key=True, nullable=False)
    domain_id = Column(Integer, ForeignKey('users_domains.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    five_x_five_user_id = Column(Integer, ForeignKey('5x5_users.id'), nullable=False)
    klaviyo_user_id = Column(Integer, nullable=True)
    shopify_user_id = Column(Integer, nullable=True)
    bigcommerce_user_id = Column(Integer, nullable=True)
    mailchimp_user_id = Column(Integer, nullable=True)
    behavior_type = Column(VARCHAR, nullable=False, default='visitor')
    created_at = Column(TIMESTAMP, nullable=True)
    first_visit_id = Column(Integer, ForeignKey('leads_visits.id'), nullable=False)
    is_returning_visitor = Column(Boolean, nullable=False, default=False)
    is_converted_sales = Column(Boolean, nullable=False, default=False)
    total_visit = Column(Integer, nullable=True)
    avarage_visit_time = Column(Integer, nullable=True)
    total_visit_time = Column(Integer, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    
    __table_args__ = (
        Index('leads_users_is_active_idx', 'is_active'),
        Index('leads_users_id_domain_id_is_active_idx', 'id', 'domain_id', 'is_active'),
        Index('leads_users_id_behavior_type_idx', 'id', 'behavior_type'),
        Index('leads_users_id_domain_id_is_active_is_converted_sales_idx', 'id', 'domain_id', 'is_active', 'is_converted_sales'),
        Index('leads_users_id_domain_id_is_active_is_converted_sales_behavior_', 'id', 'domain_id', 'is_active', 'is_converted_sales', 'behavior_type'),
        Index('leads_users_id_domain_id_idx', 'id', 'domain_id'),
    )


event.listen(LeadUser, "before_insert", create_timestamps)
