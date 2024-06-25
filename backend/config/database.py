import os


from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.config.base import Base
from dotenv import load_dotenv

load_dotenv()


class SqlConfigBase(Base):

    def __init__(self):
        self.host: str = os.getenv("DB_HOST")
        self.port: str = os.getenv("DB_PORT")
        self.username: str = os.getenv("DB_USERNAME")
        self.password: str = os.getenv("DB_PASSWORD")
        self.db_name: str = os.getenv("DB_NAME")

    @property
    def url(self) -> str:
        return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.db_name}"


sql_config = SqlConfigBase()
database_uri: str = sql_config.url


engine = create_engine(
    database_uri,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=100,
    pool_recycle=60 * 60,
    pool_timeout=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
