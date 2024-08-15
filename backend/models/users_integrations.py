from .base import Base
from sqlalchemy import VARCHAR, Integer, Column

class UserIntegration(Base):
    __tablename__ = 'users_integrations'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    shop_domain = Column(VARCHAR)
    access_token = Column(VARCHAR)
    service_name = Column(VARCHAR)
