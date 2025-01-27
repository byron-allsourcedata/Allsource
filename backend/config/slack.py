import os

from .base import Base


class SlackConfig(Base):
    client_id = os.getenv("SLACK_CLIENT_ID")
    client_secret = os.getenv("SLACK_CLIENT_SECRET")
    redirect_url = f"{os.getenv('API_SITE_HOST_URL')}/api/{os.getenv('SLACK_REDIRECT_URI')}"
    frontend_redirect = f'{os.getenv("SITE_HOST_URL")}/{os.getenv("INTEGRATIONS_PART_URL")}'
    sign_up_redirect = f'{os.getenv("SITE_HOST_URL")}/signup'
    bot_user_OAuth_token = 'xoxb-7252195355281-8324522205318-oJRRClR3CFto92oK7K7aBo6P'
