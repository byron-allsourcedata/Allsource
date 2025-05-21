from sqlalchemy import Column, Integer, DATE, TIME, VARCHAR, ForeignKey, Index, BigInteger, text, Date, Time, Sequence

from .base import Base
from .five_x_five_users import FiveXFiveUser
from .users_domains import UserDomains


class LeadsVisits(Base):
    __tablename__ = 'leads_visits'
    __table_args__ = (
        Index('leads_visits_five_x_five_user_id_domain_id_idx', 'five_x_five_user_id', 'domain_id'),
        Index('leads_visits_pages_count_idx', 'pages_count'),
    )

    id = Column(
        BigInteger,
        Sequence('leads_visits_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    start_date = Column(Date, nullable=True)
    start_time = Column(Time, nullable=True)
    end_date = Column(Date, nullable=True)
    end_time = Column(Time, nullable=True)
    pages_count = Column(Integer, nullable=True)
    average_time_sec = Column(Integer, nullable=True)
    full_time_sec = Column(Integer, nullable=True)
    lead_id = Column(
        BigInteger,
        ForeignKey('leads_users.id', ondelete='CASCADE'),
        nullable=True
    )
    behavior_type = Column(VARCHAR, nullable=True)
    five_x_five_user_id = Column(
        Integer,
        ForeignKey('5x5_users.id', ondelete='SET NULL'),
        nullable=True
    )
    domain_id = Column(
        Integer,
        ForeignKey('users_domains.id', ondelete='SET NULL'),
        nullable=True
    )
