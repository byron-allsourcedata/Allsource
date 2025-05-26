from sqlalchemy import Column, ForeignKey, text, Index, String
from sqlalchemy.dialects.postgresql import UUID

from models.base import Base


class EnrichmentLifestyle(Base):
    __tablename__ = 'enrichment_lifestyles'
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    asid = Column(
        UUID(as_uuid=True),
        ForeignKey('enrichment_users.asid', ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False
    )
    pets = Column(String(8), nullable=False)
    cooking_enthusiast = Column(String(8), nullable=False)
    travel = Column(String(8), nullable=False)
    mail_order_buyer = Column(String(8), nullable=False)
    online_purchaser = Column(String(8), nullable=False)
    book_reader = Column(String(8), nullable=False)
    health_and_beauty = Column(String(8), nullable=False)
    fitness = Column(String(8), nullable=False)
    outdoor_enthusiast = Column(String(8), nullable=False)
    tech_enthusiast = Column(String(8), nullable=False)
    diy = Column(String(8), nullable=False)
    gardening = Column(String(8), nullable=False)
    automotive_buff = Column(String(8), nullable=False)
    golf_enthusiasts = Column(String(8), nullable=False)
    beauty_cosmetics = Column(String(8), nullable=False)
    smoker = Column(String(8), nullable=False)
    
    __table_args__ = (
        Index("ix_lifestyle_asid", asid),
    )
