from sqlalchemy import Column, event, Integer, TIMESTAMP, BOOLEAN, VARCHAR
from .base import Base, create_timestamps, update_timestamps


class Partner(Base):
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, nullable=False)
    user_id = Column(Integer, nullable=True)
    master_id = Column(Integer, nullable=True)
    commission = Column(Integer, nullable=False)
    email = Column(VARCHAR(64), nullable=False)
    name = Column(VARCHAR(64), nullable=False)
    company_name = Column(VARCHAR(64), nullable=True)
    join_date = Column(TIMESTAMP, nullable=True)
    token = Column(VARCHAR(256), nullable=False)
    status = Column(VARCHAR(16), default="invitation sent", nullable=False)
    is_master = Column(BOOLEAN, default=False, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, nullable=False)
    is_active = Column(BOOLEAN, nullable=False, default=True)
    
    def to_dict(self):
            return {
                "user_id": self.user_id,
                "commission": self.commission,
                "status": self.status,
                "email": self.email,
                "name": self.name,
                "isMaster": self.is_master,
                "company_name": self.company_name,
                "join_date": self.join_date,
                "is_active": self.is_active
            }

event.listen(Partner, "before_insert", create_timestamps)
event.listen(Partner, "before_update", update_timestamps)
