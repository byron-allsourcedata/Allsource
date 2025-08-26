import asyncio
import functools
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from decimal import Decimal

from aio_pika import IncomingMessage, Channel
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.audience_smarts_persons import AudienceSmartPerson
from config.sentry import SentryConfig
from db_dependencies import Db
from resolver import Resolver
from persistence.user_persistence import UserPersistence
from services.audience_smarts import AudienceSmartsService
from services.smart_validation_agent import SmartValidationAgent
from config.rmq_connection import (
    RabbitMQConnection,
    publish_rabbitmq_message_with_channel,
)

load_dotenv()

AUDIENCE_VALIDATION_AGENT_NOAPI = "aud_validation_agent_no-api"
AUDIENCE_VALIDATION_FILLER = "aud_validation_filler"
AUDIENCE_VALIDATION_PROGRESS = "AUDIENCE_VALIDATION_PROGRESS"
AUDIENCE_VALIDATION_AGENT_LINKEDIN_API = "aud_validation_agent_linkedin-api"
AUDIENCE_VALIDATION_AGENT_PHONE_OWNER_API = (
    "aud_validation_agent_phone-owner-api"
)

CATEGORY_BY_COLUMN = {
    "personal_email_validation_status": "personal_email",
    "business_email_validation_status": "business_email",
    "personal_email_last_seen": "personal_email",
    "business_email_last_seen_date": "business_email",
    "mobile_phone_dnc": "phone",
}

COLUMN_MAPPING = {
    "personal_email_validation_status": "mx",
    "business_email_validation_status": "mx",
    "personal_email_last_seen": "recency",
    "business_email_last_seen_date": "recency",
    "mobile_phone_dnc": "dnc_filter",
}

VALIDATION_MAPPING = {
    "personal_email_validation_status": "personal_email-mx",
    "personal_email_last_seen": "personal_email-recency",
    "business_email_validation_status": "business_email-mx",
    "business_email_last_seen_date": "business_email-recency",
    "mobile_phone_dnc": "phone-dnc_filter",
}


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


async def aud_validation_agent(
    message: IncomingMessage,
    db_session: Session,
    channel: Channel,
    user_persistence: UserPersistence,
    audience_smarts_service: AudienceSmartsService,
    smart_validation_agent_service: SmartValidationAgent,
):
    try:
        body = json.loads(message.body)
        user_id = body.get("user_id")
        aud_smart_id = body.get("aud_smart_id")
        batch = body.get("batch", [])
        count_persons_before_validation = body.get(
            "count_persons_before_validation"
        )
        recency_personal_days = body.get("recency_personal_days", 0)
        recency_business_days = body.get("recency_business_days", 0)
        validation_type = body.get("validation_type")
        validation_cost = body.get("validation_cost")
        write_off_funds = Decimal(0)
        count_subtracted = Decimal(0)

        logging.info(
            f"[PROCESS] aud_smart_id={aud_smart_id} | validation_type={validation_type}"
        )

        validation_rules = {
            "personal_email_validation_status": lambda v: bool(
                v and v.startswith("Valid")
            ),
            "business_email_validation_status": lambda v: bool(
                v and v.startswith("Valid")
            ),
            "personal_email_last_seen": lambda v: bool(
                v
                and (
                    datetime.now(timezone.utc)
                    - datetime.fromisoformat(v).astimezone(timezone.utc)
                ).days
                <= recency_personal_days
            ),
            "business_email_last_seen_date": lambda v: bool(
                v
                and (
                    datetime.now(timezone.utc)
                    - datetime.fromisoformat(v).astimezone(timezone.utc)
                ).days
                <= recency_business_days
            ),
            "mobile_phone_dnc": lambda v: v is False,
        }

        failed_ids = []
        success_ids = []
        rule = validation_rules.get(validation_type, lambda _: False)

        for rec in batch:
            value = rec.get(validation_type)
            if not rule(value):
                failed_ids.append(rec["audience_smart_person_id"])
            else:
                success_ids.append(rec["audience_smart_person_id"])

            if value is not None:
                write_off_funds += Decimal(validation_cost)

        logging.info(f"[PROCESS] Failed IDs count: {len(failed_ids)}")
        logging.info(f"[PROCESS] Success IDs count: {len(success_ids)}")

        if write_off_funds:
            count_subtracted = user_persistence.deduct_validation_funds(
                user_id, write_off_funds
            )
            db_session.flush()

        if failed_ids:
            db_session.query(AudienceSmartPerson).filter(
                AudienceSmartPerson.id.in_(failed_ids)
            ).update(
                {"is_validation_processed": False, "is_valid": False},
                synchronize_session=False,
            )
            # smart_validation_agent_service.update_failed_persons(failed_ids)

        if success_ids:
            db_session.query(AudienceSmartPerson).filter(
                AudienceSmartPerson.id.in_(success_ids)
            ).update(
                {"is_validation_processed": False}, synchronize_session=False
            )

            # smart_validation_agent_service.update_success_persons(failed_ids)

        db_session.flush()
        db_session.commit()

        counts = smart_validation_agent_service.get_validation_temp_counts(
            smart_audience_id=aud_smart_id
        )

        total_count = counts.total_count
        total_validated = counts.total_validated
        validation_count = counts.validation_count

        smart_validation_agent_service.update_validations_json(
            aud_smart_id=aud_smart_id,
            validation_type=validation_type,
            total_validated=total_validated,
            total_count=total_count,
            validation_count=validation_count,
            count_persons_before_validation=count_persons_before_validation,
            count_subtracted=count_subtracted,
        )

        smart_validation_agent_service.update_step_processed(
            aud_smart_id=aud_smart_id,
            validation_type=validation_type,
            batch_size=len(batch),
        )

        db_session.commit()

        if validation_count == total_count:
            target_category = CATEGORY_BY_COLUMN.get(validation_type)
            key = COLUMN_MAPPING.get(validation_type)

            audience_smarts_service.update_stats_validations(
                validation_type=f"{target_category}-{key}",
                count_persons_before_validation=count_persons_before_validation,
                count_valid_persons=total_validated,
            )
            db_session.commit()
            await publish_rabbitmq_message_with_channel(
                channel=channel,
                queue_name=AUDIENCE_VALIDATION_FILLER,
                message_body={
                    "aud_smart_id": str(aud_smart_id),
                    "user_id": user_id,
                },
            )

        # await send_sse(
        #     channel=channel,
        #     user_id=user_id,
        #     data={
        #         "smart_audience_id": aud_smart_id,
        #         "total_validated": total_validated,
        #     },
        # )
        # logging.info("Sent SSE with total count")

        await message.ack()

    except StaleDataError:
        logging.warning(f"AudienceSmart {aud_smart_id} not found; skipping.")
        db_session.rollback()
        await message.ack()

    except Exception as e:
        logging.error(f"Error in aud_validation_agent: {e}", exc_info=True)
        db_session.rollback()
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
    while True:
        try:
            logging.info("Starting processing...")
            rmq_connection = RabbitMQConnection()
            connection = await rmq_connection.connect()
            channel = await connection.channel()
            await channel.set_qos(prefetch_count=1)

            db_session = await resolver.resolve(Db)

            user_persistence = UserPersistence(db_session)
            audience_smarts_service = await resolver.resolve(
                AudienceSmartsService
            )
            smart_validation_agent_service = await resolver.resolve(
                SmartValidationAgent
            )

            queue = await channel.declare_queue(
                name=AUDIENCE_VALIDATION_AGENT_NOAPI,
                durable=True,
            )
            await queue.consume(
                functools.partial(
                    aud_validation_agent,
                    channel=channel,
                    db_session=db_session,
                    user_persistence=user_persistence,
                    audience_smarts_service=audience_smarts_service,
                    smart_validation_agent_service=smart_validation_agent_service,
                )
            )

            await asyncio.Future()

        except Exception as e:
            logging.error("Unhandled Exception:", exc_info=True)
            SentryConfig.capture(e)
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
