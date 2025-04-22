from sqlalchemy import Column, Boolean, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from .base import Base


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
    pets = Column(Boolean, nullable=True)
    cooking_enthusiast = Column(Boolean, nullable=True)
    travel = Column(Boolean, nullable=True)
    mail_order_buyer = Column(Boolean, nullable=True)
    online_purchaser = Column(Boolean, nullable=True)
    book_reader = Column(Boolean, nullable=True)
    health_and_beauty = Column(Boolean, nullable=True)
    fitness = Column(Boolean, nullable=True)
    outdoor_enthusiast = Column(Boolean, nullable=True)
    tech_enthusiast = Column(Boolean, nullable=True)
    diy = Column(Boolean, nullable=True)
    gardening = Column(Boolean, nullable=True)
    automotive_buff = Column(Boolean, nullable=True)
    golf_enthusiasts = Column(Boolean, nullable=True)
    beauty_cosmetics = Column(Boolean, nullable=True)
    smoker = Column(Boolean, nullable=True)
