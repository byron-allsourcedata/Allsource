import os

from .base import Base


class AuthConfig(Base):
    expire_days = 7
    algorithm = "HS256"
    secret_key = os.getenv('SECRET_KEY')
