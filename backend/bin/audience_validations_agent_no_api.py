import logging
import os
import sys
import asyncio
import functools
import json
import boto3
import random
from datetime import datetime
from uuid import UUID
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
from utils import send_sse
from models.audience_settings import AudienceSetting
from models.audience_smarts_persons import AudienceSmartPerson
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message_with_channel

load_dotenv()

AUDIENCE_VALIDATION_AGENT_NOAPI = 'aud_validation_agent_no-api'
AUDIENCE_VALIDATION_FILLER = 'aud_validation_filler'
AUDIENCE_VALIDATION_PROGRESS = 'AUDIENCE_VALIDATION_PROGRESS'
AUDIENCE_VALIDATION_AGENT_LINKEDIN_API = 'aud_validation_agent_linkedin-api'
AUDIENCE_VALIDATION_AGENT_PHONE_OWNER_API = 'aud_validation_agent_phone-owner-api'

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


async def aud_validation_agent(
    message: IncomingMessage,
    db_session: Session,
    channel
):
    try:
        body = json.loads(message.body)
        user_id = body.get("user_id")
        aud_smart_id = body.get("aud_smart_id")
        batch = body.get("batch", [])
        count_persons_before_validation = body.get("count_persons_before_validation")
        recency_personal_days = body.get("recency_personal_days", 0)
        recency_business_days = body.get("recency_business_days", 0)
        validation_type = body.get("validation_type")
        logging.info(f"aud_smart_id: {aud_smart_id}")
        logging.info(f"validation_type: {validation_type}")
        validation_rules = {
            "personal_email_validation_status": lambda v: bool(v and v.startswith("Valid")),
            "business_email_validation_status": lambda v: bool(v and v.startswith("Valid")),
            "personal_email_last_seen": lambda v: bool(v and (datetime.now() - datetime.fromisoformat(v)).days <= recency_personal_days),
            "business_email_last_seen_date": lambda v: bool(v and (datetime.now() - datetime.fromisoformat(v)).days <= recency_business_days),
            "mobile_phone_dnc": lambda v: v is False,
        }

        failed_ids = [
            rec["audience_smart_person_id"]
            for rec in batch
            if not validation_rules.get(validation_type, lambda _: False)(rec.get(validation_type))
        ]
        logging.info(f"Failed ids len: {len(failed_ids)}")
        success_ids = [
            rec["audience_smart_person_id"]
            for rec in batch
            if rec["audience_smart_person_id"] not in failed_ids
        ]
        logging.info(f"Success ids len: {len(success_ids)}")

        if failed_ids:
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [{"id": pid, "is_validation_processed": False, "is_valid": False} for pid in failed_ids]
            )
            db_session.flush()
            
        if success_ids:
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [{"id": pid, "is_validation_processed": False} for pid in success_ids]
            )
            db_session.flush()
            
        db_session.commit()
        total_validated = db_session.execute(
            select(func.count(AudienceSmartPerson.id))
            .where(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_valid.is_(True)
            )
        ).scalar_one()
        
        validation_count = db_session.execute(
            select(func.count(AudienceSmartPerson.id))
            .where(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_validation_processed.is_(False)
            )
        ).scalar_one()

        total_count = db_session.query(AudienceSmartPerson).filter(
            AudienceSmartPerson.smart_audience_id == aud_smart_id
        ).count()
        
        if validation_count == total_count:
            aud_smart = db_session.get(AudienceSmart, aud_smart_id)
            if aud_smart and aud_smart.validations:
                validations = json.loads(aud_smart.validations)
                key = COLUMN_MAPPING.get(validation_type)
                for category in validations.values():
                    for rule in category:
                        if key in rule:
                            rule[key]["processed"] = True
                            rule[key]["count_validated"] = total_validated
                            rule[key]["count_submited"] = count_persons_before_validation
                aud_smart.validations = json.dumps(validations)
                db_session.commit()
            await publish_rabbitmq_message_with_channel(
                channel=channel,
                queue_name=AUDIENCE_VALIDATION_FILLER,
                message_body={
                    'aud_smart_id': str(aud_smart_id),
                    'user_id': user_id,
                    'validation_params': validations
                }
            )

        await send_sse(
            channel=channel,
            user_id=user_id,
            data={"smart_audience_id": aud_smart_id, "total_validated": total_validated}
        )
        logging.info("Sent SSE with total count")

        await message.ack()

    except IntegrityError:
        logging.warning(f"AudienceSmart {aud_smart_id} not found; skipping.")
        db_session.rollback()
        await message.reject(requeue=True)
    except Exception as e:
        logging.error(f"Error in aud_validation_agent: {e}", exc_info=True)
        db_session.rollback()
        await message.reject(requeue=True)

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
                functools.partial(aud_validation_agent, channel=channel, db_session=db_session)
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