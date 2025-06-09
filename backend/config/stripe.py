import os

from .base import Base


class StripeConfig(Base):
    api_key = os.getenv("STRIPE_API_KEY")
    success_url = f"{os.getenv('SITE_HOST_URL')}/{os.getenv('STRIPE_SUCCESS_URL')}"
    cancel_url = f"{os.getenv('SITE_HOST_URL')}/{os.getenv('STRIPE_CANCEL_URL')}"
