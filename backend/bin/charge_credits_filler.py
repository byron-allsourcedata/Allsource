import asyncio
import logging
import os
import sys

from models import Users, UserSubscriptions, SubscriptionPlan

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
from sqlalchemy import create_engine, and_, or_, select
from dotenv import load_dotenv
from models.leads_visits import LeadsVisits
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timezone, timedelta
from enums import (
    DataSyncImportedStatus,
    ProccessDataSyncResult,
    SourcePlatformEnum,
    DataSyncType,
    PlanAlias,
)
from utils import get_utc_aware_date
from models.leads_users_added_to_cart import LeadsUsersAddedToCart
from models.leads_users_ordered import LeadsUsersOrdered
from models.users_domains import UserDomains
from sqlalchemy.dialects.postgresql import insert
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from models.data_sync_imported_leads import DataSyncImportedLead
from models.leads_users import LeadUser

load_dotenv()

CHARGE_CREDITS_FILLER = "charge_credits_filler"


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


async def send_leads_to_queue(rmq_connection, processed_lead):
    await publish_rabbitmq_message(
        connection=rmq_connection,
        queue_name=CHARGE_CREDITS_FILLER,
        message_body=processed_lead,
    )

async def prepare_users_for_billing(rmq_connection, session):
    results = (
        session.query(Users.id)
        .join(UserSubscriptions, UserSubscriptions.id == Users.current_subscription_id)
        .join(SubscriptionPlan, SubscriptionPlan.id == UserSubscriptions.plan_id)
        .filter(SubscriptionPlan.alias == PlanAlias.BASIC, Users.overage_leads_count > 0)
        .all()
    )
    user_ids = [result.id for result in results]

    msg = {'user_ids': user_ids}
    await send_leads_to_queue(rmq_connection, msg)


async def main():
    log_level = logging.INFO
    if len(sys.argv) > 1:
        arg = sys.argv[1].upper()
        if arg == "DEBUG":
            log_level = logging.DEBUG
        elif arg == "INFO":
            log_level = logging.INFO
        else:
            sys.exit("Invalid log level argument. Use 'DEBUG' or 'INFO'.")

    setup_logging(log_level)

    db_username = os.getenv("DB_USERNAME")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST")
    db_name = os.getenv("DB_NAME")

    engine = create_engine(
        f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}",
        pool_pre_ping=True,
    )
    Session = sessionmaker(bind=engine)
    db_session = None
    rabbitmq_connection = None
    try:
        logging.info("Starting processing...")

        rabbitmq_connection = RabbitMQConnection()
        rmq_connection = await rabbitmq_connection.connect()
        channel = await rmq_connection.channel()
        await channel.set_qos(prefetch_count=1)
        await channel.declare_queue(
            name=CHARGE_CREDITS_FILLER,
            durable=True,
        )
        db_session = Session()

        await prepare_users_for_billing(rmq_connection, db_session)

        logging.info("Processing completed. Sleeping for 10 minutes...")
    except Exception:
        logging.error("Unhandled Exception:", exc_info=True)
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        if rabbitmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rabbitmq_connection.close()


if __name__ == "__main__":
    asyncio.run(main())
