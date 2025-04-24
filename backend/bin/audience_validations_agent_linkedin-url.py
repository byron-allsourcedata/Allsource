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
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.audience_smarts import AudienceSmart
from models.audience_settings import AudienceSetting
from models.audience_smarts_persons import AudienceSmartPerson
from models.enrichment_users import EnrichmentUser
from models.enrichment_user_contact import EnrichmentUserContact
from models.emails_enrichment import EmailEnrichment
from models.emails import Email
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_VALIDATION_AGENT_LINKEDIN_API = 'aud_validation_agent_linkedin-api'
AUDIENCE_VALIDATION_PROGRESS = 'AUDIENCE_VALIDATION_PROGRESS'
REVERSE_CONTACT_API_KEY = os.getenv('REVERSE_CONTACT_API_KEY')
REVERSE_CONTACT_API_URL = os.getenv('REVERSE_CONTACT_API_URL')

COLUMN_MAPPING = {
    'personal_email_validation_status': 'mx',
    'business_email_validation_status': 'mx',
    'personal_email_last_seen': 'recency',
    'business_email_last_seen_date': 'recency',
    'mobile_phone_dnc': 'dnc_filter'
}

VALIDATION_MAPPING = {
    'personal_email_validation_status': 'personal_email-mx',
    'personal_email_last_seen': 'personal_email-recency',
    'business_email_validation_status': 'business_email-mx',
    'business_email_last_seen_date': 'business_email-recency',
    'mobile_phone_dnc': 'phone-dnc_filter'
}

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

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


def update_stats_validations(db_session: Session, validation_type: str, count_persons_before_validation: int, count_failed_person: int):
    validation_key = VALIDATION_MAPPING.get(validation_type)

    valid_persons_count = count_persons_before_validation - count_failed_person
    new_data = {
        "total_count": count_persons_before_validation,
        "valid_count": valid_persons_count
    }
    existing_record = db_session.query(AudienceSetting).filter(AudienceSetting.alias == "counts_validations").first()
    if existing_record:
        current_data = json.loads(existing_record.value)

        existing_data = current_data.get(validation_key, {"total_count": 0, "valid_count": 0})

        updated_data = {
            "total_count": existing_data.get("total_count") + new_data["total_count"],
            "valid_count": existing_data.get("valid_count") + new_data["valid_count"]
        }

        current_data[validation_key] = updated_data
        existing_record.value = json.dumps(current_data)

    else:
        new_record = AudienceSetting(
            alias="counts_validations",
            value=json.dumps({validation_key: new_data})
        )
        db_session.add(new_record)


async def aud_validation_agent_linkedin_api(message: IncomingMessage, db_session: Session, connection: RabbitMQConnection):
    try:
        message_body = json.loads(message.body)
        user_id = message_body.get("user_id")
        aud_smart_id = message_body.get("aud_smart_id")
        batch = message_body.get("batch")
        recency_personal_days = message_body.get("recency_personal_days")
        recency_business_days = message_body.get("recency_business_days")
        validation_type = message_body.get("validation_type")
        count_persons_before_validation = message_body.get("count_persons_before_validation")
        is_last_validation_in_type = message_body.get("is_last_validation_in_type")
        is_last_iteration_in_last_validation = message_body.get("is_last_iteration_in_last_validation", False) 

        try:

            validation_rules = {
                # "personal_email_validation_status": lambda value: True,
                # "business_email_validation_status": lambda value: True,
                # "personal_email_last_seen": lambda value: True,
                # "business_email_last_seen_date": lambda value: True,
                # "mobile_phone_dnc": lambda value: True,
                "personal_email_validation_status": lambda value: value.startswith("Valid") if value else False,
                "business_email_validation_status": lambda value: value.startswith("Valid") if value else False,
                "personal_email_last_seen": lambda value: (datetime.now() - datetime.fromisoformat(value)).days <= recency_personal_days if value else False,
                "business_email_last_seen_date": lambda value: (datetime.now() - datetime.fromisoformat(value)).days <= recency_business_days if value else False,
                "mobile_phone_dnc": lambda value: value is False,
            }

            failed_ids = [
                record["audience_smart_person_id"]
                for record in batch
                if not validation_rules[validation_type](record.get(validation_type))
            ]

            if failed_ids:
                db_session.bulk_update_mappings(
                    AudienceSmartPerson,
                    [{"id": person_id, "is_validation_processed": False} for person_id in failed_ids]
                )


            # update_stats_validations(db_session, validation_type, count_persons_before_validation, len(failed_ids))
            

            if is_last_validation_in_type:
                aud_smart = db_session.query(AudienceSmart).filter_by(id=aud_smart_id).first()
                if aud_smart:
                    validations = json.loads(aud_smart.validations)
                    for category in validations.values():
                        for rule in category:
                            column_name = COLUMN_MAPPING.get(validation_type)
                            if column_name in rule:
                                rule[column_name]["processed"] = True
                    aud_smart.validations = json.dumps(validations)
            

            db_session.commit()

            if is_last_iteration_in_last_validation:
                logging.info(f"is last validation")

                with db_session.begin():
                    subquery = select(EnrichmentUser.id).join(
                        EnrichmentUserContact,EnrichmentUserContact.asid == EnrichmentUser.asid).filter(
                        EnrichmentUserContact.enrichment_user_id == AudienceSmartPerson.enrichment_user_id
                    )

                    db_session.query(AudienceSmartPerson).filter(
                        AudienceSmartPerson.smart_audience_id == aud_smart_id,
                        AudienceSmartPerson.is_validation_processed == True,
                        AudienceSmartPerson.enrichment_user_id.in_(subquery)
                    ).update({"is_valid": True}, synchronize_session=False)

                    total_validated = db_session.query(func.count(AudienceSmartPerson.id)).filter(
                        AudienceSmartPerson.smart_audience_id == aud_smart_id,
                        AudienceSmartPerson.is_validation_processed == True,
                        AudienceSmartPerson.enrichment_user_id.in_(subquery)
                    ).scalar()

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
                    connection,
                    user_id,
                    {
                        "smart_audience_id": aud_smart_id,
                        "total_validated": total_validated,
                    }
                )
                logging.info(f"sent sse with total count")


            await publish_rabbitmq_message(
                connection=connection,
                queue_name=f"validation_complete",
                message_body={
                    "aud_smart_id": aud_smart_id,
                    "validation_type": validation_type,
                    "status": "validation_complete"
                }
            )
            

            logging.info(f"send ping {aud_smart_id}.")

                       

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
            name=AUDIENCE_VALIDATION_AGENT_LINKEDIN_API,
            durable=True,
        )
        await queue.consume(
                functools.partial(aud_validation_agent_linkedin_api, connection=connection, db_session=db_session)
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