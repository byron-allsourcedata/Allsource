import os

from .base import Base

class BigcommerceConfig(Base):
    client_id = os.getenv('BIGCOMMERCE_CLIENT_ID')
    client_secret = os.getenv('BIGCOMMERCE_CLIENT_SECRET')
    redirect_uri = os.getenv('BIGCOMMERCE_REDIRECT_URI')