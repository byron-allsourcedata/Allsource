import logging
import os
import sys
import asyncio
import functools
import json
import time
from uuid import UUID
from sqlalchemy import update, func
from aio_pika import IncomingMessage
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from typing import List


current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from db_dependencies import Db
from resolver import Resolver

from config.sentry import SentryConfig
from services.audience_smarts import AudienceSmartsService
from models.audience_smarts import AudienceSmart
from models.audience_smarts_persons import AudienceSmartPerson
from models.audience_settings import AudienceSetting
from persistence.audience_settings import AudienceSettingPersistence
from enums import AudienceSettingAlias
from utils import send_sse
from config.rmq_connection import (
    RabbitMQConnection,
    publish_rabbitmq_message_with_channel,
)

load_dotenv()

AUDIENCE_VALIDATION_FILLER = "aud_validation_filler"
AUDIENCE_VALIDATION_AGENT_NOAPI = "aud_validation_agent_no-api"
AUDIENCE_VALIDATION_AGENT_LINKEDIN_API = "aud_validation_agent_linkedin-api"
AUDIENCE_VALIDATION_AGENT_EMAIL_API = "aud_validation_agent_email-api"
AUDIENCE_VALIDATION_AGENT_PHONE_OWNER_API = (
    "aud_validation_agent_phone-owner-api"
)
AUDIENCE_VALIDATION_AGENT_POSTAL = "aud_validation_agent_postal"
AUDIENCE_VALIDATION_PROGRESS = "AUDIENCE_VALIDATION_PROGRESS"


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def get_enrichment_users(
    validation_type: str,
    aud_smart_id: UUID,
    audience_smarts_service: AudienceSmartsService,
    column_name: str = None,
):
    if validation_type == "job_validation":
        enrichment_users = (
            audience_smarts_service.get_enrichment_users_for_job_validation(
                aud_smart_id
            )
        )
    elif validation_type == "delivery":
        enrichment_users = audience_smarts_service.get_enrichment_users_for_delivery_validation(
            aud_smart_id
        )
    elif validation_type == "confirmation":
        enrichment_users = audience_smarts_service.get_enrichment_users_for_confirmation_validation(
            aud_smart_id
        )
    elif (
        validation_type == "cas_home_address"
        or validation_type == "cas_office_address"
    ):
        enrichment_users = (
            audience_smarts_service.get_enrichment_users_for_postal_validation(
                aud_smart_id, validation_type
            )
        )
    else:
        enrichment_users = (
            audience_smarts_service.get_enrichment_users_for_free_validations(
                aud_smart_id, column_name
            )
        )

    return enrichment_users


def get_validation_cost(
    settingPersistence: AudienceSettingPersistence, column_name: str
):
    validation_cost = settingPersistence.get_cost_validations()

    if not validation_cost:
        return 0

    if column_name in validation_cost:
        return validation_cost[column_name]

    return 0


def validation_processed(db_session: Session, ids: List[int]):
    stmt = (
        update(AudienceSmartPerson)
        .where(AudienceSmartPerson.id.in_(ids))
        .values(is_validation_processed=True)
    )
    db_session.execute(stmt)
    db_session.commit()


async def complete_validation(
    db_session: Session, aud_smart_id: int, channel, user_id: int
):
    total_validated = (
        db_session.query(func.count(AudienceSmartPerson.id))
        .filter(
            AudienceSmartPerson.smart_audience_id == aud_smart_id,
            AudienceSmartPerson.is_valid == True,
        )
        .scalar()
    )
    db_session.query(AudienceSmart).filter(
        AudienceSmart.id == aud_smart_id
    ).update(
        {
            "validated_records": total_validated,
            "status": "ready",
        }
    )

    db_session.commit()
    await send_sse(
        channel=channel,
        user_id=user_id,
        data={
            "smart_audience_id": aud_smart_id,
            "total_validated": total_validated,
        },
    )
    logging.info(f"completed validation, status audience smart ready")


# async def complete_validation(
#     db_session: Session,
#     aud_smart_id: int,
#     channel,
#     user_id: int,
#     priority_values: str,
# ):
#     smart = (
#         db_session.query(AudienceSmart)
#         .filter(AudienceSmart.id == aud_smart_id)
#         .first()
#     )

#     if not smart:
#         logging.warning(f"AudienceSmart with ID {aud_smart_id} not found")
#         return

#     total_validated = (
#         db_session.query(func.count(AudienceSmartPerson.id))
#         .filter(
#             AudienceSmartPerson.smart_audience_id == aud_smart_id,
#             AudienceSmartPerson.is_valid == True,
#         )
#         .scalar()
#     )

#     validation_map = {}

#     validations = json.loads(smart.validations or "{}")

#     count_submitted = int(smart.active_segment_records * 0.7)
#     validated_records = int(count_submitted * 0.5)

#     for category, validators in validations.items():
#         if not isinstance(validators, list):
#             continue

#         for validator in validators:
#             if not isinstance(validator, dict):
#                 continue

#             for method, data in validator.items():
#                 key = f"{category}-{method}"
#                 if data.get("processed") is False:
#                     validation_map[key] = data

#     ordered_keys = [key for key in priority_values if key in validation_map]

#     prev_validated = smart.active_segment_records

#     for key in ordered_keys:
#         data = validation_map[key]

#         validated_records = int(prev_validated * 0.5)

#         data["count_validated"] = validated_records
#         data["count_submited"] = prev_validated
#         data["count_cost"] = str(Decimal(prev_validated * 1.01))

#         prev_validated = validated_records

#     db_session.query(AudienceSmart).filter(
#         AudienceSmart.id == aud_smart_id
#     ).update(
#         {
#             "validated_records": validated_records,
#             "status": "ready",
#             "validations": json.dumps(validations),
#         }
#     )

#     db_session.commit()

#     await send_sse(
#         channel=channel,
#         user_id=user_id,
#         data={
#             "smart_audience_id": aud_smart_id,
#             "total_validated": total_validated,
#         },
#     )

#     logging.info(f"completed validation, status audience smart ready")

async def process_rmq_message(
    message: IncomingMessage,
    db_session: Session,
    channel,
    settingPersistence: AudienceSettingPersistence,
    audience_smarts_service: AudienceSmartsService,
):
    try:
        body = json.loads(message.body)
        user_id = body.get("user_id")
        aud_smart_id = body.get("aud_smart_id")
        validation_params = body.get("validation_params", {})

        recency_days = {
            "personal_email": 0,
            "business_email": 0,
        }

        priority_record = (
            db_session.query(AudienceSetting.value)
            .filter(AudienceSetting.alias == AudienceSettingAlias.VALIDATION_PRIORITY.value)
            .first()
        )

        priority_values = priority_record.value.split(",") if priority_record else []

        column_mapping = {
            "personal_email-mx": "personal_email_validation_status",
            "personal_email-recency": "personal_email_last_seen",
            "personal_email-delivery": "personal_email",
            "business_email-mx": "business_email_validation_status",
            "business_email-recency": "business_email_last_seen_date",
            "business_email-delivery": "business_email",
            "phone-dnc_filter": "mobile_phone_dnc",
            "linked_in-job_validation": "job_validation",
            "phone-confirmation": "confirmation",
            "postal_cas_verification-cas_home_address": "cas_home_address",
            "postal_cas_verification-cas_office_address": "cas_office_address",
        }

        queue_map = {
            "personal_email_validation_status": AUDIENCE_VALIDATION_AGENT_NOAPI,
            "personal_email_last_seen": AUDIENCE_VALIDATION_AGENT_NOAPI,
            "business_email_validation_status": AUDIENCE_VALIDATION_AGENT_NOAPI,
            "business_email_last_seen_date": AUDIENCE_VALIDATION_AGENT_NOAPI,
            "job_validation": AUDIENCE_VALIDATION_AGENT_LINKEDIN_API,
            "confirmation": AUDIENCE_VALIDATION_AGENT_PHONE_OWNER_API,
            "cas_home_address": AUDIENCE_VALIDATION_AGENT_POSTAL,
            "cas_office_address": AUDIENCE_VALIDATION_AGENT_POSTAL,
            "business_email": AUDIENCE_VALIDATION_AGENT_EMAIL_API,
            "personal_email": AUDIENCE_VALIDATION_AGENT_EMAIL_API,
            "mobile_phone_dnc": AUDIENCE_VALIDATION_AGENT_NOAPI,
        }

        validations_sent = False

        for value in priority_values:
            validation, val_type = value.split("-")
            if validation not in validation_params:
                continue

            for param in validation_params[validation]:
                if val_type not in param or param[val_type].get("processed") is True:
                    continue

                column_name = column_mapping.get(value)
                if not column_name:
                    continue

                if val_type == "recency":
                    recency_days[validation] = param[val_type].get("days", 0)

                enrichment_users = get_enrichment_users(
                    val_type, aud_smart_id, audience_smarts_service, column_name
                )

                if not enrichment_users:
                    continue

                validation_cost = get_validation_cost(settingPersistence, value)
                validation_processed(
                    db_session,
                    [u["audience_smart_person_id"] for u in enrichment_users],
                )

                for i in range(0, len(enrichment_users), 100):
                    batch = enrichment_users[i:i+100]
                    serialized_batch = [
                        {
                            **user,
                            "audience_smart_person_id": str(user["audience_smart_person_id"]),
                        }
                        for user in batch
                    ]

                    msg_body = {
                        "aud_smart_id": str(aud_smart_id),
                        "user_id": user_id,
                        "batch": serialized_batch,
                        "validation_type": column_name,
                        "validation_cost": validation_cost,
                        "count_persons_before_validation": len(enrichment_users),
                    }

                    if queue_map[column_name] == AUDIENCE_VALIDATION_AGENT_NOAPI:
                        msg_body["recency_personal_days"] = recency_days["personal_email"]
                        msg_body["recency_business_days"] = recency_days["business_email"]

                    await publish_rabbitmq_message_with_channel(
                        channel=channel,
                        queue_name=queue_map[column_name],
                        message_body=msg_body,
                    )

                validations_sent = True

        if not validations_sent:
            await complete_validation(db_session, aud_smart_id, channel, user_id)

        await message.ack()

    except IntegrityError:
        logging.warning(f"SmartAudience with ID {aud_smart_id} might have been deleted. Skipping.")
        db_session.rollback()
        await message.ack()



# async def process_rmq_message(
#     message: IncomingMessage,
#     db_session: Session,
#     channel,
#     settingPersistence: AudienceSettingPersistence,
#     audience_smarts_service: AudienceSmartsService,
# ):
#     try:
#         message_body = json.loads(message.body)
#         logging.info("Received message: %s", message_body)
#         user_id = message_body.get("user_id")
#         aud_smart_id = message_body.get("aud_smart_id")
#         validation_params = message_body.get("validation_params")
#         recency_personal_days = 0
#         recency_business_days = 0

#         try:
#             priority_record = (
#                 db_session.query(AudienceSetting.value)
#                 .filter(
#                     AudienceSetting.alias
#                     == AudienceSettingAlias.VALIDATION_PRIORITY.value
#                 )
#                 .first()
#             )

#             priority_values = priority_record.value.split(",")
#             column_mapping = {
#                 "personal_email-mx": "personal_email_validation_status",
#                 "personal_email-recency": "personal_email_last_seen",
#                 "personal_email-delivery": "personal_email",
#                 "business_email-mx": "business_email_validation_status",
#                 "business_email-recency": "business_email_last_seen_date",
#                 "business_email-delivery": "business_email",
#                 "phone-dnc_filter": "mobile_phone_dnc",
#                 "linked_in-job_validation": "job_validation",
#                 "phone-confirmation": "confirmation",
#                 "postal_cas_verification-cas_home_address": "cas_home_address",
#                 "postal_cas_verification-cas_office_address": "cas_office_address",
#             }

#             for value in priority_values:
#                 validation, validation_type = value.split("-")
#                 if validation in validation_params:
#                     validation_params_list = validation_params.get(validation)
#                     if (
#                         validation_params_list
#                         and len(validation_params_list) > 0
#                     ):
#                         for param in validation_params_list:
#                             if validation_type in param:
#                                 column_name = column_mapping.get(value)
#                                 for key, inner_dict in param.items():
#                                     processed = inner_dict.get("processed")

#                                 if processed is True:
#                                     break

#                                 if not column_name:
#                                     continue

#                                 if validation_type == "recency":
#                                     for param in validation_params_list:
#                                         if (
#                                             "recency" in param
#                                             and validation == "personal_email"
#                                         ):
#                                             recency_personal_days = param[
#                                                 "recency"
#                                             ].get("days")
#                                             break
#                                         if (
#                                             "recency" in param
#                                             and validation == "business_email"
#                                         ):
#                                             recency_business_days = param[
#                                                 "recency"
#                                             ].get("days")
#                                             break

#                                 enrichment_users = get_enrichment_users(
#                                     validation_type,
#                                     aud_smart_id,
#                                     audience_smarts_service,
#                                     column_name,
#                                 )
#                                 validation_cost = get_validation_cost(
#                                     settingPersistence, value
#                                 )

#                                 logging.info(f"validation by {column_name}")
#                                 logging.info(
#                                     f"validation_cost {validation_cost}"
#                                 )
#                                 logging.info(
#                                     f"count person which will processed validation {len(enrichment_users)}"
#                                 )

#                                 if not enrichment_users:
#                                     logging.info(
#                                         f"No enrichment users found for aud_smart_id {aud_smart_id}. column_name {column_name}"
#                                     )
#                                     continue

#                                 validation_processed(
#                                     db_session,
#                                     [
#                                         user["audience_smart_person_id"]
#                                         for user in enrichment_users
#                                     ],
#                                 )
#                                 for j in range(0, len(enrichment_users), 100):
#                                     batch = enrichment_users[j : j + 100]
#                                     serialized_batch = [
#                                         {
#                                             **user,
#                                             "audience_smart_person_id": str(
#                                                 user["audience_smart_person_id"]
#                                             ),
#                                         }
#                                         for user in batch
#                                     ]
#                                     message_body = {
#                                         "aud_smart_id": str(aud_smart_id),
#                                         "user_id": user_id,
#                                         "batch": serialized_batch,
#                                         "validation_type": column_name,
#                                         "validation_cost": validation_cost,
#                                         "count_persons_before_validation": len(
#                                             enrichment_users
#                                         ),
#                                     }
#                                     queue_map = {
#                                         "personal_email_validation_status": AUDIENCE_VALIDATION_AGENT_NOAPI,
#                                         "personal_email_last_seen": AUDIENCE_VALIDATION_AGENT_NOAPI,
#                                         "business_email_validation_status": AUDIENCE_VALIDATION_AGENT_NOAPI,
#                                         "business_email_last_seen_date": AUDIENCE_VALIDATION_AGENT_NOAPI,
#                                         "job_validation": AUDIENCE_VALIDATION_AGENT_LINKEDIN_API,
#                                         "confirmation": AUDIENCE_VALIDATION_AGENT_PHONE_OWNER_API,
#                                         "cas_home_address": AUDIENCE_VALIDATION_AGENT_POSTAL,
#                                         "cas_office_address": AUDIENCE_VALIDATION_AGENT_POSTAL,
#                                         "business_email": AUDIENCE_VALIDATION_AGENT_EMAIL_API,
#                                         "personal_email": AUDIENCE_VALIDATION_AGENT_EMAIL_API,
#                                         "mobile_phone_dnc": AUDIENCE_VALIDATION_AGENT_NOAPI,
#                                     }
#                                     queue_name = queue_map[column_name]
#                                     if (
#                                         queue_name
#                                         == AUDIENCE_VALIDATION_AGENT_NOAPI
#                                     ):
#                                         message_body[
#                                             "recency_business_days"
#                                         ] = recency_business_days
#                                         message_body[
#                                             "recency_personal_days"
#                                         ] = recency_personal_days

#                                     await publish_rabbitmq_message_with_channel(
#                                         channel=channel,
#                                         queue_name=queue_name,
#                                         message_body=message_body,
#                                     )
#                                 await message.ack()
#                                 return

#             await complete_validation(
#                 db_session, aud_smart_id, channel, user_id
#             )
#             await message.ack()
#         except IntegrityError as e:
#             logging.warning(
#                 f"SmartAudience with ID {aud_smart_id} might have been deleted. Skipping."
#             )
#             db_session.rollback()
#             await message.ack()

#     except Exception as e:
#         logging.error(f"Error processing matching: {e}", exc_info=True)
#         db_session.rollback()
#         await message.nack()


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

            settingPersistence = AudienceSettingPersistence(db_session)

            queue = await channel.declare_queue(
                name=AUDIENCE_VALIDATION_FILLER,
                durable=True,
            )
            await queue.consume(
                functools.partial(
                    process_rmq_message,
                    channel=channel,
                    db_session=db_session,
                    settingPersistence=settingPersistence,
                    audience_smarts_service=audience_smarts_service,
                )
            )

            await asyncio.Future()

        except Exception as e:
            logging.error("Unhandled Exception:", exc_info=True)
            await SentryConfig.capture(e)
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
