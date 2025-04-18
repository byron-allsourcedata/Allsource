import logging
import os
import sys
import asyncio
import functools
import json
import boto3
import random
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
from models.enrichment_users import EnrichmentUser
from models.enrichment_user_contact import EnrichmentUserContact
from models.emails_enrichment import EmailEnrichment
from models.emails import Email
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_VALIDATION_FILLER = 'aud_validation_filler'
AUDIENCE_VALIDATION_AGENT_NOAPI = 'aud_validation_agent_no-api'
AUDIENCE_VALIDATION_PROGRESS = 'AUDIENCE_VALIDATION_PROGRESS'

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

async def send_sse(connection, user_id: int, data: dict):
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

async def wait_for_ping(connection, aud_smart_id, validation_type):
    queue_name = f"validation_complete_{aud_smart_id}_{validation_type}"
    channel = await connection.channel()
    queue = await channel.declare_queue(queue_name, durable=True)

    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            if message:
                message_body = json.loads(message.body)
                if message_body.get("status") == "validation_complete":
                    await message.ack()
                    break

async def aud_email_validation(message: IncomingMessage, db_session: Session, connection):
    try:
        message_body = json.loads(message.body)
        user_id = message_body.get("user_id")
        aud_smart_id = message_body.get("aud_smart_id")
        validation_params = message_body.get("validation_params")

        recency_days = 0

        logging.info(f"Processed email validation for aud_smart_id {aud_smart_id}.")    

        try:
            priority_record = (
                db_session.query(AudienceSetting.value)
                .filter(AudienceSetting.alias == "validation_priority")
                .first()
            )

            priority_values = priority_record.value.split(",")[:5]

            column_mapping = {
                'personal_email-mx': 'personal_email_validation_status',
                'personal_email-recency': 'personal_email_last_seen',
                'business_email-mx': 'business_email_validation_status',
                'business_email-recency': 'business_email_last_seen_date',
                'phone-dnc_filter': 'mobile_phone_dnc'
            }

            # {
            #     "user_id": 110,
            #     "aud_smart_id": "f5a4777a-cb64-4edd-a572-d9ead969b4fb", 
            #     "validation_params": {
            #     "personal_email": [
            #         {"mx": {"processed": false}},
            #         {"recency": {"days": 90, "processed": false}}
            #     ],
            #     "business_email": [
            #         {"delivery": {"processed": false}},
            #         {"recency": {"days": 90, "processed": false}}
            #     ],
            #     "phone": [
            #         {"dnc_filter": {"processed": false}}
            #     ],
            #     "postal_cas": [
            #     ],
            #     "linked_in": [
            #     ]
            #     }
            # }


            print("validation_params", validation_params)
            i = 1

            for value in priority_values:
                validation, validation_type = value.split('-')[0], value.split('-')[1]
                print("validation - ",  validation, "; validation_type - " , validation_type)
                if validation in validation_params:
                    validation_params_list = validation_params.get(validation)
                    print("validation_params_list", validation_params_list)
                    if any(validation_type in param for param in validation_params_list):
                        column_name = column_mapping.get(value)
                        print("column_name", column_name)
                        if not column_name:
                            continue

                        if validation_type == "recency":
                            for param in validation_params_list:
                                if "recency" in param:
                                    recency_days = param["recency"].get("days")
                                    break
                                    
                        enrichment_users = [
                            {
                                "audience_smart_person_id": user.audience_smart_person_id,
                                column_name: (
                                    getattr(user, column_name).isoformat() 
                                    if isinstance(getattr(user, column_name), datetime) 
                                    else getattr(user, column_name)
                                ),
                            }
                            for user in db_session.query(
                                AudienceSmartPerson.id.label("audience_smart_person_id"),
                                getattr(EnrichmentUserContact, column_name),
                            )
                            .join(
                                EnrichmentUserContact,
                                EnrichmentUserContact.enrichment_user_id == AudienceSmartPerson.enrichment_user_id,
                            )
                            .filter(
                                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                                AudienceSmartPerson.is_validation_processed == True,
                            )
                            .all()
                        ]

                        print("count person which will processed validation", len(enrichment_users))

                        if not enrichment_users:
                            logging.info(f"No enrichment users found for aud_smart_id {aud_smart_id}.")
                            continue    


                        is_last_validation = i == len(priority_values) - 1

                        logging.info(f"is_last_validation {is_last_validation}")

                        for j in range(0, len(enrichment_users), 100):
                            batch = enrichment_users[j:j+100]
                            serialized_batch = [
                                {
                                    "audience_smart_person_id": str(user["audience_smart_person_id"]),
                                    column_name: user[column_name]
                                }
                                for user in batch
                            ]

                            is_last_iteration_in_last_validation = (i == len(priority_values) - 1) and (j + 100 >= len(enrichment_users))

                            message_body = {
                                'aud_smart_id': str(aud_smart_id),
                                'user_id': user_id,
                                'recency_days': recency_days,
                                'batch': serialized_batch,
                                'validation_type': column_name,
                                'is_last_iteration_in_last_validation': is_last_iteration_in_last_validation
                            }
                            await publish_rabbitmq_message(
                                connection=connection,
                                queue_name=AUDIENCE_VALIDATION_AGENT_NOAPI,
                                message_body=message_body
                            )

                        await wait_for_ping(connection, aud_smart_id, column_name)

                        logging.info(f"ping came {aud_smart_id}.")
                        i += 1


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