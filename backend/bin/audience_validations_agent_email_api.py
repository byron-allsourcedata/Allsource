import logging
import os
import sys
import asyncio
import functools
import json
import time
from decimal import Decimal
from aio_pika import IncomingMessage, Channel
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError
from dotenv import load_dotenv


current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from services.exceptions import InsufficientCreditsError, MillionVerifierError
from db_dependencies import Db
from resolver import Resolver
from config.sentry import SentryConfig
from models.audience_smarts import AudienceSmart
from utils import send_sse
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)
from models.audience_smarts_persons import AudienceSmartPerson
from persistence.user_persistence import UserPersistence
from models.audience_smarts_validations import AudienceSmartValidation
from services.audience_smarts import AudienceSmartsService
from services.smart_validation_agent import SmartValidationAgent
from config.rmq_connection import (
    RabbitMQConnection,
    publish_rabbitmq_message_with_channel,
)

load_dotenv()

AUDIENCE_VALIDATION_AGENT_EMAIL_API = "aud_validation_agent_email-api"
AUDIENCE_VALIDATION_FILLER = "aud_validation_filler"


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


async def process_rmq_message(
    message: IncomingMessage,
    db_session: Session,
    channel: Channel,
    million_verifier_service: MillionVerifierIntegrationsService,
    user_persistence: UserPersistence,
    audience_smarts_service: AudienceSmartsService,
    smart_validation_agent_service: SmartValidationAgent,
):
    try:
        body = json.loads(message.body)
        user_id = body.get("user_id")
        aud_smart_id = body.get("aud_smart_id")
        batch = body.get("batch", [])
        validation_type = body.get("validation_type")
        count_persons_before_validation = body.get(
            "count_persons_before_validation"
        )
        validation_cost = body.get("validation_cost")
        verified_emails = []
        write_off_funds = Decimal(0)
        count_subtracted = Decimal(0)
        logging.info(f"aud_smart_id: {aud_smart_id}")
        logging.info(f"validation_type: {validation_type}")
        failed_ids: list[int] = []
        for rec in batch:
            if validation_type == "personal_email":
                email = rec.get("personal_email")
                if not email:
                    failed_ids.append(rec["audience_smart_person_id"])
                    continue

                write_off_funds += Decimal(validation_cost)

                if not await million_verifier_service.is_email_verify(email):
                    failed_ids.append(rec["audience_smart_person_id"])
                    continue

                verified_emails.append(
                    AudienceSmartValidation(
                        audience_smart_person_id=rec[
                            "audience_smart_person_id"
                        ],
                        verified_personal_email=email,
                    )
                )

            elif validation_type == "business_email":
                email = rec.get("business_email")
                if not email:
                    failed_ids.append(rec["audience_smart_person_id"])
                    continue

                write_off_funds += Decimal(validation_cost)

                if not await million_verifier_service.is_email_verify(email):
                    failed_ids.append(rec["audience_smart_person_id"])
                    continue

                verified_emails.append(
                    AudienceSmartValidation(
                        audience_smart_person_id=rec[
                            "audience_smart_person_id"
                        ],
                        verified_business_email=email,
                    )
                )
        if write_off_funds:
            count_subtracted = user_persistence.deduct_validation_funds(
                user_id, write_off_funds
            )
            db_session.flush()

        success_ids = [
            rec["audience_smart_person_id"]
            for rec in batch
            if rec["audience_smart_person_id"] not in failed_ids
        ]
        if failed_ids:
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [
                    {
                        "id": pid,
                        "is_validation_processed": False,
                        "is_valid": False,
                    }
                    for pid in failed_ids
                ],
            )
            db_session.flush()
        logging.info(f"Failed ids len: {len(failed_ids)}")
        if len(verified_emails):
            db_session.bulk_save_objects(verified_emails)
            db_session.flush()

        if success_ids:
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [
                    {"id": pid, "is_validation_processed": False}
                    for pid in success_ids
                ],
            )
            db_session.flush()

        db_session.commit()
        logging.info(f"Success ids len: {len(success_ids)}")
        total_validated = db_session.scalar(
            select(func.count(AudienceSmartPerson.id)).where(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_valid.is_(True),
            )
        )
        validation_count = db_session.scalar(
            select(func.count(AudienceSmartPerson.id)).where(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_validation_processed.is_(False),
            )
        )
        total_count = (
            db_session.query(AudienceSmartPerson)
            .filter(AudienceSmartPerson.smart_audience_id == aud_smart_id)
            .count()
        )

        aud_smart = db_session.get(AudienceSmart, aud_smart_id)
        validations = {}

        if aud_smart and aud_smart.validations:
            validations = json.loads(aud_smart.validations)

            if validation_type in validations:
                for rule in validations[validation_type]:
                    if "delivery" in rule:
                        rule["delivery"].setdefault("count_cost", "0.00")

                        rule["delivery"]["count_validated"] = total_validated
                        rule["delivery"]["count_submited"] = (
                            count_persons_before_validation
                        )

                        previous_cost = Decimal(rule["delivery"]["count_cost"])
                        rule["delivery"]["count_cost"] = str(
                            (previous_cost + count_subtracted).quantize(
                                Decimal("0.01")
                            )
                        )

                        if validation_count == total_count:
                            rule["delivery"]["processed"] = True
        aud_smart.validations = json.dumps(validations)

        smart_validation_agent_service.update_step_processed(
            aud_smart_id=aud_smart_id,
            validation_type=f"{validation_type}-delivery",
            batch_size=validation_count,
        )

        db_session.commit()

        if validation_count == total_count:
            audience_smarts_service.update_stats_validations(
                validation_type=f"{validation_type}-delivery",
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
                    "validation_params": validations,
                },
            )

        await send_sse(
            channel=channel,
            user_id=user_id,
            data={
                "smart_audience_id": aud_smart_id,
                "total_validated": total_validated,
            },
        )
        logging.info("sent sse with total count")

        await message.ack()

    except StaleDataError:
        logging.warning(f"AudienceSmart {aud_smart_id} not found; skipping.")
        db_session.rollback()
        await message.ack()

    except MillionVerifierError as e:
        logging.error(
            f"MillionVerifierError while processing data sync: {e}",
            exc_info=True,
        )
        db_session.rollback()
        await asyncio.sleep(60 * 1)
        await message.reject(requeue=True)

    except InsufficientCreditsError as e:
        logging.error(
            f"InsufficientCreditsError while processing data sync: {e}"
        )
        db_session.rollback()
        await asyncio.sleep(60 * 1)
        await message.reject(requeue=True)

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
            user_persistence = UserPersistence(db_session)
            million_verifier_service = await resolver.resolve(
                MillionVerifierIntegrationsService
            )

            queue = await channel.declare_queue(
                name=AUDIENCE_VALIDATION_AGENT_EMAIL_API,
                durable=True,
            )

            await queue.consume(
                functools.partial(
                    process_rmq_message,
                    channel=channel,
                    db_session=db_session,
                    million_verifier_service=million_verifier_service,
                    user_persistence=user_persistence,
                    audience_smarts_service=audience_smarts_service,
                ),
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
