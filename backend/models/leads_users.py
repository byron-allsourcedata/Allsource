from sqlalchemy import Column, Integer, VARCHAR, event, TIMESTAMP, ForeignKey, Boolean, Index, text, BigInteger
from .base import Base, create_timestamps
from .lead_company import LeadCompany
from .leads_visits import LeadsVisits
from .users import Users
from .five_x_five_users import FiveXFiveUser
from .users_domains import UserDomains


class LeadUser(Base):
    __tablename__ = 'leads_users'
    __table_args__ = (
        Index('leads_users_domain_id_is_active_is_confirmed_idx', 'domain_id', 'is_active', 'is_confirmed'),
        Index('leads_users_first_visit_id_idx', 'first_visit_id'),
        Index('leads_users_five_x_five_user_id_domain_id_idx', 'five_x_five_user_id', 'domain_id'),
        Index('leads_users_five_x_five_user_id_user_id_idx', 'five_x_five_user_id', 'user_id'),
        Index('leads_users_id_behavior_type_idx', 'id', 'behavior_type'),
        Index('leads_users_id_domain_id_idx', 'id', 'domain_id'),
        Index('leads_users_id_domain_id_is_active_idx', 'id', 'domain_id', 'is_active'),
        Index('leads_users_id_domain_id_is_active_is_converted_sales_behavior_', 'id', 'domain_id', 'is_active',
              'is_converted_sales', 'behavior_type'),
        Index('leads_users_id_domain_id_is_active_is_converted_sales_idx', 'id', 'domain_id', 'is_active',
              'is_converted_sales'),
        Index('leads_users_is_active_idx', 'is_active'),
        Index('leads_users_is_confirmed_idx', 'is_confirmed'),
        Index('leads_users_is_confirmed_is_checked_idx', 'is_confirmed', 'is_checked'),
        Index('leads_users_is_confirmed_domain_id_idx', 'is_confirmed', 'domain_id'),
        Index('leads_users_user_id_created_at_idx', 'user_id', 'created_at'),
        Index('leads_users_user_id_idx', 'user_id', 'is_active'),
    )

    id = Column(
        BigInteger,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('leads_users_id_seq'::regclass)")
    )
    user_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=True
    )
    five_x_five_user_id = Column(
        BigInteger,
        ForeignKey('5x5_users.id', ondelete='CASCADE'),
        nullable=True
    )
    behavior_type = Column(VARCHAR, nullable=True)
    created_at = Column(TIMESTAMP, nullable=True)
    shopify_user_id = Column(VARCHAR, nullable=True)
    klaviyo_user_id = Column(VARCHAR, nullable=True)
    bigcommerce_user_id = Column(VARCHAR, nullable=True)
    mailchimp_user_id = Column(VARCHAR, nullable=True)
    first_visit_id = Column(
        BigInteger,
        ForeignKey('leads_visits.id', ondelete='CASCADE'),
        nullable=True
    )
    is_converted_sales = Column(
        Boolean,
        nullable=True,
        server_default=text('false')
    )
    is_returning_visitor = Column(
        Boolean,
        nullable=True,
        server_default=text('false')
    )
    domain_id = Column(
        BigInteger,
        ForeignKey('users_domains.id', ondelete='CASCADE'),
        nullable=True
    )
    total_visit = Column(Integer, nullable=True)
    avarage_visit_time = Column(Integer, nullable=True)
    total_visit_time = Column(BigInteger, nullable=True)
    is_active = Column(
        Boolean,
        nullable=False,
        server_default=text('true')
    )
    company_id = Column(
        BigInteger,
        ForeignKey('leads_companies.id', ondelete='CASCADE'),
        nullable=True
    )
    is_confirmed = Column(
        Boolean,
        nullable=False,
        server_default=text('false')
    )
    is_checked = Column(
        Boolean,
        nullable=False,
        server_default=text('false')
    )


event.listen(LeadUser, "before_insert", create_timestamps)
