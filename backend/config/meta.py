import os

from .base import Base

class MetaConfig(Base):
    app_secret = os.getenv('META_APP_SECRET')
    app_piblic = os.getenv('META_APP_ID')