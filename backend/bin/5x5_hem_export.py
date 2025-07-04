import asyncio
import functools
import json
import logging
import os
import sys
import time

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from config.sentry import SentryConfig
from resolver import Resolver
from dotenv import load_dotenv
from config.rmq_connection import RabbitMQConnection
from db_dependencies import Clickhouse

# Load environment variables
load_dotenv()
logging.basicConfig(level=logging.INFO)

# Configuration
QUEUE_HEMS_EXPORT = "5x5_hems_export"


def clickhouse_bulk_insert(hems: list[dict], ch_session: Clickhouse):
    rows = [(hem["UP_ID"], hem["SHA256_LC_HEM"]) for hem in hems]
    columns = ["up_id", "sha256_lc_hem"]
    query_result = ch_session.insert("five_x_five_hems", rows, columns)
    logging.info(f"Written rows to hems: {query_result.written_rows}")


async def on_message_received(message, ch_session):
    try:
        message_json = json.loads(message.body)
        hems = message_json["hems"]
        clickhouse_bulk_insert(hems, ch_session)
        await message.ack()
    except Exception as e:
        await message.reject(requeue=True)
        logging.error(f"Error processing message: {e}", exc_info=True)


async def main():
    await SentryConfig.async_initilize()
    logging.info("Started")
    resolver = Resolver()
    while True:
        try:
            rabbitmq_connection = RabbitMQConnection()
            connection = await rabbitmq_connection.connect()
            channel = await connection.channel()
            await channel.set_qos(prefetch_count=1)
            queue = await channel.declare_queue(
                name=QUEUE_HEMS_EXPORT,
                durable=True,
                arguments={
                    "x-consumer-timeout": 7200000,
                },
            )
            ch_session = await resolver.resolve(Clickhouse)

            await queue.consume(
                functools.partial(on_message_received, ch_session=ch_session)
            )
            await asyncio.Future()
        except Exception as err:
            SentryConfig.capture(err)
            logging.error(f"Unhandled Exception: {err}", exc_info=True)
        finally:
            logging.info("Shutting down...")
            await resolver.cleanup()
            await rabbitmq_connection.close()
            time.sleep(10)


if __name__ == "__main__":
    asyncio.run(main())
