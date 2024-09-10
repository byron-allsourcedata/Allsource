import asyncio
import functools
import gzip
import json
import logging
import os
import sys
import tempfile
import aioboto3
import boto3
import pandas as pd

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from dotenv import load_dotenv
from config.rmq_connection import RabbitMQConnection
from models.five_x_five_hems import FiveXFiveHems
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert

# Load environment variables
load_dotenv()
logging.basicConfig(level=logging.INFO)

# Configuration
QUEUE_EXPORT_HEMS = '5x5_export_hems'


async def on_message_received(message, db_session):
    try:
        message_json = json.loads(message.body)
        hem_json = message_json['hem']
        five_x_five_hems = insert(FiveXFiveHems).values(
            up_id=str(hem_json.get('UP_ID', None)),
            sha256_lc_hem=str(hem_json.get('SHA256_LC_HEM', None)),
            md5_lc_hem=str(hem_json.get('MD5_LC_HEM', None)),
            sha1_lc_hem=str(hem_json.get('SHA1_LC_HEM', None))
        ).on_conflict_do_nothing()
        db_session.execute(five_x_five_hems)
        db_session.commit()

        logging.info(f"{hem_json.get('UP_ID')} processed")
        await message.ack()
    except Exception as e:
        await message.reject(requeue=True)
        logging.error(f"Error processing message: {e}", exc_info=True)


async def main():
    logging.info("Started")
    try:
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        queue = await channel.declare_queue(
            name=QUEUE_EXPORT_HEMS,
            durable=True,
            arguments={
            'x-consumer-timeout': 7200000,
            }
        )

        engine = create_engine(
            f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()

        await queue.consume(
            functools.partial(on_message_received, db_session=db_session)
        )
        await asyncio.Future()
    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        logging.info('Shutting down...')
        await rabbitmq_connection.close()


if __name__ == "__main__":
    asyncio.run(main())