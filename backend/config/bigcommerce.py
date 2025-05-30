import os

from .base import Base

class BigcommerceConfig(Base):
    client_id = os.getenv('BIGCOMMERCE_CLIENT_ID')
    client_secret = os.getenv('BIGCOMMERCE_CLIENT_SECRET')
    redirect_uri = f"{os.getenv('API_SITE_HOST_URL')}/api/integrations/bigcommerce/auth/callback"
    frontend_redirect = f'{os.getenv("SITE_HOST_URL")}/{os.getenv("INTEGRATIONS_PART_URL")}'
    frontend_dashboard_redirect = f'{os.getenv("SITE_HOST_URL")}/dashboard'
    frontend_get_started_redirect = f'{os.getenv("SITE_HOST_URL")}/get-started?pixel=true'
    token_url = os.getenv('BIGCOMMERCE_TOKEN_URL')
    external_app_installed = f"{os.getenv('SITE_HOST_URL')}/{os.getenv('EXTERNAL_APP_INSTALLED')}"
    frontend_sign_up_redirect = f'{os.getenv("SITE_HOST_URL")}/signup'
    frontend_sign_in_redirect = f'{os.getenv("SITE_HOST_URL")}/signin'