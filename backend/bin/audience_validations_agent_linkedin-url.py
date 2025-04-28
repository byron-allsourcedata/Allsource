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
from models.audience_linkedin_verification import AudienceLinkedinVerification
from models.enrichment_employment_history import EnrichmentEmploymentHistory
from models.emails_enrichment import EmailEnrichment
from models.enrichment_user_ids import EnrichmentUserId
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


async def process_rmq_message(message: IncomingMessage, db_session: Session, connection: RabbitMQConnection):
    try:
        message_body = json.loads(message.body)
        user_id = message_body.get("user_id")
        aud_smart_id = message_body.get("aud_smart_id")
        batch = message_body.get("batch")
        validation_type = message_body.get("validation_type")
        count_persons_before_validation = message_body.get("count_persons_before_validation")
        is_last_validation_in_type = message_body.get("is_last_validation_in_type")
        is_last_iteration_in_last_validation = message_body.get("is_last_iteration_in_last_validation", False) 

        failed_ids = []
        verifications = []

        for record in batch:
            person_id = record.get("audience_smart_person_id")
            company_name = record.get("company_name")
            job_title = record.get("job_title")
            linkedin_url = record.get("linkedin_url")

            is_verify = False

            if not linkedin_url or not job_title or not company_name:
                failed_ids.append(person_id)
                continue
                

            existing_verification = db_session.query(AudienceLinkedinVerification).filter_by(linkedin_url=linkedin_url).first()

            if not existing_verification:
                response = requests.get(
                    REVERSE_CONTACT_API_URL,
                    params={
                        "linkedInUrl": linkedin_url,
                        "apikey": REVERSE_CONTACT_API_KEY
                    }
                )
                response_data = response.json()

                if response.status_code != 200 and not response_data.get("success"):
                    await message.ack()
                    return

                positions = response_data.get("person", {}).get("positions", {}).get("positionHistory", [])
                for position in positions:
                    title = position.get("title", "")
                    company = position.get("companyName", "") 
                    similarity_job_title = fuzz.ratio(job_title, title)
                    similarity_company_name = fuzz.ratio(company_name, company)
                    
                    logging.info(f"similarity company: {company_name} - {company} = {similarity_company_name}")
                    logging.info(f"similarity job: {job_title} - {title} = {similarity_job_title}")

                    if similarity_company_name > 70 and similarity_job_title > 70:
                        is_verify = True
                        break
                
                verifications.append(
                    AudienceLinkedinVerification(
                        audience_smart_person_id=person_id,
                        linkedin_url=linkedin_url,
                        is_verify=is_verify
                    )
                )

            else: 
                logging.info("There is such a LinkedIn in our database")
                is_verify = existing_verification.is_verify
            

            if not is_verify:
                failed_ids.append(person_id)

        if len(verifications):
            db_session.bulk_save_objects(verifications)
            db_session.commit()

        if len(failed_ids):
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [{"id": person_id, "is_validation_processed": False} for person_id in failed_ids]
            )
            db_session.commit()
        
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
                subquery = (
                    select(EnrichmentUserId.id)
                    .select_from(EnrichmentUserContact)
                    .join(EnrichmentUserId, EnrichmentUserId.asid == EnrichmentUserContact.asid)
                    .join(AudienceSmartPerson, EnrichmentUserId.id == AudienceSmartPerson.enrichment_user_id)
                    .join(EnrichmentEmploymentHistory, EnrichmentEmploymentHistory.asid == EnrichmentUserId.asid)
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
            logging.info(f"sent ping {aud_smart_id}.")
            
        await message.ack()

    except Exception as e:
        logging.error(f"Error processing matching: {e}", exc_info=True)
        await message.ack()
        return 


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
                functools.partial(process_rmq_message, connection=connection, db_session=db_session)
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