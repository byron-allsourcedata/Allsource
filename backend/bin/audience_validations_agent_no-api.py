import logging
import os
import sys
import asyncio
import functools
import json
import boto3
import random
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
from models.enrichment_users import EnrichmentUser
from models.emails_enrichment import EmailEnrichment
from models.emails import Email
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

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

async def aud_email_validation(message: IncomingMessage, db_session: Session, connection):
    try:
        message_body = json.loads(message.body)
        user_id = message_body.get("user_id")
        aud_smart_id = message_body.get("aud_smart_id")

        try:
            enrichment_users = (
                db_session.query(
                    AudienceSmartPerson.enrichment_user_id,
                    AudienceSmartPerson.id.label("audience_smart_person_id"),
                    Email.email.label("email"),
                )
                .join(EnrichmentUser, EnrichmentUser.id == AudienceSmartPerson.enrichment_user_id)
                .outerjoin(EmailEnrichment, EmailEnrichment.enrichment_user_id == EnrichmentUser.id)
                .outerjoin(Email, Email.id == EmailEnrichment.email_id)
                .filter(AudienceSmartPerson.smart_audience_id == aud_smart_id)
                .all()
            )

            if not enrichment_users:
                logging.info(f"No enrichment users found for aud_smart_id {aud_smart_id}.")
                await message.ack()
                return

            random_count = random.randint(1, len(enrichment_users))
            selected_records = random.sample(enrichment_users, random_count)
            
            logging.info(f"Randomly selected {random_count} person.")

            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [{"id": record.audience_smart_person_id, "is_valid": True} for record in selected_records]
            )

            db_session.query(AudienceSmart).filter(
                AudienceSmart.id == aud_smart_id
            ).update(
                {
                    "validated_records": random_count,
                    "status": "ready",
                }
            )

            await send_sse(connection, user_id, {"smart_audience_id": aud_smart_id, "total": random_count})
            logging.info(f"sent sse with total count")

            db_session.commit()

            logging.info(f"Processed email validation for aud_smart_id {aud_smart_id}.")                            

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
            name=AUDIENCE_VALIDATION_AGENT_NOAPI,
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