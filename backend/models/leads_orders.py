from sqlalchemy import Column, Integer, VARCHAR, DECIMAL, TIMESTAMP
from datetime import datetime
from .base import Base


class LeadOrders(Base):
    __tablename__ = 'leads_orders'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    platform = Column(VARCHAR)
    platform_user_id = Column(VARCHAR)
    platform_order_id = Column(VARCHAR)
    lead_user_id = Column(Integer)
    total_price = Column(DECIMAL(10, 2))
    currency_code = Column(VARCHAR)
    created_at = Column(TIMESTAMP, default=datetime.now)
    platform_created_at = Column(TIMESTAMP)
    platfrom_email = Column(VARCHAR)

