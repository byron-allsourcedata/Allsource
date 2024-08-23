from models.base import Base
from sqlalchemy import VARCHAR, Integer, Column, JSON

class UserIntegration(Base):
    __tablename__ = 'users_integrations'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    shop_domain = Column(VARCHAR)
    access_token = Column(VARCHAR)
    service_name = Column(VARCHAR)
    data_center = Column(VARCHAR)


class Integration(Base):

    __tablename__ = 'integrations'
    id = Column(Integer, primary_key=True)
    service_name = Column(VARCHAR)
    image_url = Column(VARCHAR)
    fields = Column(JSON)