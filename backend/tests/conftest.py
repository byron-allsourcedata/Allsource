import os
import sys
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from services.audience_smarts import AudienceSmartsService
from resolver import Resolver
from db_dependencies import Db

DATABASE_URL = (
    f"postgresql://{os.getenv('TEST_DB_USERNAME')}:{os.getenv('TEST_DB_PASSWORD')}"
    f"@{os.getenv('TEST_DB_HOST')}:{os.getenv('TEST_DB_PORT')}/{os.getenv('TEST_DB_NAME')}"
)

# DATABASE_URL = (
#     f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}"
#     f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
# )

engine = create_engine(DATABASE_URL)

SessionLocal = scoped_session(sessionmaker(bind=engine))


@pytest.fixture(scope="session")
def db_session():
    connection = engine.connect()
    Session = sessionmaker(bind=connection)
    session = Session()

    try:
        yield session
    finally:
        session.close()
        connection.close()


@pytest.fixture
async def service(db_session):
    resolver = Resolver()
    resolver.inject(Db, db_session)
    service = await resolver.resolve(AudienceSmartsService)
    return service
