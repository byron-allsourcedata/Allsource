import logging
import os
import sys
import asyncio
import functools
import json
import boto3
import random
import requests
from datetime import datetime
from sqlalchemy import update
from rapidfuzz import fuzz
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
from models.enrichment_user_ids import EnrichmentUserId
from models.enrichment_user_contact import EnrichmentUserContact
from models.enrichment_phones_verification import EnrichmentPhoneVerification
from models.enrichment_linkedin_verification import EnrichmentLinkedinVerification
from models.emails_enrichment import EmailEnrichment
from models.emails import Email
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_VALIDATION_AGENT_PHONE_OWNER_API = 'aud_validation_agent_phone-owner-api'
AUDIENCE_VALIDATION_PROGRESS = 'AUDIENCE_VALIDATION_PROGRESS'
REAL_TIME_API_KEY = os.getenv('REAL_TIME_API_KEY')
REAL_TIME_API_URL = os.getenv('REAL_TIME_API_URL')


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )


async def aud_validation_agent_phone_owner(message: IncomingMessage, db_session: Session):
    try:
        message_body = json.loads(message.body)
        batch = message_body.get("batch")

        failed_ids = []
        verifications = []

        for record in batch:
            person_id = record.get("audience_smart_person_id")
            full_name = record.get("full_name")

            for phone_field in ['phone_mobile1', 'phone_mobile2']:
                phone_number = record.get(phone_field)
                
                is_verify = False

                if not phone_number and phone_field == 'phone_mobile2':
                    failed_ids.append(person_id)
                
                if not phone_number:
                    continue

                existing_verification = db_session.query(EnrichmentPhoneVerification).filter_by(phone=phone_number).first()

                if not existing_verification:
                    response = requests.get(
                        REAL_TIME_API_URL,
                        params={
                            "output": "json",
                            "phone": phone_number,
                            "token": REAL_TIME_API_KEY
                        }
                    )
                    response_data = response.json()

                    logging.info(f"response: {response_data}")

                    if response.status_code != 200 or "error_text" in response_data:
                        await message.nack()
                        continue

                    caller_name = response_data.get("caller_name", "")
                    similarity = fuzz.ratio(full_name, caller_name)
                    is_verify = similarity > 70

                    logging.info(f"similarity: {full_name} - {caller_name} = {similarity}")


                    verifications.append(
                        EnrichmentPhoneVerification(
                            audience_smart_person_id=person_id,
                            phone=phone_number,
                            status=response_data.get("status", ""),
                            is_verify=is_verify
                        )
                    )
                else:
                    is_verify = existing_verification.is_verify

                if not is_verify and phone_field == 'phone_mobile2':
                    failed_ids.append(person_id)
                elif is_verify:
                    break
                else:
                    continue


        if verifications:
            db_session.bulk_save_objects(verifications)
            db_session.commit()


        if failed_ids:
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [{"id": person_id, "is_validation_processed": False} for person_id in failed_ids]
            )
            db_session.commit()
            
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
            name=AUDIENCE_VALIDATION_AGENT_PHONE_OWNER_API,
            durable=True,
        )
        await queue.consume(
                functools.partial(aud_validation_agent_phone_owner, db_session=db_session)
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