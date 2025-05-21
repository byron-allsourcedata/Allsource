from os import getenv

from .base import Base


class AuthConfig(Base):
    expire_days = 7
    algorithm = "HS256"
    secret_key = getenv('AUTH_SECRET_KEY')
