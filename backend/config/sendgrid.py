import os

from base import Base


class SendgridConfigBase(Base):
    api_key = os.getenv("SENDGRID_API_KEY")
