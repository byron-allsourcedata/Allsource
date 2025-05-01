import logging
import os
import sys
import asyncio
import functools
import json
from datetime import datetime, timedelta
from aio_pika import IncomingMessage
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.audience_smarts import AudienceSmart
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from persistence.million_verifier import MillionVerifierPersistence
from models.audience_smarts_persons import AudienceSmartPerson
from models.audience_smarts_validations import AudienceSmartValidation
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_VALIDATION_AGENT_EMAIL_API = 'aud_validation_agent_email-api'
AUDIENCE_VALIDATION_PROGRESS = 'AUDIENCE_VALIDATION_PROGRESS'

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


async def process_rmq_message(message: IncomingMessage, db_session: Session, connection: RabbitMQConnection, million_verifier_service: MillionVerifierIntegrationsService):
    try:
        message_body = json.loads(message.body)
        user_id = message_body.get("user_id")
        aud_smart_id = message_body.get("aud_smart_id")
        batch = message_body.get("batch")
        validation_type = message_body.get("validation_type")
        recency_business_days = message_body.get("recency_business_days")
        recency_personal_days = message_body.get("recency_personal_days")
        is_last_iteration_in_last_validation = message_body.get("is_last_iteration_in_last_validation", False) 

        verified_emails = []
        failed_ids = []
        for record in batch:
            person_id = record.get("audience_smart_person_id")
            personal_email = record.get("personal_email")
            personal_email_last_seen = record.get("personal_email_last_seen")
            personal_email_validation_status = record.get("personal_email_validation_status")
            business_email = record.get("business_email")
            business_email_last_seen_date = record.get("business_email_last_seen_date")
            business_email_validation_status = record.get("business_email_validation_status")
            is_verify = million_verifier_service.is_email_verify(email=personal_email)
            if validation_type == 'personal_email_validation_status':
                is_verify = million_verifier_service.is_email_verify(personal_email)
                if is_verify:
                    verified_emails.append(
                            AudienceSmartValidation(
                                audience_smart_person_id=person_id,
                                verified_email=personal_email
                            )
                        )
                else:
                    failed_ids.append(person_id)
                    continue
                
            if validation_type == 'personal_email_last_seen':
                if (datetime.strptime(personal_email_last_seen, "%d/%m/%Y") < datetime.now() - timedelta(days=30)) and not personal_email_validation_status in ('', None, 'Invalid', 'UNKNOWN'):
                    verified_emails.append(
                            AudienceSmartValidation(
                                audience_smart_person_id=person_id,
                                verified_email=personal_email
                            )
                        )
                    continue
                
            if validation_type == 'business_email_validation_status':
                is_verify = million_verifier_service.is_email_verify(business_email)
                if is_verify:
                    verified_emails.append(
                            AudienceSmartValidation(
                                audience_smart_person_id=person_id,
                                verified_email=business_email
                            )
                        )
                    continue
                
            if validation_type == 'business_email_last_seen':
                if (datetime.strptime(business_email_last_seen_date, "%d/%m/%Y") < datetime.now() - timedelta(days=30)) and not business_email_validation_status in ('', None, 'Invalid', 'UNKNOWN'):
                    verified_emails.append(
                            AudienceSmartValidation(
                                audience_smart_person_id=person_id,
                                verified_email=business_email
                            )
                        )
                    continue
            
                failed_ids.append(person_id)
        
        if len(verified_emails):
            db_session.bulk_save_objects(verified_emails)
            db_session.commit()
        
        if len(failed_ids):
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [{"id": person_id, "is_validation_processed": False} for person_id in failed_ids]
            )
            db_session.commit()
        
        if is_last_iteration_in_last_validation:
            logging.info(f"is last validation")

            with db_session.begin():
                db_session.query(AudienceSmartPerson).filter(
                    AudienceSmartPerson.smart_audience_id == aud_smart_id,
                    AudienceSmartPerson.is_validation_processed == True,
                ).update({"is_valid": True}, synchronize_session=False)

                total_validated = db_session.query(func.count(AudienceSmartPerson.id)).filter(
                    AudienceSmartPerson.smart_audience_id == aud_smart_id,
                    AudienceSmartPerson.is_validation_processed == True,
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
            name=AUDIENCE_VALIDATION_AGENT_EMAIL_API,
            durable=True,
        )
        million_verifier_service = MillionVerifierIntegrationsService(million_verifier_persistence=MillionVerifierPersistence(db_session))
        await queue.consume(
                functools.partial(process_rmq_message, connection=connection, db_session=db_session, million_verifier_service=million_verifier_service)
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