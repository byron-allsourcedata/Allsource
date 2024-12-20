import asyncio
import logging
import os
import sys
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from dotenv import load_dotenv
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
from sqlalchemy import create_engine
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker
from models.integrations.users_domains_integrations import UserIntegration
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config.rmq_connection import RabbitMQConnection

load_dotenv()

DATA_SYNC_INTEGRATION = 'data_sync_integration'
BATCH_SIZE = 100
SLEEP_INTERVAL = 6 * 60 * 60

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

async def process_batch(rmq_connection, users_domains_integrations):
    for users_domains_integration in users_domains_integrations:
        await publish_rabbitmq_message(
            connection=rmq_connection,
            queue_name=DATA_SYNC_INTEGRATION,
            message_body={'users_domains_integration': users_domains_integration._dict_}
        )

async def process_files(rmq_connection, session):
    offset = 0
    while True:
        users_domains_integrations = (
            session.query(UserIntegration)
            .offset(offset)
            .limit(BATCH_SIZE)
            .all()
        )

        if not users_domains_integrations:
            break

        await process_batch(rmq_connection, users_domains_integrations)
        offset += BATCH_SIZE

async def main():
    log_level = logging.INFO
    if len(sys.argv) > 1:
        arg = sys.argv[1].upper()
        if arg == 'DEBUG':
            log_level = logging.DEBUG
        elif arg == 'INFO':
            log_level = logging.INFO
        else:
            sys.exit("Invalid log level argument. Use 'DEBUG' or 'INFO'.")

    setup_logging(log_level)

    db_username = os.getenv('DB_USERNAME')
    db_password = os.getenv('DB_PASSWORD')
    db_host = os.getenv('DB_HOST')
    db_name = os.getenv('DB_NAME')

    engine = create_engine(
        f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}", pool_pre_ping=True
    )
    Session = sessionmaker(bind=engine)

    while True:
        db_session = None
        rabbitmq_connection = None
        try:
            logging.info("Starting processing...")

            rabbitmq_connection = RabbitMQConnection()
            rmq_connection = await rabbitmq_connection.connect()

            channel = await rmq_connection.channel()
            await channel.set_qos(prefetch_count=1)

            db_session = Session()

            await process_files(rmq_connection, db_session)

            logging.info("Processing completed. Sleeping for 6 hours...")
        except Exception as err:
            logging.error('Unhandled Exception:', exc_info=True)
        finally:
            if db_session:
                logging.info("Closing the database session...")
                db_session.close()
            if rabbitmq_connection:
                logging.info("Closing RabbitMQ connection...")
                await rabbitmq_connection.close()

        await asyncio.sleep(SLEEP_INTERVAL)

if __name__ == "__main__":
    asyncio.run(main())
