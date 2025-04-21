import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

from dotenv import load_dotenv

load_dotenv()

config = context.config

database_url = f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"

if not database_url:
    raise RuntimeError("database_url не задан в .env или окружении нет переменных")
config.set_main_option("sqlalchemy.url", database_url)

fileConfig(config.config_file_name)

from models.base import *
target_metadata = Base.metadata

def run_migrations_offline():
    context.configure(
        url=database_url,
        target_metadata=target_metadata,
        literal_binds=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
