import asyncio
import json
import logging
import os
import sys
import functools
from datetime import datetime

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from utils import send_sse
from services.stripe_service import StripeService
from models import (
    Users,
    UserSubscriptions,
    SubscriptionPlan,
    TransactionHistory,
)
from aio_pika import IncomingMessage, Channel
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

def save_transaction(db_session, event_data):
    created_dt = datetime.fromtimestamp(event_data["created"])

    tx = TransactionHistory(
        id=event_data["identifier"],
        event_name=event_data["event_name"],
        identifier=event_data["identifier"],
        customer_id=event_data["payload"]["stripe_customer_id"],
        quantity=int(event_data["payload"]["value"]),
        created=created_dt,
    )
    db_session.add(tx)

async def process_rmq_message(
    message: IncomingMessage,
    db_session: Session,
    channel: Channel
):
    try:
        body = json.loads(message.body)
        user_ids = body.get("user_ids")
        result_users = (
            db_session.query(Users.id, Users.customer_id, Users.overage_leads_count)
            .filter(Users.id.in_(user_ids))
            .all()
        )
        for user_id, customer_id, overage_leads_count in result_users:
            event_data = StripeService.record_usage(customer_id=customer_id, quantity=overage_leads_count)
            save_transaction(db_session=db_session, event_data=event_data)
            await send_sse(
                channel=channel,
                user_id=user_id,
                data={
                    "data": user_id,
                },
            )
            logging.info("sent sse with total count")

        db_session.commit()
        # await message.ack()

    except Exception as e:
        logging.error(f"Error processing validation: {e}", exc_info=True)
        db_session.rollback()
        await message.reject(requeue=True)


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
        queue = await channel.declare_queue(
            name=CHARGE_CREDITS_FILLER,
            durable=True,
        )
        db_session = Session()

        await queue.consume(
            functools.partial(
                process_rmq_message,
                channel=channel,
                db_session=db_session
            ),
        )

        await asyncio.Future()
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
