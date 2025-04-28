import logging
import os
import sys
import asyncio
import functools
import json
import boto3
import random
from uuid import UUID
from datetime import datetime
from sqlalchemy import update
from aio_pika import IncomingMessage, Message
from sqlalchemy.exc import IntegrityError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.audience_smarts import AudienceSmart
from models.audience_smarts_persons import AudienceSmartPerson
from models.audience_settings import AudienceSetting
from models.enrichment_user_ids import EnrichmentUserId
from models.enrichment_user_contact import EnrichmentUserContact
from models.enrichment_employment_history import EnrichmentEmploymentHistory
from models.emails_enrichment import EmailEnrichment
from models.emails import Email
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_VALIDATION_FILLER = 'aud_validation_filler'
AUDIENCE_VALIDATION_AGENT_NOAPI = 'aud_validation_agent_no-api'
AUDIENCE_VALIDATION_AGENT_LINKEDIN_API = 'aud_validation_agent_linkedin-api'
AUDIENCE_VALIDATION_AGENT_PHONE_OWNER_API = 'aud_validation_agent_phone-owner-api'
AUDIENCE_VALIDATION_PROGRESS = 'AUDIENCE_VALIDATION_PROGRESS'

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

async def wait_for_ping(connection: RabbitMQConnection, aud_smart_id: UUID, validation_type: str):
    queue_name = f"validation_complete"
    channel = await connection.channel()
    queue = await channel.declare_queue(queue_name, durable=True)

    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            if message:
                message_body = json.loads(message.body)
                if message_body.get("status") == "validation_complete" and message_body.get("aud_smart_id") == aud_smart_id and message_body.get("validation_type") == validation_type:
                    await message.ack()
                    break


async def send_sse(connection: RabbitMQConnection, user_id: int, data: dict):
    try:
        logging.info(f"send client throught SSE: {data, user_id}")
        await publish_rabbitmq_message(
            connection=connection,
            queue_name=f'sse_events_{str(user_id)}',
            message_body={
                "status": AUDIENCE_VALIDATION_PROGRESS,
                "data": data
            }
        )
    except Exception as e:
        logging.error(f"Error sending SSE: {e}")


def get_enrichment_users(db_session: Session, validation_type: str, aud_smart_id: UUID, column_name: str = None):
    if validation_type == "job_validation": 
        enrichment_users = [
            {
                "audience_smart_person_id": user.audience_smart_person_id,
                "job_title": user.job_title,
                "company_name": user.company_name,
                "linkedin_url": user.linkedin_url,
            }
            for user in db_session.query(
                AudienceSmartPerson.id.label("audience_smart_person_id"),
                EnrichmentEmploymentHistory.job_title,
                EnrichmentEmploymentHistory.company_name,
                EnrichmentUserContact.linkedin_url,
            )
            .join(
                EnrichmentUserId,
                EnrichmentUserId.id == AudienceSmartPerson.enrichment_user_id,
            )
            .join(
                EnrichmentUserContact,
                EnrichmentUserContact.asid == EnrichmentUserId.asid,
            )
            .join(
                EnrichmentEmploymentHistory,
                EnrichmentEmploymentHistory.asid == EnrichmentUserId.asid,
            )
            .filter(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_validation_processed == True,
            )
            .distinct(EnrichmentUserContact.asid)
            .all()
        ]
    elif validation_type == "confirmation":
        enrichment_users = [
            {
                "audience_smart_person_id": user.audience_smart_person_id,
                "phone_mobile1": user.phone_mobile1,
                "phone_mobile2": user.phone_mobile2,
                "full_name": f"{user.first_name or ''} {user.middle_name or ''} {user.last_name or ''}".strip()
            }
            for user in db_session.query(
                AudienceSmartPerson.id.label("audience_smart_person_id"),
                EnrichmentUserContact.phone_mobile1.label("phone_mobile1"),
                EnrichmentUserContact.phone_mobile2.label("phone_mobile2"),
                EnrichmentUserContact.first_name.label("first_name"),
                EnrichmentUserContact.middle_name.label("middle_name"),
                EnrichmentUserContact.last_name.label("last_name"),
            )
            .join(
                EnrichmentUserId,
                EnrichmentUserId.id == AudienceSmartPerson.enrichment_user_id,
            )
            .join(
                EnrichmentUserContact,
                EnrichmentUserContact.asid == EnrichmentUserId.asid,
            )
            .filter(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_validation_processed == True,
            )
            .distinct(EnrichmentUserContact.asid)
            .all()
        ]
    else:
        enrichment_users = [
            {
                "audience_smart_person_id": user.audience_smart_person_id,
                column_name: (
                    user.value.isoformat() if isinstance(user.value, datetime) else user.value
                ),
            }
            for user in db_session.query(
                AudienceSmartPerson.id.label("audience_smart_person_id"),
                getattr(EnrichmentUserContact, column_name).label("value"),
            )
            .join(
                EnrichmentUserId,
                EnrichmentUserId.id == AudienceSmartPerson.enrichment_user_id,
            )
            .join(
                EnrichmentUserContact,
                EnrichmentUserContact.asid == EnrichmentUserId.asid,
            )
            .filter(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_validation_processed == True,
            )
            .distinct(EnrichmentUserContact.asid)
            .all()
        ]
    
    return enrichment_users

async def aud_email_validation(message: IncomingMessage, db_session: Session, connection: RabbitMQConnection):
    try:
        message_body = json.loads(message.body)
        user_id = message_body.get("user_id")
        aud_smart_id = message_body.get("aud_smart_id")
        validation_params = message_body.get("validation_params")

        recency_personal_days = 0
        recency_business_days = 0
        def recursive_count(item):
            nonlocal count_validations
            if isinstance(item, dict):
                for key, value in item.items():
                    if key == 'processed' and value is False:
                        count_validations += 1
                    else:
                        recursive_count(value)
            elif isinstance(item, list):
                for element in item:
                    recursive_count(element)

        count_validations = 0
        recursive_count(validation_params)
        logging.info("count_validations, {count_validations}")

        logging.info(f"Processed email validation for aud_smart_id {aud_smart_id}.")    

        try:
            priority_record = (
                db_session.query(AudienceSetting.value)
                .filter(AudienceSetting.alias == "validation_priority")
                .first()
            )

            priority_values = priority_record.value.split(",")[:7]

            column_mapping = {
                'personal_email-mx': 'personal_email_validation_status',
                'personal_email-recency': 'personal_email_last_seen',
                'business_email-mx': 'business_email_validation_status',
                'business_email-recency': 'business_email_last_seen_date',
                'phone-dnc_filter': 'mobile_phone_dnc',
                'linked_in-job_validation': 'job_validation',
                'phone-confirmation': 'confirmation'
            }


            logging.info(f"validation_params {validation_params}")
            i = 0

            for value in priority_values:
                validation, validation_type = value.split('-')[0], value.split('-')[1]
                logging.info(f"validation - {validation} ; validation_type - {validation_type}")
                
                if validation in validation_params:
                    validation_params_list = validation_params.get(validation)
                    logging.info(f"validation_params_list {validation_params_list}")
                    
                    if len(validation_params_list) > 0:
                        length_validations_type = len(validation_params_list)
                        count_validations_type = 0
                        for param in validation_params_list:
                            count_validations_type += 1
                            if validation_type in param:
                                column_name = column_mapping.get(value)
                                
                                logging.info(f"column_name {column_name}")
                                
                                if not column_name:
                                    continue

                                if validation_type == "recency":
                                    for param in validation_params_list:
                                        if "recency" in param and validation == "personal_email":
                                            recency_personal_days = param["recency"].get("days")
                                            break
                                        if "recency" in param and validation == "business_email":
                                            recency_business_days = param["recency"].get("days")
                                            break
                                
                                enrichment_users = get_enrichment_users(db_session, validation_type, aud_smart_id, column_name)

                                print("enrichment_users", enrichment_users)

                                logging.info(f"count person which will processed validation {len(enrichment_users)}")

                                if not enrichment_users:
                                    logging.info(f"No enrichment users found for aud_smart_id {aud_smart_id}.")
                                    await send_sse(
                                        connection,
                                        user_id,
                                        {
                                            "smart_audience_id": aud_smart_id,
                                            "total_validated": 0,
                                        }
                                    )
                                    return    

                                i += 1
                                is_last_validation_in_type = count_validations_type == length_validations_type

                                logging.info(f"is last validation in type {is_last_validation_in_type}")

                                for j in range(0, len(enrichment_users), 100):
                                    batch = enrichment_users[j:j+100]
                                    serialized_batch = [
                                        {
                                            **user,
                                            "audience_smart_person_id": str(user["audience_smart_person_id"]),
                                        }
                                        for user in batch
                                    ]
        
                                    is_last_iteration_in_last_validation = (i == count_validations) and (j + 100 >= len(enrichment_users))

                                    message_body = {
                                        'aud_smart_id': str(aud_smart_id),
                                        'user_id': user_id,
                                        'batch': serialized_batch,
                                        'validation_type': column_name,
                                        'count_persons_before_validation': len(enrichment_users),
                                        'is_last_validation_in_type': is_last_validation_in_type,
                                        'is_last_iteration_in_last_validation': is_last_iteration_in_last_validation
                                    }

                                    if column_name == "job_validation":
                                        await publish_rabbitmq_message(
                                            connection=connection,
                                            queue_name=AUDIENCE_VALIDATION_AGENT_LINKEDIN_API,
                                            message_body=message_body
                                        )
                                    elif column_name == "confirmation":
                                        await publish_rabbitmq_message(
                                            connection=connection,
                                            queue_name=AUDIENCE_VALIDATION_AGENT_PHONE_OWNER_API,
                                            message_body=message_body
                                        )
                                    else:
                                        message_body["recency_business_days"] = recency_business_days
                                        message_body["recency_personal_days"] = recency_personal_days
                                        await publish_rabbitmq_message(
                                            connection=connection,
                                            queue_name=AUDIENCE_VALIDATION_AGENT_NOAPI,
                                            message_body=message_body
                                        )

                                await wait_for_ping(connection, aud_smart_id, column_name)

                                logging.info(f"ping came {aud_smart_id}.")
            
            await message.ack()                  
    
        except IntegrityError as e:
            logging.warning(f"SmartAudience with ID {aud_smart_id} might have been deleted. Skipping.")
            db_session.rollback()
            await message.ack()

    except Exception as e:
        logging.error(f"Error processing matching: {e}", exc_info=True)
        await message.nack()


async def main():
    log_level = logging.INFO
    if len(sys.argv) > 1:
        arg = sys.argv[1].upper()
        if arg == 'DEBUG':
            log_level = logging.DEBUG
        elif arg != 'INFO':
            sys.exit("Invalid log level argument. Use 'DEBUG' or 'INFO'.")
    
    setup_logging(log_level)
    db_username = os.getenv('DB_USERNAME')
    db_password = os.getenv('DB_PASSWORD')
    db_host = os.getenv('DB_HOST')
    db_name = os.getenv('DB_NAME')

    try:
        logging.info("Starting processing...")
        rmq_connection = RabbitMQConnection()
        connection = await rmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        engine = create_engine(
            f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}", pool_pre_ping=True
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()

        queue = await channel.declare_queue(
            name=AUDIENCE_VALIDATION_FILLER,
            durable=True,
        )
        await queue.consume(
                functools.partial(aud_email_validation, connection=connection, db_session=db_session)
            )

        await asyncio.Future()

    except Exception:
        logging.error('Unhandled Exception:', exc_info=True)

    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        if rmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rmq_connection.close()
        logging.info("Shutting down...")

if __name__ == "__main__":
    asyncio.run(main())