from sqlalchemy import Column, Integer, VARCHAR, Float, TIMESTAMP
from datetime import datetime
from .base import Base


class LeadOrders(Base):
    __tablename__ = 'leads_user'
    id = Column(Integer, primary_key=True, autoincrement=True)
    lead_user_id = Column(Integer)
    shopify_order_id = Column(Integer)
    shopify_user_id = Column(Integer)
    total_price = Column(Float)
    currency_code = Column(VARCHAR(8))
    created_at_shopify = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, default=datetime.now)