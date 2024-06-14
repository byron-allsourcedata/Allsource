import os

from .base import Base


class AuthConfigBase(Base):
    expire_days = 7
    algorithm = "HS256"


class AuthConfigDev(AuthConfigBase):
    secret_key = os.getenv('SECRET_KEY_DEV')


class AuthConfigProd(AuthConfigBase):
    secret_key = os.getenv('SECRET_KEY_PROD')


auth_config = {"dev": AuthConfigDev, "prod": AuthConfigProd}

AuthConfig = auth_config[os.getenv("ENV", "dev")]()
