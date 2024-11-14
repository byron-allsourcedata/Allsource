import os

from .base import Base

class BigcommerceConfig(Base):
    client_id = os.getenv('BIGCOMMERCE_CLIENT_ID')
    client_secret = os.getenv('BIGCOMMERCE_CLIENT_SECRET')
    redirect_uri = os.getenv('BIGCOMMERCE_REDIRECT_URI')
    frontend_redirect = f'{os.getenv("SITE_HOST_URL")}/{os.getenv("INTEGRATIONS_PART_URL")}'
    frontend_dashboard_redirect = f'{os.getenv("SITE_HOST_URL")}/{os.getenv("DASHBOARD_PART_URL")}'
    token_url = os.getenv('BIGCOMMERCE_TOKEN_URL')