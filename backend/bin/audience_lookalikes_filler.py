import logging
import os
import sys
import asyncio
import functools
import json
from aio_pika import IncomingMessage
from dotenv import load_dotenv

from sqlalchemy.orm import Session


current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from db_dependencies import Db
from resolver import Resolver

from services.lookalike_filler import LookalikeFillerService

from config.sentry import SentryConfig
from config.rmq_connection import publish_rabbitmq_message_with_channel
from config.rmq_connection import (
    RabbitMQConnection,
    publish_rabbitmq_message_with_channel,
)
from sqlalchemy.orm import Session


load_dotenv()

AUDIENCE_LOOKALIKES_MATCHING = "audience_lookalikes_matching"
AUDIENCE_LOOKALIKES_READER = "audience_lookalikes_reader"
SLEEP_INTERVAL = 60 * 10
SELECTED_ROW_COUNT = 500
AUDIENCE_LOOKALIKES_PROGRESS = "AUDIENCE_LOOKALIKES_PROGRESS"


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


async def send_sse(channel, user_id: int, data: dict):
    try:
        logging.info(f"send client throught SSE: {data, user_id}")
        await publish_rabbitmq_message_with_channel(
            channel=channel,
            queue_name=f"sse_events_{str(user_id)}",
            message_body={"status": AUDIENCE_LOOKALIKES_PROGRESS, "data": data},
        )
    except Exception as e:
        logging.error(f"Error sending SSE: {e}")


def get_max_size(lookalike_size):
    if lookalike_size == "almost_identical":
        size = 10000
    elif lookalike_size == "extremely_similar":
        size = 50000
    elif lookalike_size == "very_similar":
        size = 100000
    elif lookalike_size == "quite_similar":
        size = 200000
    elif lookalike_size == "broad":
        size = 500000

    return size


async def aud_sources_reader(
    message: IncomingMessage,
    db_session: Session,
    channel,
    filler: LookalikeFillerService,
):
    try:
        message_body = json.loads(message.body)
        logging.info(f"msg body {message_body}")
        lookalike_id = message_body.get("lookalike_id")

        audience_lookalike = filler.get_lookalike(lookalike_id)

        if not audience_lookalike:
            logging.info(f"audience_lookalike with id {lookalike_id} not found")
            await message.ack()
            return

        total_rows = get_max_size(audience_lookalike.lookalike_size)

        user_ids = filler.process_lookalike_pipeline(
            audience_lookalike=audience_lookalike
        )

        await send_sse(
            channel,
            audience_lookalike.user_id,
            {
                "lookalike_id": str(audience_lookalike.id),
                "total": total_rows,
                "processed": 0,
            },
        )

        # i'm not sure why this was necessary
        # if not enrichment_lookalike_scores:
        #     await message.ack()
        #     return

        print(f"lookalike persons: {len(user_ids)}")

        audience_lookalike = db_session.merge(audience_lookalike)

        await filler.inform_lookalike_agent(
            channel,
            lookalike_id=audience_lookalike.id,
            user_id=audience_lookalike.user_id,
            persons=user_ids,
        )

        db_session.commit()
        await message.ack()
    except BaseException as e:
        db_session.rollback()
        logging.error(f"Error processing message: {e}", exc_info=True)
        await message.reject(requeue=True)


async def main():
    await SentryConfig.async_initilize()
    log_level = logging.INFO
    if len(sys.argv) > 1:
        arg = sys.argv[1].upper()
        if arg == "DEBUG":
            log_level = logging.DEBUG
        elif arg != "INFO":
            sys.exit("Invalid log level argument. Use 'DEBUG' or 'INFO'.")

    setup_logging(log_level)

    resolver = Resolver()
    try:
        logging.info("Starting processing...")
        rmq_connection = RabbitMQConnection()
        connection = await rmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        db_session = await resolver.resolve(Db)
        filler = await resolver.resolve(LookalikeFillerService)

        reader_queue = await channel.declare_queue(
            name=AUDIENCE_LOOKALIKES_READER,
            durable=True,
            arguments={
                "x-consumer-timeout": 14400000,
            },
        )
        await reader_queue.consume(
            functools.partial(
                aud_sources_reader,
                db_session=db_session,
                channel=channel,
                filler=filler,
            )
        )

        await asyncio.Future()

    except BaseException as e:
        db_session.rollback()
        logging.error("Unhandled Exception:", exc_info=True)
        SentryConfig.capture(e)
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        if rmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rmq_connection.close()
        await resolver.cleanup()
        logging.info("Shutting down...")


if __name__ == "__main__":
    asyncio.run(main())
