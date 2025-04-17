from sqlalchemy import Column, Integer, VARCHAR, event, TIMESTAMP, ForeignKey, Boolean, Index
from .base import Base, create_timestamps
from .lead_company import LeadCompany
from.leads_visits import LeadsVisits
from .users import Users
from .five_x_five_users import FiveXFiveUser
from .users_domains import UserDomains


class LeadUser(Base):
    __tablename__ = 'leads_users'
    id = Column(Integer, primary_key=True, nullable=False)
    domain_id = Column(Integer, ForeignKey(UserDomains.id), nullable=False)
    user_id = Column(Integer, ForeignKey(Users.id), nullable=False)
    five_x_five_user_id = Column(Integer, ForeignKey(FiveXFiveUser.id), nullable=False)
    klaviyo_user_id = Column(Integer, nullable=True)
    shopify_user_id = Column(Integer, nullable=True)
    bigcommerce_user_id = Column(Integer, nullable=True)
    mailchimp_user_id = Column(Integer, nullable=True)
    behavior_type = Column(VARCHAR, nullable=False, default='visitor')
    created_at = Column(TIMESTAMP, nullable=True)
    first_visit_id = Column(Integer, ForeignKey(LeadsVisits.id), nullable=False)
    is_returning_visitor = Column(Boolean, nullable=False, default=False)
    is_converted_sales = Column(Boolean, nullable=False, default=False)
    total_visit = Column(Integer, nullable=True)
    avarage_visit_time = Column(Integer, nullable=True)
    total_visit_time = Column(Integer, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    company_id = Column(Integer, ForeignKey(LeadCompany.id), nullable=False)
    is_confirmed = Column(Boolean, nullable=False, default=False)
    is_checked = Column(Boolean, nullable=False, default=False)
    
Index('leads_users_is_active_idx', LeadUser.is_active)
Index('leads_users_first_visit_id_idx', LeadUser.first_visit_id)
Index('leads_users_is_confirmed_idx', LeadUser.is_confirmed)
Index('leads_users_is_confirmed_is_checked_idx', LeadUser.is_confirmed, LeadUser.is_checked)
Index('leads_users_id_domain_id_is_active_idx', LeadUser.id, LeadUser.domain_id, LeadUser.is_active)
Index('leads_users_id_behavior_type_idx', LeadUser.id, LeadUser.behavior_type)
Index('leads_users_id_domain_id_is_active_is_converted_sales_idx', LeadUser.id, LeadUser.domain_id, LeadUser.is_active, LeadUser.is_converted_sales)
Index('leads_users_id_domain_id_is_active_is_converted_sales_behavior_', LeadUser.id, LeadUser.domain_id, LeadUser.is_active, LeadUser.is_converted_sales, LeadUser.behavior_type)
Index('leads_users_id_domain_id_idx', LeadUser.id, LeadUser.domain_id)
Index('leads_users_domain_id_is_confirmed_idx', LeadUser.is_confirmed, LeadUser.domain_id)
Index('leads_users_domain_id_is_active_is_confirmed_idx', LeadUser.domain_id, LeadUser.is_active, LeadUser.is_confirmed)
Index('leads_users_five_x_five_user_id_domain_id_idx', LeadUser.five_x_five_user_id, LeadUser.domain_id)
Index('leads_users_five_x_five_user_id_user_id_idx', LeadUser.five_x_five_user_id, LeadUser.user_id)
Index("leads_users_user_created_at", LeadUser.user_id, LeadUser.created_at)


event.listen(LeadUser, "before_insert", create_timestamps)