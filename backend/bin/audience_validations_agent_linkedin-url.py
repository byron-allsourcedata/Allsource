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
from decimal import Decimal
from aio_pika import IncomingMessage, Message, Channel
from sqlalchemy.exc import IntegrityError
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from utils import send_sse
from models.audience_smarts import AudienceSmart
from models.audience_settings import AudienceSetting
from models.audience_smarts_persons import AudienceSmartPerson
from persistence.user_persistence import UserPersistence
from models.enrichment.enrichment_users import EnrichmentUser
from models.enrichment.enrichment_user_contact import EnrichmentUserContact
from models.audience_linkedin_verification import AudienceLinkedinVerification
from models.enrichment.enrichment_employment_history import EnrichmentEmploymentHistory
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message_with_channel

load_dotenv()

AUDIENCE_VALIDATION_AGENT_LINKEDIN_API = 'aud_validation_agent_linkedin-api'
AUDIENCE_VALIDATION_PROGRESS = 'AUDIENCE_VALIDATION_PROGRESS'
AUDIENCE_VALIDATION_FILLER = 'aud_validation_filler'
REVERSE_CONTACT_API_KEY = os.getenv('REVERSE_CONTACT_API_KEY')
REVERSE_CONTACT_API_URL = os.getenv('REVERSE_CONTACT_API_URL')

COLUMN_MAPPING = {
    'personal_email_validation_status': 'mx',
    'business_email_validation_status': 'mx',
    'personal_email_last_seen': 'recency',
    'business_email_last_seen_date': 'recency',
    'mobile_phone_dnc': 'dnc_filter',
    'job_validation': 'job_validation'
}

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

async def process_rmq_message(
    message: IncomingMessage,
    db_session: Session,
    channel: Channel,
    userPersistence: UserPersistence
):
    try:
        body = json.loads(message.body)
        user_id = body.get("user_id")
        aud_smart_id = body.get("aud_smart_id")
        batch = body.get("batch", [])
        count_persons_before_validation = body.get("count_persons_before_validation")
        validation_type = body.get("validation_type")
        validation_cost = body.get("validation_cost")
        logging.info(f"aud_smart_id: {aud_smart_id}")
        logging.info(f"validation_type: {validation_type}")
        failed_ids: list[int] = []
        verifications: list[AudienceLinkedinVerification] = []
        write_off_funds = Decimal(0)

        for rec in batch:
            pid = rec.get("audience_smart_person_id")
            name = rec.get("company_name")
            title = rec.get("job_title")
            url = rec.get("linkedin_url")

            if not (url and title and name):
                failed_ids.append(pid)
                continue
            
            write_off_funds += Decimal(validation_cost)
            ev = (
                db_session.query(AudienceLinkedinVerification)
                .filter_by(linkedin_url=url)
                .first()
            )

            is_verify = False
            if ev is None:
                resp = requests.get(
                    REVERSE_CONTACT_API_URL,
                    params={"linkedInUrl": url, "apikey": REVERSE_CONTACT_API_KEY},
                )
                data = resp.json()
                if resp.status_code == 402 or (resp.status_code != 200 and not data.get("success")):
                    failed_ids.append(pid)
                    continue

                for pos in data.get("person", {}).get("positions", {}).get("positionHistory", []):
                    sim_title = fuzz.ratio(title, pos.get("title", ""))
                    sim_comp = fuzz.ratio(name, pos.get("companyName", ""))
                    if sim_title > 70 and sim_comp > 70:
                        is_verify = True
                        break

                verifications.append(
                    AudienceLinkedinVerification(
                        audience_smart_person_id=pid,
                        linkedin_url=url,
                        is_verify=is_verify,
                    )
                )
            else:
                is_verify = ev.is_verify

            if not is_verify:
                failed_ids.append(pid)
                
        logging.info(f"Failed ids len: {len(failed_ids)}")
        success_ids = [
            rec["audience_smart_person_id"]
            for rec in batch
            if rec["audience_smart_person_id"] not in failed_ids
        ]
        logging.info(f"Success ids: len{len(success_ids)}")

        if write_off_funds:
            userPersistence.deduct_validation_funds(user_id, write_off_funds)
            # if not resultOperation:
            #     logging.error("Not enough validation funds")
            #     await message.reject(requeue=True)
            #     return
            db_session.flush()
        
        if verifications:
            db_session.bulk_save_objects(verifications)
            db_session.flush()

        if failed_ids:
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [
                    {"id": pid, "is_validation_processed": False, "is_valid": False}
                    for pid in failed_ids
                ],
            )
            db_session.flush()
            
        if success_ids:
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [
                    {"id": pid, "is_validation_processed": False}
                    for pid in success_ids
                ],
            )
            db_session.flush()
            
        db_session.commit()
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
                key = COLUMN_MAPPING.get(validation_type)
                for cat in validations.values():
                    for rule in cat:
                        if key in rule:
                            rule[key]["processed"] = True
                            rule[key]["count_validated"] = total_validated
                            rule[key]["count_submited"] = count_persons_before_validation
                            rule[key]["count_cost"] = write_off_funds
                aud_smart.validations = json.dumps(validations)
                db_session.commit()
            await publish_rabbitmq_message_with_channel(
                channel=channel,
                queue_name=AUDIENCE_VALIDATION_FILLER,
                message_body={
                    "aud_smart_id": str(aud_smart_id),
                    "user_id": user_id,
                    "validation_params": validations,
                },
            )
            
        await send_sse(
            channel=channel,
            user_id=user_id,
            data={"smart_audience_id": aud_smart_id, "total_validated": total_validated},
        )
        logging.info("sent sse with total count")

        await message.ack()

    except Exception:
        logging.exception("Error processing matching")
        db_session.rollback()
        await message.reject(requeue=True)
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

        userPersistence = UserPersistence(db_session)

        queue = await channel.declare_queue(
            name=AUDIENCE_VALIDATION_AGENT_LINKEDIN_API,
            durable=True,
        )
        await queue.consume(
                functools.partial(process_rmq_message, channel=channel, db_session=db_session, userPersistence=userPersistence)
            )

        await asyncio.Future()

    except Exception:
        logging.error('Unhandled Exception:', exc_info=True)
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        if rmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rmq_connection.close()
        logging.info("Shutting down...")
        

if __name__ == "__main__":
    asyncio.run(main())