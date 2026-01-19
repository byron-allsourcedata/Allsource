from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from .base import Base
from config.util import getenv, get_int_env


class AsyncSqlConfig(Base):
    def __init__(self):
        super().__init__()
        self.host: str = getenv("DB_HOST")
        self.port: int = get_int_env("DB_PORT")
        self.username: str = getenv("DB_USERNAME")
        self.password: str = getenv("DB_PASSWORD")
        self.db_name: str = getenv("DB_NAME")

    @property
    def url(self) -> str:
        return (
            f"postgresql+asyncpg://"
            f"{self.username}:{self.password}"
            f"@{self.host}:{self.port}/{self.db_name}"
        )


async_sql_config = AsyncSqlConfig()

async_engine = create_async_engine(
    async_sql_config.url,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=100,
    pool_recycle=60 * 60,
    pool_timeout=10,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)
