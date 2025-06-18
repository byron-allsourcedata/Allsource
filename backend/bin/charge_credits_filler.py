import asyncio
import logging
import os
import sys

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models import Users, UserSubscriptions, SubscriptionPlan
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
from sqlalchemy import create_engine
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker, Session
from enums import (
    PlanAlias,
)

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


async def prepare_users_for_billing(rmq_connection: RabbitMQConnection, session: Session):
    logging.info("Preparing users for billing...")
    results = (
        session.query(Users.id)
        .join(
            UserSubscriptions,
            UserSubscriptions.id == Users.current_subscription_id,
        )
        .join(
            SubscriptionPlan, SubscriptionPlan.id == UserSubscriptions.plan_id
        )
        .filter(
            SubscriptionPlan.alias == PlanAlias.BASIC.value,
            Users.overage_leads_count > 0,
        )
        .all()
    )
    user_ids = [result.id for result in results]
    logging.info(
        f"Found {len(user_ids)} users with overage leads for BASIC plan."
    )
    if not user_ids:
        logging.info("No users to bill at this time.")
        return

    msg = {"user_ids": user_ids}
    await send_leads_to_queue(rmq_connection, msg)
    logging.info(
        f"Successfully sent {len(user_ids)} user IDs to billing queue."
    )


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
            logging.debug("Closing the database session...")
            db_session.close()
        if rabbitmq_connection:
            logging.debug("Closing RabbitMQ connection...")
            await rabbitmq_connection.close()


if __name__ == "__main__":
    asyncio.run(main())
