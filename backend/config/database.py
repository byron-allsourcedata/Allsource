import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.config.base import Base
from dotenv import load_dotenv

load_dotenv()

class SqlConfigBase(Base):
    host = os.getenv("SMI_DB_HOST")
    port = os.getenv("SMI_DB_PORT")
    username = os.getenv("SMI_DB_USERNAME")
    password = os.getenv("SMI_DB_PASSWORD")
    pool = 20
    driver = None

    @property
    def name(self):
        return f"lolly"

    @property
    def url(self):
        if self.driver:
            return f"postgresql://{self.username}:{self.password}@{self.host}/{self.name}?driver={self.driver}"
        return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.name}"

    @property
    def session(self):
        return sessionmaker(bind=create_engine(self.url, pool_size=20))


def SqlConfig():
    env = os.getenv("ENV", "dev")
    if env == 'dev':
        return os.getenv("SMI_DB_NAME")
    else:
        return os.getenv("SMI_DB_NAME")

SqlConfig = SqlConfig()
database_uri = SqlConfig.url
engine = create_engine(
    database_uri,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=100,
    pool_recycle=60 * 60,
    pool_timeout=30,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
