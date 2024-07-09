import os

from .base import Base


class StripeConfig(Base):
    api_key = os.getenv("STRIPE_API_KEY")
