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
from rapidfuzz import fuzz
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
from models.enrichment_linkedin_verification import EnrichmentLinkedinVerification
from models.emails_enrichment import EmailEnrichment
from models.emails import Email
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_VALIDATION_AGENT_LINKEDIN_API = 'aud_validation_agent_linkedin-api'
AUDIENCE_VALIDATION_PROGRESS = 'AUDIENCE_VALIDATION_PROGRESS'
REVERSE_CONTACT_API_KEY = os.getenv('REVERSE_CONTACT_API_KEY')
REVERSE_CONTACT_API_URL = os.getenv('REVERSE_CONTACT_API_URL')

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )


async def aud_validation_agent_linkedin_url(message: IncomingMessage, db_session: Session):
    try:
        message_body = json.loads(message.body)
        batch = message_body.get("batch")

        failed_ids = []
        verifications = []

        for record in batch:
            person_id = record.get("audience_smart_person_id")
            company_name = record.get("company_name")
            job_title = record.get("job_title")
            linkedin_url = record.get("linkedin_url")

            is_verify = False

            if not linkedin_url:
                failed_ids.append(person_id)
                continue

            existing_verification = db_session.query(EnrichmentLinkedinVerification).filter_by(linkedin_url=linkedin_url).first()

            if not existing_verification:
                response = requests.get(
                    REVERSE_CONTACT_API_URL,
                    params={
                        "linkedInUrl": linkedin_url,
                        "apikey": REVERSE_CONTACT_API_KEY
                    }
                )
                response_data = response.json()

                logging.info(f"response: {response_data}")

                if response.status_code != 200:
                    await message.nack()
                    continue

                positions = response_data.get("person", {}).get("positions", {}).get("positionHistory", [])
                for position in positions:
                    similarity_job_title = fuzz.ratio(job_title, position.title)
                    similarity_company_name = fuzz.ratio(company_name, position.companyName)
                    
                    logging.info(f"similarity company: {company_name} - {position.companyName} = {similarity_company_name}")
                    logging.info(f"similarity job: {job_title} - {position.title} = {similarity_job_title}")

                    if similarity_company_name > 70 and similarity_job_title > 70:
                        is_verify = True
                        break
                
                verifications.append(
                    EnrichmentLinkedinVerification(
                        audience_smart_person_id=person_id,
                        linkedin_url=linkedin_url,
                        is_verify=is_verify
                    )
                )
            else: 
                is_verify = existing_verification.is_verify

            if not is_verify:
                failed_ids.append(person_id)


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
            name=AUDIENCE_VALIDATION_AGENT_LINKEDIN_API,
            durable=True,
        )
        await queue.consume(
                functools.partial(aud_validation_agent_linkedin_url, db_session=db_session)
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