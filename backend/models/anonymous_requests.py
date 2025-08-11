from sqlalchemy import (
    Column,
    Integer,
    VARCHAR,
    ForeignKey,
    TIMESTAMP,
    Index,
    BigInteger,
    text,
    Sequence,
)

from .base import Base
from .five_x_five_users import FiveXFiveUser
from .leads_visits import LeadsVisits
from .leads_users import LeadUser
from .users_domains import UserDomains


class AnonymousRequests(Base):
    __tablename__ = "anonymous_requests"

    id = Column(
        BigInteger,
        Sequence("anonymous_requests_id_seq", metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    trovo_id = Column(VARCHAR(128), nullable=True)
    page = Column(VARCHAR(1024), nullable=False)
    requested_at = Column(TIMESTAMP, nullable=False)
    visit_id = Column(
        BigInteger,
        ForeignKey("anonymous_visits.id", ondelete="CASCADE"),
        nullable=False,
    )
    page_parameters = Column(VARCHAR(2048), nullable=True)
    spent_time_sec = Column(BigInteger, nullable=False)
    domain_id = Column(
        Integer,
        ForeignKey("users_domains.id", ondelete="SET NULL"),
        nullable=True,
    )
