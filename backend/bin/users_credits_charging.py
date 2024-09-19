import asyncio
import functools
import json
import logging
import os
import sys

import pandas as pd
from sqlalchemy import create_engine

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from models.five_x_five_locations import FiveXFiveLocations
from models.five_x_five_users_locations import FiveXFiveUsersLocations
from models.five_x_five_phones import FiveXFivePhones
from models.five_x_five_users_phones import FiveXFiveUsersPhones
from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_names import FiveXFiveNames
from models.state import States
from models.subscriptions import SubscriptionPlan
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from config.rmq_connection import RabbitMQConnection
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import sessionmaker
from models.users import Users
from models.five_x_five_users import FiveXFiveUser
from services.stripe_service import purchase_product
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

QUEUE_CREDITS_CHARGING = 'credits_charging'
CREDITS = 'Additional_prospect_credits'

async def on_message_received(message, session):
    try:
        message_json = json.loads(message.body)
        customer_id = message_json['customer_id']
        credits = abs(message_json['credits'])
        stripe_price_id = session.query(SubscriptionPlan.stripe_price_id).filter(SubscriptionPlan.title == CREDITS).scalar()
        result = purchase_product(customer_id, stripe_price_id, credits)
        if result['success']:
            session.query(Users).filter(Users.customer_id == customer_id).update(
                {Users.leads_credits: Users.leads_credits + credits},
                synchronize_session=False
            )
            session.commit()
        else:
            logging.error(f"excepted message. {result['error']}", exc_info=True)
        await message.ack()

    except Exception as e:
        logging.error("excepted message. error", exc_info=True)
        await asyncio.sleep(5)
        await message.reject(requeue=True)


async def main():
    logging.info("Started")
    db_session = None
    rabbitmq_connection = None
    try:
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        queue = await channel.declare_queue(
            name=QUEUE_CREDITS_CHARGING,
            durable=True,
            arguments={
                'x-consumer-timeout': 3600000,
            }
        )

        engine = create_engine(
            f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()
        await queue.consume(
            functools.partial(on_message_received, session=db_session)
        )
        await asyncio.Future()
    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        if rabbitmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rabbitmq_connection.close()
        logging.info("Shutting down...")


if __name__ == "__main__":
    asyncio.run(main())
