import asyncio
import functools
import gzip
import json
import logging
import os
import sys
import time

from aio_pika import IncomingMessage
from dotenv import load_dotenv
from sqlalchemy import update, select
from sqlalchemy.orm import Session

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from config.sentry import SentryConfig
from services.insightsUtils import InsightsUtils
from models.audience_lookalikes import AudienceLookalikes

from db_dependencies import Db
from resolver import Resolver
from services.source_agent.agent import SourceAgentService

from models.audience_lookalikes_persons import AudienceLookalikesPerson
from config.rmq_connection import (
    RabbitMQConnection,
    publish_rabbitmq_message_with_channel,
)

load_dotenv()

AUDIENCE_LOOKALIKES_MATCHING = "audience_lookalikes_matching"
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


async def aud_sources_matching(
    message: IncomingMessage,
    db_session: Session,
    channel,
    source_agent: SourceAgentService,
):
    try:
        message_body = json.loads(message.body)
        user_id = message_body.get("user_id")
        lookalike_id = message_body.get("lookalike_id")
        enrichment_user_ids = message_body.get("enrichment_user")
        logging.info(f"Processing lookalike_id with ID: {lookalike_id}")
        logging.info(f"Processing len: {len(enrichment_user_ids)}")

        lookalike_persons_to_add = []
        for enrichment_user_id in enrichment_user_ids:
            matched_person = AudienceLookalikesPerson(
                lookalike_id=lookalike_id,
                enrichment_user_asid=enrichment_user_id,
            )
            lookalike_persons_to_add.append(matched_person)

        if lookalike_persons_to_add:
            db_session.bulk_save_objects(lookalike_persons_to_add)
            db_session.flush()

        processed_size, total_records = db_session.execute(
            update(AudienceLookalikes)
            .where(AudienceLookalikes.id == lookalike_id)
            .values(
                processed_size=AudienceLookalikes.processed_size
                + len(enrichment_user_ids)
            )
            .returning(
                AudienceLookalikes.processed_size, AudienceLookalikes.size
            )
        ).fetchone()

        db_session.commit()

        row = db_session.execute(
            select(AudienceLookalikes.insights).where(
                AudienceLookalikes.id == lookalike_id
            )
        ).scalar_one_or_none()
        existing_insights: dict | None = row or {}

        loop = asyncio.get_running_loop()
        new_insights = await loop.run_in_executor(
            None,
            InsightsUtils.compute_insights_for_lookalike,
            lookalike_id,
            db_session,
            source_agent,
        )
        merged = InsightsUtils.merge_insights_json(
            existing_insights, new_insights
        )

        json_data = json.dumps(merged)
        compressed_data = gzip.compress(json_data.encode("utf-8"))

        db_session.execute(
            update(AudienceLookalikes)
            .where(AudienceLookalikes.id == lookalike_id)
            .values(insights=compressed_data)
        )

        db_session.commit()

        await send_sse(
            channel,
            user_id,
            {
                "lookalike_id": lookalike_id,
                "total": total_records,
                "processed": processed_size,
            },
        )
        logging.info(f"ack")
        await message.ack()

    except BaseException as e:
        logging.error(f"Error processing matching: {e}", exc_info=True)
        await message.reject(requeue=True)
        db_session.rollback()


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
    while True:
        try:
            logging.info("Starting processing...")
            rmq_connection = RabbitMQConnection()
            connection = await rmq_connection.connect()
            channel = await connection.channel()
            await channel.set_qos(prefetch_count=1)

            db_session = await resolver.resolve(Db)
            source_agent = await resolver.resolve(SourceAgentService)

            queue = await channel.declare_queue(
                name=AUDIENCE_LOOKALIKES_MATCHING,
                durable=True,
            )
            await queue.consume(
                functools.partial(
                    aud_sources_matching,
                    channel=channel,
                    db_session=db_session,
                    source_agent=source_agent,
                )
            )

            await asyncio.Future()

        except Exception as e:
            logging.error("Unhandled Exception:", exc_info=True)
            SentryConfig.capture(e)
        finally:
            if db_session:
                logging.info("Closing the database session...")
                db_session.close()
            if rmq_connection:
                logging.info("Closing RabbitMQ connection...")
                await rmq_connection.close()
            logging.info("Shutting down...")
            time.sleep(10)


if __name__ == "__main__":
    asyncio.run(main())
