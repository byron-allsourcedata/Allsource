import asyncio
import functools
import json
import logging
import os
import sys
from datetime import datetime

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from config.sentry import SentryConfig
from db_dependencies import Db
from resolver import Resolver
from services.stripe_service import StripeService
from models import (
    TransactionHistory,
)
from aio_pika import IncomingMessage, Channel
from config.rmq_connection import RabbitMQConnection
from dotenv import load_dotenv
from sqlalchemy.orm import Session

load_dotenv()

CHARGE_CREDITS = "charge_credits"


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
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
    message: IncomingMessage, db_session: Session, channel: Channel
):
    try:
        body = json.loads(message.body)
        overage_leads_count = body.get("overage_leads_count")
        customer_id = body.get("customer_id")
        event_data = StripeService.record_usage(
            customer_id=customer_id, quantity=overage_leads_count
        )
        logging.info(f"event sent{event_data}")
        save_transaction(db_session=db_session, event_data=event_data)

        db_session.commit()
        await message.ack()

    except Exception as e:
        logging.error(f"Error processing validation: {e}", exc_info=True)
        db_session.rollback()
        await message.reject(requeue=True)


async def main():
    await SentryConfig.async_initilize()
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

    resolver = Resolver()
    db_session = await resolver.resolve(Db)
    rabbitmq_connection = None
    try:
        logging.info("Starting processing...")

        rabbitmq_connection = RabbitMQConnection()
        rmq_connection = await rabbitmq_connection.connect()
        channel = await rmq_connection.channel()
        await channel.set_qos(prefetch_count=1)
        queue = await channel.declare_queue(
            name=CHARGE_CREDITS,
            durable=True,
        )

        await queue.consume(
            functools.partial(
                process_rmq_message, channel=channel, db_session=db_session
            ),
        )

        await asyncio.Future()
    except Exception as e:
        logging.error("Unhandled Exception:", exc_info=True)
        SentryConfig.capture(e)
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        if rabbitmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rabbitmq_connection.close()


if __name__ == "__main__":
    asyncio.run(main())
