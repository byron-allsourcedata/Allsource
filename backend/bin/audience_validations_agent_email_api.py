import logging
import os
import sys
import asyncio
import functools
import json
from datetime import datetime, timedelta
from aio_pika import IncomingMessage
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.audience_smarts import AudienceSmart
from dateutil import parser
from typing import Optional
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from persistence.million_verifier import MillionVerifierPersistence
from models.audience_smarts_persons import AudienceSmartPerson
from models.audience_smarts_validations import AudienceSmartValidation
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_VALIDATION_AGENT_EMAIL_API = 'aud_validation_agent_email-api'
AUDIENCE_VALIDATION_PROGRESS = 'AUDIENCE_VALIDATION_PROGRESS'
AUDIENCE_VALIDATION_FILLER = 'aud_validation_filler'

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


async def process_rmq_message(
    message: IncomingMessage,
    db_session: Session,
    connection: RabbitMQConnection,
    million_verifier_service: MillionVerifierIntegrationsService,
):
    try:
        body = json.loads(message.body)
        user_id = body.get("user_id")
        aud_smart_id = body.get("aud_smart_id")
        batch = body.get("batch", [])
        validation_type = body.get("validation_type")
        logging.info(f"aud_smart_id: {aud_smart_id}")
        logging.info(f"validation_type: {validation_type}")
        failed_ids: list[int] = []
        for rec in batch:
            if validation_type == 'personal_email':
                email = rec.get("personal_email")
                if not email:
                    failed_ids.append(rec["audience_smart_person_id"])
                    continue
                if not million_verifier_service.is_email_verify(email):
                    failed_ids.append(rec["audience_smart_person_id"])
                    continue
            elif validation_type == 'business_email':
                email = rec.get("business_email")
                if not email:
                    failed_ids.append(rec["audience_smart_person_id"])
                    continue
                if not million_verifier_service.is_email_verify(email):
                    failed_ids.append(rec["audience_smart_person_id"])
                    continue
                
        
        success_ids = [
            rec["audience_smart_person_id"]
            for rec in batch
            if rec["audience_smart_person_id"] not in failed_ids
        ]
        if failed_ids:
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [
                    {"id": pid, "is_validation_processed": False, "is_valid": False}
                    for pid in failed_ids
                ],
            )
            db_session.flush()
        logging.info(f"Failed ids len: {len(failed_ids)}")
        if success_ids:
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [
                    {"id": pid, "is_validation_processed": False}
                    for pid in success_ids
                ],
            )
            db_session.flush()
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
        total_count = db_session.query(AudienceSmartPerson).filter(
                AudienceSmartPerson.smart_audience_id == aud_smart_id
            ).count()
        
        if validation_count == total_count:
            aud_smart = db_session.get(AudienceSmart, aud_smart_id)
            validations = {}
            if aud_smart and aud_smart.validations:
                validations = json.loads(aud_smart.validations)
                if validation_type in validations:
                    for rule in validations[validation_type]:
                        if "delivery" in rule:
                            rule["delivery"]["processed"] = True

                aud_smart.validations = json.dumps(validations)

            await publish_rabbitmq_message(
                connection=connection,
                queue_name=AUDIENCE_VALIDATION_FILLER,
                message_body={
                    "aud_smart_id": str(aud_smart_id),
                    "user_id": user_id,
                    "validation_params": validations,
                },
            )
        db_session.commit()
        await send_sse(
            connection,
            user_id,
            {"smart_audience_id": aud_smart_id, "total_validated": total_validated},
        )
        logging.info("sent sse with total count")

        await message.ack()

    except Exception as e:
        logging.error(f"Error processing validation: {e}", exc_info=True)
        await message.ack()



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