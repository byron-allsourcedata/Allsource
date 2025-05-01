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
        recency_business_days = body.get("recency_business_days", 0)
        recency_personal_days = body.get("recency_personal_days", 0)
        last_iter = body.get("is_last_iteration_in_last_validation", False)

        verified_emails: list[AudienceSmartValidation] = []
        failed_ids: list[int] = []
        now = datetime.now()

        def parse_date(date_str: Optional[str]) -> Optional[datetime]:
            if not date_str or not isinstance(date_str, str):
                return None
            try:
                return parser.parse(date_str)
            except (ValueError, parser.ParserError):
                return None

        def handle_personal_status(rec):
            last_seen = parse_date(rec.get("personal_email_last_seen"))
            status = rec.get("personal_email_validation_status") or ""
            email = rec.get("personal_email")
            pid = rec.get("audience_smart_person_id")
            if last_seen and last_seen >= now - timedelta(days=30) and status not in ('', None, 'Invalid', 'UNKNOWN'):
                return pid, email, True

            if email and million_verifier_service.is_email_verify(email):
                return pid, email, True
            return pid, email, False

        def handle_personal_last_seen(rec):
            last_seen = parse_date(rec.get("personal_email_last_seen"))
            pid = rec.get("audience_smart_person_id")
            email = rec.get("personal_email")
            if last_seen and last_seen >= now - timedelta(days=recency_personal_days):
                return pid, email, True
            return pid, email, False

        def handle_business_status(rec):
            last_seen = parse_date(rec.get("personal_email_last_seen"))
            pid = rec.get("audience_smart_person_id")
            email = rec.get("business_email")
            if last_seen and last_seen >= now - timedelta(days=recency_personal_days):
                return pid, email, True
            if email and million_verifier_service.is_email_verify(email):
                return pid, email, True
            return pid, email, False

        def handle_business_last_seen(rec):
            last_seen = parse_date(rec.get("business_email_last_seen_date"))
            status = rec.get("business_email_validation_status") or ""
            pid = rec.get("audience_smart_person_id")
            email = rec.get("business_email")
            if last_seen and last_seen >= now - timedelta(days=recency_business_days) and status not in ('', None, 'Invalid', 'UNKNOWN'):
                return pid, email, True
            return pid, email, False

        handlers = {
            'personal_email_validation_status': handle_personal_status,
            'personal_email_last_seen':    handle_personal_last_seen,
            'business_email_validation_status': handle_business_status,
            'business_email_last_seen':     handle_business_last_seen,
        }
        logging.info(f"Validation type {validation_type}")
        handler = handlers.get(validation_type)
        if not handler:
            raise ValueError(f"Unknown validation_type: {validation_type}")

        for rec in batch:
            pid, email, ok = handler(rec)
            if ok:
                verified_emails.append(
                    AudienceSmartValidation(
                        audience_smart_person_id=pid,
                        verified_email=email,
                    )
                )
            else:
                failed_ids.append(pid)

        if verified_emails:
            logging.info(f"Saving {len(verified_emails)} verified emails")
            db_session.bulk_save_objects(verified_emails)
            db_session.commit()

        if failed_ids:
            logging.info(f"Marking {len(failed_ids)} as failed")
            mappings = [
                {"id": pid, "is_validation_processed": False}
                for pid in failed_ids
            ]
            db_session.bulk_update_mappings(AudienceSmartPerson, mappings)
            db_session.commit()

        if last_iter:
            logging.info("Performing final validation update")
            with db_session.begin():
                base_q = db_session.query(AudienceSmartPerson).filter(
                    AudienceSmartPerson.smart_audience_id == aud_smart_id,
                    AudienceSmartPerson.is_validation_processed.is_(True),
                )
                total_validated = base_q.count()
                base_q.update({"is_valid": True}, synchronize_session=False)
                db_session.query(AudienceSmart).filter(
                    AudienceSmart.id == aud_smart_id
                ).update({
                    "validated_records": total_validated,
                    "status": "ready",
                }, synchronize_session=False)

            await send_sse(
                connection,
                user_id,
                {"smart_audience_id": aud_smart_id, "total_validated": total_validated},
            )
            logging.info("SSE sent with total count")

        await publish_rabbitmq_message(
            connection=connection,
            queue_name="validation_complete",
            message_body={
                "aud_smart_id": aud_smart_id,
                "validation_type": validation_type,
                "status": "validation_complete",
            },
        )
        logging.info(f"Sent ping {aud_smart_id}")

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