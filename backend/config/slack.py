import os

from .base import Base


class SlackConfig(Base):
    client_id = os.getenv("SLACK_CLIENT_ID")
    client_secret = os.getenv("SLACK_CLIENT_SECRET")
    redirect_url = f"https://api-dev.maximiz.ai/api/{os.getenv('SLACK_REDIRECT_URI')}"
    frontend_redirect = f'{os.getenv("SITE_HOST_URL")}/{os.getenv("INTEGRATIONS_PART_URL")}'
