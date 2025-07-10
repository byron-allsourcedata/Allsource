import asyncio
import functools
import json
import logging
import os
import sys
import time

from aio_pika import IncomingMessage
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker, Session, aliased

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from config.sentry import SentryConfig
from config.rmq_connection import (
    RabbitMQConnection,
    publish_rabbitmq_message_with_channel,
)
from models.audience_lookalikes_persons import AudienceLookalikesPerson
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson

load_dotenv()

AUDIENCE_SMARTS_AGENT = "aud_smarts_agent"
AUDIENCE_SMARTS_FILLER = "aud_smarts_filler"
SELECTED_ROW_COUNT = 1000


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def format_ids(ids):
    return tuple(ids) if ids else None


async def aud_smarts_reader(
    message: IncomingMessage, db_session: Session, channel
):
    try:
        message_body = json.loads(message.body)
        data = message_body.get("data")

        user_id = data.get("user_id")
        aud_smart_id = str(data.get("aud_smart_id"))
        data_sources = data.get("data_sources")
        active_segment = data.get("active_segment")
        need_validate = data.get("need_validate")
        validation_params = data.get("validation_params")

        logging.info(
            f"For smart audience with {aud_smart_id} need_validate = {need_validate}"
        )

        offset = 0
        count = 1
        common_count = active_segment // SELECTED_ROW_COUNT
        if active_segment % SELECTED_ROW_COUNT != 0:
            common_count += 1

        AudienceLALP = aliased(AudienceLookalikesPerson)
        AudienceSMP = aliased(AudienceSourcesMatchedPerson)

        lookalike_include = format_ids(data_sources["lookalike_ids"]["include"])
        lookalike_exclude = format_ids(data_sources["lookalike_ids"]["exclude"])
        source_include = format_ids(data_sources["source_ids"]["include"])
        source_exclude = format_ids(data_sources["source_ids"]["exclude"])

        while offset < active_segment:
            try:
                lalp_query = (
                    db_session.query(
                        AudienceLALP.enrichment_user_asid.label(
                            "enrichment_user_asid"
                        )
                    )
                    .filter(
                        AudienceLALP.lookalike_id.in_(lookalike_include)
                        if lookalike_include
                        else True
                    )
                    .filter(
                        ~AudienceLALP.lookalike_id.in_(lookalike_exclude)
                        if lookalike_exclude
                        else True
                    )
                )

                smp_query = (
                    db_session.query(
                        AudienceSMP.enrichment_user_asid.label(
                            "enrichment_user_asid"
                        )
                    )
                    .filter(
                        AudienceSMP.source_id.in_(source_include)
                        if source_include
                        else True
                    )
                    .filter(
                        ~AudienceSMP.source_id.in_(source_exclude)
                        if source_exclude
                        else True
                    )
                )

                combined_query = lalp_query.union(smp_query).subquery()

                final_query = (
                    db_session.query(combined_query.c.enrichment_user_asid)
                    .limit(min(SELECTED_ROW_COUNT, active_segment - offset))
                    .offset(offset)
                )

                persons = [row[0] for row in final_query.all()]

                if not persons:
                    break

                logging.info(
                    f"current count {count}, common count {active_segment // SELECTED_ROW_COUNT}"
                )

                message_body = {
                    "aud_smart_id": str(aud_smart_id),
                    "user_id": user_id,
                    "need_validate": need_validate,
                    "validation_params": validation_params,
                    "count_iterations": common_count,
                    "count": count,
                    "enrichment_users_ids": [
                        str(person_id) for person_id in persons
                    ],
                }
                await publish_rabbitmq_message_with_channel(
                    channel=channel,
                    queue_name=AUDIENCE_SMARTS_AGENT,
                    message_body=message_body,
                )
                logging.info(f"sent {len(persons)} persons")

                offset += SELECTED_ROW_COUNT
                count += 1

            except IntegrityError as e:
                logging.warning(
                    f"SmartAudience with ID {aud_smart_id} might have been deleted. Skipping."
                )
                break

        await message.ack()
    except BaseException as e:
        db_session.rollback()
        logging.error(f"Error processing message: {e}", exc_info=True)
        await message.ack()


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
    db_username = os.getenv("DB_USERNAME")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST")
    db_name = os.getenv("DB_NAME")
    while True:
        try:
            logging.info("Starting processing...")
            rmq_connection = RabbitMQConnection()
            connection = await rmq_connection.connect()
            channel = await connection.channel()
            await channel.set_qos(prefetch_count=1)

            engine = create_engine(
                f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}",
                pool_pre_ping=True,
            )
            Session = sessionmaker(bind=engine)
            db_session = Session()

            reader_queue = await channel.declare_queue(
                name=AUDIENCE_SMARTS_FILLER,
                durable=True,
            )
            await reader_queue.consume(
                functools.partial(
                    aud_smarts_reader, db_session=db_session, channel=channel
                )
            )

            await asyncio.Future()

        except Exception as e:
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
            logging.info("Shutting down...")
            time.sleep(10)


if __name__ == "__main__":
    asyncio.run(main())
