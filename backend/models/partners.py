from sqlalchemy import Column, event, Integer, TIMESTAMP, TEXT, VARCHAR
from .base import Base, create_timestamps, update_timestamps


class Partners(Base):
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, nullable=False)
    user_id = Column(Integer, nullable=True)
    commission = Column(VARCHAR(16), nullable=False)
    token = Column(VARCHAR(256), nullable=False)
    status = Column(VARCHAR(16), default="Inactive", nullable=False)
    created_at = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, nullable=False)
    
    def to_dict(self):
            return {
                "user_id": self.user_id,
                "commission": self.commission,
                "status": self.status,
            }

event.listen(Partners, "before_insert", create_timestamps)
event.listen(Partners, "before_update", update_timestamps)
