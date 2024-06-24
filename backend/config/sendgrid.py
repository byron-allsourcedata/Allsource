import os

from .base import Base


class SendgridConfigBase(Base):
    api_key = os.getenv("SENDGRID_API_KEY")
    email_verification_template_id = "d-271df0fda09d4040ae4beeb1471b1a12"
