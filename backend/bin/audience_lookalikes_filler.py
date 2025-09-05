import asyncio
import json
import logging
import sys

import aio_pika
from dotenv import load_dotenv

from services.lookalikes import AudienceLookalikesService
from enums import LookalikeStatus
from config.util import get_int_env
from db_dependencies import Db
from resolver import Resolver


from config.sentry import SentryConfig
from config.rmq_connection import (
    RabbitMQConnection,
    publish_rabbitmq_message_with_channel,
)
from sqlalchemy.orm import Session

from services.lookalike_filler import LookalikeFillerService


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
    except BaseException as e:
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
    message_body,
    db_session: Session,
    connection,
    channel,
    filler: LookalikeFillerService,
    audience_lookalikes_service: AudienceLookalikesService,
):
    message_body_json = json.loads(message_body)
    logging.info(f"msg body {message_body_json}")
    lookalike_id = message_body_json["lookalike_id"]
    audience_lookalikes_service.change_status(
        status=LookalikeStatus.STARTED.value, lookalike_id=lookalike_id
    )
    try:
        audience_lookalike = filler.get_lookalike(lookalike_id)

        if not audience_lookalike:
            logging.info(f"audience_lookalike with id {lookalike_id} not found")
            return

        total_rows = get_max_size(audience_lookalike.lookalike_size)

        user_ids = filler.process_lookalike_pipeline(
            audience_lookalike=audience_lookalike
        )

        audience_lookalike = db_session.merge(audience_lookalike)

        try:
            await channel.close()
            await connection.close()
        except BaseException as e:
            logging.error(f"Close conn: {e}", exc_info=True)

        rmq_connection = RabbitMQConnection()
        connection = await rmq_connection.connect()
        channel = await connection.channel()
        await filler.inform_lookalike_agent(
            channel,
            lookalike_id=audience_lookalike.id,
            user_id=audience_lookalike.user_id,
        )
        await channel.close()
        await connection.close()

        db_session.commit()

        rmq_connection = RabbitMQConnection()
        connection = await rmq_connection.connect()
        channel = await connection.channel()

        await send_sse(
            channel,
            audience_lookalike.user_id,
            {
                "lookalike_id": str(audience_lookalike.id),
                "total": total_rows,
                "processed": 0,
            },
        )
        logging.info("Done")
    except BaseException as e:
        db_session.rollback()
        audience_lookalikes_service.change_status(
            status=LookalikeStatus.FAILED.value, lookalike_id=lookalike_id
        )
        logging.error(f"Error processing message: {e}", exc_info=True)
        await asyncio.sleep(5)
        await publish_rabbitmq_message_with_channel(
            channel=channel,
            queue_name=AUDIENCE_LOOKALIKES_READER,
            message_body=message_body,
        )


async def main():
    await SentryConfig.async_initilize()
    bulk_size = get_int_env("LOOKALIKE_BULK_SIZE")

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
        logging.info(f"Bulk size = {bulk_size}")

        rmq_connection = RabbitMQConnection()
        connection = await rmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        db_session = await resolver.resolve(Db)
        filler = await resolver.resolve(LookalikeFillerService)
        audience_lookalikes_service = await resolver.resolve(
            AudienceLookalikesService
        )

        reader_queue = await channel.declare_queue(
            name=AUDIENCE_LOOKALIKES_READER,
            durable=True,
            arguments={
                "x-consumer-timeout": 14400000,
            },
        )
        while True:
            try:
                reader_queue = await channel.declare_queue(
                    name=AUDIENCE_LOOKALIKES_READER,
                    durable=True,
                    arguments={
                        "x-consumer-timeout": 14400000,
                    },
                )
                message = await reader_queue.get(no_ack=False)
                await message.ack()
                await aud_sources_reader(
                    message_body=message.body,
                    db_session=db_session,
                    connection=connection,
                    channel=channel,
                    filler=filler,
                    audience_lookalikes_service=audience_lookalikes_service,
                )

            except aio_pika.exceptions.QueueEmpty as e:
                await asyncio.sleep(1)

            try:
                await channel.close()
                await connection.close()
            except BaseException as e:
                logging.error(f"Close conn 2: {e}", exc_info=True)

            rmq_connection = RabbitMQConnection()
            connection = await rmq_connection.connect()
            channel = await connection.channel()

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
