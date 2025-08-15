import os

from .base import Base
from config.util import getenv


class SendgridConfigBase(Base):
    api_key = os.getenv("SENDGRID_API_KEY")


class MailingConfig:
    default_logo_src = getenv("DEFAULT_LOGO_SRC")
    default_whitelabel_name = getenv("DEFAULT_WHITELABEL_NAME")
