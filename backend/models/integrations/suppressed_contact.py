from models.base import Base
from sqlalchemy import Integer, Column, TIMESTAMP, ForeignKey, Index, VARCHAR
from datetime import datetime

class SuppressedContact(Base):
    __tablename__ = 'suppressed_contacts'
    __table_args__ = (
        Index('ix_suppressed_contacts_domain_id', 'domain_id'),  
    )

    
    id = Column(Integer, primary_key=True, autoincrement=True)
    five_x_five_user_id = Column(Integer, ForeignKey("5x5_users.id"), nullable=False)
    domain_id = Column(Integer, ForeignKey("users_domains.id"), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.now)
    requested_at = Column(TIMESTAMP, default=datetime.now)
    suppression_type = Column(VARCHAR)
