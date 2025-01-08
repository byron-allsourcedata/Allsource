from sqlalchemy import Column, event, Integer, TIMESTAMP, VARCHAR
from .base import Base, create_timestamps, update_timestamps


class ParntersInvitations(Base):
    __tablename__ = "partners_users_invitations"

    id = Column(Integer, primary_key=True, nullable=False)
    user_id = Column(Integer, nullable=True)
    partner_id = Column(Integer, nullable=True)
    email = Column(VARCHAR(64), nullable=False)
    name = Column(VARCHAR(64), nullable=False)
    status = Column(VARCHAR(16), default="Invite sent", nullable=False)
    created_at = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, nullable=False)
    
    def to_dict(self):
            return {
                "user_id": self.user_id,
                "name": self.name,
                "partner_id": self.partner_id,
                "status": self.status,
                "email": self.email,
            }

event.listen(ParntersInvitations, "before_insert", create_timestamps)
event.listen(ParntersInvitations, "before_update", update_timestamps)
