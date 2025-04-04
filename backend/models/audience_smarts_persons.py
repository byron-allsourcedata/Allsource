from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, UUID

from models.audience_smarts import AudienceSmart
from models.five_x_five_users import FiveXFiveUser
from .base import Base
from sqlalchemy.sql import func


class AudienceSmartPerson(Base):
    __tablename__ = 'audience_smarts_persons'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    smart_audience_id = Column(UUID(as_uuid=True), ForeignKey(AudienceSmart.id, ondelete='cascade'), nullable=False)
    five_x_five_user_id = Column(UUID(as_uuid=True), ForeignKey(FiveXFiveUser.id), nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.now(), onupdate=func.now())
