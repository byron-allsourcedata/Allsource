import asyncio
import functools
import json
import logging
import os
import sys
import time

from aio_pika import IncomingMessage
from dotenv import load_dotenv
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, aliased
from collections import OrderedDict

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from resolver import Resolver
from db_dependencies import Db
from config.sentry import SentryConfig
from config.rmq_connection import (
    RabbitMQConnection,
    publish_rabbitmq_message_with_channel,
)
from services.audience_smarts import AudienceSmartsService
from persistence.audience_settings import AudienceSettingPersistence
from models.audience_lookalikes_persons import AudienceLookalikesPerson
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson

load_dotenv()

AUDIENCE_SMARTS_AGENT = "aud_smarts_agent"
AUDIENCE_SMARTS_FILLER = "aud_smarts_filler"
SELECTED_ROW_COUNT = 100000

DATABASE_COLUMN_MAPPING = {
    "personal_email-mx": "personal_email_validation_status",
    "personal_email-recency": "personal_email_last_seen",
    "personal_email-delivery": "personal_email",
    "business_email-mx": "business_email_validation_status",
    "business_email-recency": "business_email_last_seen_date",
    "business_email-delivery": "business_email",
    "phone-dnc_filter": "mobile_phone_dnc",
    "linked_in-job_validation": "linkedin_url",
    "phone-confirmation": "phone_mobile1",
    "postal_cas_verification-cas_home_address": "home_postal_code",
    "postal_cas_verification-cas_office_address": "business_postal_code",
}


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def format_ids(ids):
    return tuple(ids) if ids else None


async def aud_smarts_reader(
    message: IncomingMessage,
    db_session: Session,
    channel,
    audience_smarts_service: AudienceSmartsService,
    audience_settings_persistence: AudienceSettingPersistence,
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

        priority_raw = audience_settings_persistence.get_validation_priority()
        priority_list = priority_raw.split(",")
        priority_index = {k: i for i, k in enumerate(priority_list)}

        selected = OrderedDict(
            (k, v) for k, v in validation_params.items() if v
        )

        order_columns = []
        for group, validators in selected.items():
            for validator_dict in validators:
                validator = next(iter(validator_dict))
                map_key = f"{group}-{validator}"
                column = DATABASE_COLUMN_MAPPING.get(map_key)
                if column:
                    order_columns.append(
                        (priority_index.get(map_key, 1e9), column)
                    )

        order_columns.sort(key=lambda t: t[0])

        order_by_parts = []
        for _, col in order_columns:
            order_by_parts.append(f"isNull({col}) ASC")
            order_by_parts.append(f"{col}")

        order_by_clause = ", ".join(order_by_parts)

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

                sorted_persons = audience_smarts_service.sorted_enrichment_users_for_validation(
                    persons, order_by_clause
                )

                if not sorted_persons:
                    break

                logging.info(
                    f"current count {count}, common count {active_segment // SELECTED_ROW_COUNT}"
                )

                message_body = {
                    "aud_smart_id": str(aud_smart_id),
                    "user_id": user_id,
                    "need_validate": need_validate,
                    "count_iterations": common_count,
                    "count": count,
                    "enrichment_users_ids": [
                        str(person_id) for person_id in sorted_persons
                    ],
                }
                await publish_rabbitmq_message_with_channel(
                    channel=channel,
                    queue_name=AUDIENCE_SMARTS_AGENT,
                    message_body=message_body,
                )
                logging.info(f"sent {len(sorted_persons)} persons")

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
    resolver = Resolver()
    while True:
        try:
            logging.info("Starting processing...")
            rmq_connection = RabbitMQConnection()
            connection = await rmq_connection.connect()
            channel = await connection.channel()
            await channel.set_qos(prefetch_count=1)

            db_session = await resolver.resolve(Db)

            audience_smarts_service = await resolver.resolve(
                AudienceSmartsService
            )
            audience_settings_persistence = await resolver.resolve(
                AudienceSettingPersistence
            )

            reader_queue = await channel.declare_queue(
                name=AUDIENCE_SMARTS_FILLER,
                durable=True,
            )
            await reader_queue.consume(
                functools.partial(
                    aud_smarts_reader,
                    db_session=db_session,
                    channel=channel,
                    audience_smarts_service=audience_smarts_service,
                    audience_settings_persistence=audience_settings_persistence,
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
