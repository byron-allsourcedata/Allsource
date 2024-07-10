import os

from .base import Base


class StripeConfig(Base):
    api_key = os.getenv("STRIPE_API_KEY")
    success_url = os.getenv("STRIPE_SUCCESS_IRL")
    cancel_url = os.getenv("STRIPE_CANCEL_URL")
