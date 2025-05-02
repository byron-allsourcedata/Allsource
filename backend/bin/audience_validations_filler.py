import logging
import os
import sys
import asyncio
import functools
import json
import boto3
import random
from uuid import UUID
from datetime import datetime
from sqlalchemy import update, create_engine, func
from aio_pika import IncomingMessage, Message
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from typing import List

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.audience_smarts import AudienceSmart
from models.audience_smarts_persons import AudienceSmartPerson
from models.audience_settings import AudienceSetting
from enums import AudienceSettingAlias
from models.enrichment.enrichment_users import EnrichmentUser
from models.usa_zip_codes import UsaZipCode
from models.enrichment.enrichment_user_contact import EnrichmentUserContact
from models.enrichment.enrichment_employment_history import EnrichmentEmploymentHistory
from models.enrichment.enrichment_personal_profiles import EnrichmentPersonalProfiles
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_VALIDATION_FILLER = 'aud_validation_filler'
AUDIENCE_VALIDATION_AGENT_NOAPI = 'aud_validation_agent_no-api'
AUDIENCE_VALIDATION_AGENT_LINKEDIN_API = 'aud_validation_agent_linkedin-api'
AUDIENCE_VALIDATION_AGENT_EMAIL_API = 'aud_validation_agent_email-api'
AUDIENCE_VALIDATION_AGENT_PHONE_OWNER_API = 'aud_validation_agent_phone-owner-api'
AUDIENCE_VALIDATION_AGENT_POSTAL = 'aud_validation_agent_postal'
AUDIENCE_VALIDATION_PROGRESS = 'AUDIENCE_VALIDATION_PROGRESS'

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


def get_enrichment_users(db_session: Session, validation_type: str, aud_smart_id: UUID, column_name: str = None):
    if validation_type == "job_validation":
        enrichment_users = [
            {
                "audience_smart_person_id": user.audience_smart_person_id,
                "job_title": user.job_title,
                "company_name": user.company_name,
                "linkedin_url": user.linkedin_url,
            }
            for user in db_session.query(
                AudienceSmartPerson.id.label("audience_smart_person_id"),
                EnrichmentEmploymentHistory.job_title,
                EnrichmentEmploymentHistory.company_name,
                EnrichmentUserContact.linkedin_url,
            )
            .join(
                EnrichmentUser,
                EnrichmentUser.id == AudienceSmartPerson.enrichment_user_id,
            )
            .outerjoin(
                EnrichmentUserContact,
                EnrichmentUserContact.asid == EnrichmentUser.asid,
            )
            .outerjoin(
                EnrichmentEmploymentHistory,
                EnrichmentEmploymentHistory.asid == EnrichmentUser.asid,
            )
            .filter(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_valid == True,
            )
            .distinct(EnrichmentUserContact.asid)
            .all()
        ]
    elif validation_type == "delivery":
        enrichment_users = [
            {
                "audience_smart_person_id": user.audience_smart_person_id,
                "personal_email": user.personal_email,
                "business_email": user.business_email,
            }
            for user in db_session.query(
                AudienceSmartPerson.id.label("audience_smart_person_id"),
                EnrichmentUserContact.personal_email.label("personal_email"),
                EnrichmentUserContact.business_email.label("business_email"),
            )
            .join(
                EnrichmentUser,
                EnrichmentUser.id == AudienceSmartPerson.enrichment_user_id,
            )
            .outerjoin(
                EnrichmentUserContact,
                EnrichmentUserContact.asid == EnrichmentUser.asid,
            )
            .filter(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_valid == True,
            )
            .distinct(EnrichmentUserContact.asid)
            .all()
        ]
    elif validation_type == "confirmation" or validation_type == 'dnc_filter':
        enrichment_users = [
            {
                "audience_smart_person_id": user.audience_smart_person_id,
                "phone_mobile1": user.phone_mobile1,
                "phone_mobile2": user.phone_mobile2,
                "full_name": f"{user.first_name or ''} {user.middle_name or ''} {user.last_name or ''}".strip()
            }
            for user in db_session.query(
                AudienceSmartPerson.id.label("audience_smart_person_id"),
                EnrichmentUserContact.phone_mobile1.label("phone_mobile1"),
                EnrichmentUserContact.phone_mobile2.label("phone_mobile2"),
                EnrichmentUserContact.first_name.label("first_name"),
                EnrichmentUserContact.middle_name.label("middle_name"),
                EnrichmentUserContact.last_name.label("last_name"),
            )
            .join(
                EnrichmentUser,
                EnrichmentUser.id == AudienceSmartPerson.enrichment_user_id,
            )
            .outerjoin(
                EnrichmentUserContact,
                EnrichmentUserContact.asid == EnrichmentUser.asid,
            )
            .filter(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_valid == True,
            )
            .distinct(EnrichmentUserContact.asid)
            .all()
        ]
    elif validation_type == "cas_home_address" or validation_type == "cas_office_address":
        enrichment_users = [
            {
                "audience_smart_person_id": user.audience_smart_person_id,
                "zip_code5": user.zip_code5,
                "city": user.city,
                "state_name": user.state_name
            }
            for user in db_session.query(
                AudienceSmartPerson.id.label("audience_smart_person_id"),
                EnrichmentPersonalProfiles.zip_code5.label("zip_code5"),
                UsaZipCode.city.label("city"),
                UsaZipCode.state_name.label("state_name"),
            )
            .join(
                EnrichmentUser,
                EnrichmentUser.id == AudienceSmartPerson.enrichment_user_id,
            )
            .outerjoin(
                EnrichmentPersonalProfiles,
                EnrichmentPersonalProfiles.asid == EnrichmentUser.asid,
            )
            .outerjoin(
                UsaZipCode,
                UsaZipCode.zip == EnrichmentPersonalProfiles.zip_code5,
            )
            .filter(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_valid == True,
            )
            .all()
        ]
    else:
        enrichment_users = [
            {
                "audience_smart_person_id": user.audience_smart_person_id,
                column_name: (
                    user.value.isoformat() if isinstance(user.value, datetime) else user.value
                ),
            }
            for user in db_session.query(
                AudienceSmartPerson.id.label("audience_smart_person_id"),
                getattr(EnrichmentUserContact, column_name).label("value"),
            )
            .join(
                EnrichmentUser,
                EnrichmentUser.id == AudienceSmartPerson.enrichment_user_id,
            )
            .outerjoin(
                EnrichmentUserContact,
                EnrichmentUserContact.asid == EnrichmentUser.asid,
            )
            .filter(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_valid == True,
            )
            .distinct(EnrichmentUserContact.asid)
            .all()
        ]
    
    return enrichment_users

def validation_processed(db_session: Session, ids: List[int]):
    stmt = (
        update(AudienceSmartPerson)
        .where(AudienceSmartPerson.id.in_(ids))
        .values(is_validation_processed=True)
    )
    db_session.execute(stmt)
    db_session.commit()

async def complete_validation(db_session: Session, aud_smart_id: int, connection: RabbitMQConnection, user_id: int):
    total_validated = db_session.query(func.count(AudienceSmartPerson.id)).filter(
                    AudienceSmartPerson.smart_audience_id == aud_smart_id,
                    AudienceSmartPerson.is_valid == True,
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
    logging.info(f"completed validation, status audience smart ready")


async def aud_email_validation(message: IncomingMessage, db_session: Session, connection: RabbitMQConnection):
    try:
        message_body = json.loads(message.body)
        user_id = message_body.get("user_id")
        aud_smart_id = message_body.get("aud_smart_id")
        validation_params = message_body.get("validation_params")
        recency_personal_days = 0
        recency_business_days = 0
        
        logging.info(f"Processed email validation for aud_smart_id {aud_smart_id}.")    

        try:
            priority_record = (
                db_session.query(AudienceSetting.value)
                .filter(AudienceSetting.alias == AudienceSettingAlias.VALIDATION_PRIORITY.value)
                .first()
            )

            priority_values = priority_record.value.split(",")
            column_mapping = {
                'personal_email-mx': 'personal_email_validation_status',
                'personal_email-recency': 'personal_email_last_seen',
                'personal_email-delivery': 'personal_email',
                'business_email-mx': 'business_email_validation_status',
                'business_email-recency': 'business_email_last_seen_date',
                'business_email-delivery': 'business_email',
                'phone-dnc_filter': 'mobile_phone_dnc',
                'linked_in-job_validation': 'job_validation',
                'phone-confirmation': 'confirmation',
                'postal_cas_verification-cas_home_address': 'cas_home_address',
                'postal_cas_verification-cas_office_address': 'cas_office_address',
            }

            logging.info(f"validation_params {validation_params}")
            for value in priority_values:
                validation, validation_type = value.split('-')
                logging.info(f"validation - {validation} ; validation_type - {validation_type}")
                if validation in validation_params:
                    validation_params_list = validation_params.get(validation)
                    if validation_params_list and len(validation_params_list) > 0:
                        for param in validation_params_list:
                            if validation_type in param:
                                column_name = column_mapping.get(value)
                                for key, inner_dict in param.items():
                                    processed = inner_dict.get("processed")
                                    
                                if processed is True:
                                    break
                                
                                
                                logging.info(f"column_name {column_name}")
                                
                                if not column_name:
                                    continue

                                if validation_type == "recency":
                                    for param in validation_params_list:
                                        if "recency" in param and validation == "personal_email":
                                            recency_personal_days = param["recency"].get("days")
                                            break
                                        if "recency" in param and validation == "business_email":
                                            recency_business_days = param["recency"].get("days")
                                            break
                                        
                                enrichment_users = get_enrichment_users(db_session, validation_type, aud_smart_id, column_name)

                                logging.info(f"count person which will processed validation {len(enrichment_users)}")

                                if not enrichment_users:
                                    logging.info(f"No enrichment users found for aud_smart_id {aud_smart_id}. column_name {column_name}")
                                    continue
                                
                                validation_processed(db_session, [user["audience_smart_person_id"] for user in enrichment_users])
                                for j in range(0, len(enrichment_users), 100):
                                    batch = enrichment_users[j:j+100]
                                    serialized_batch = [
                                        {
                                            **user,
                                            "audience_smart_person_id": str(user["audience_smart_person_id"]),
                                        }
                                        for user in batch
                                    ]
                                    message_body = {
                                        'aud_smart_id': str(aud_smart_id),
                                        'user_id': user_id,
                                        'batch': serialized_batch,
                                        'validation_type': column_name
                                    }
                                    queue_map = {
                                        "personal_email_validation_status": AUDIENCE_VALIDATION_AGENT_NOAPI, "personal_email_last_seen": AUDIENCE_VALIDATION_AGENT_NOAPI,
                                        "business_email_validation_status": AUDIENCE_VALIDATION_AGENT_NOAPI, "business_email_last_seen_date": AUDIENCE_VALIDATION_AGENT_NOAPI,
                                        "job_validation": AUDIENCE_VALIDATION_AGENT_LINKEDIN_API,
                                        "confirmation": AUDIENCE_VALIDATION_AGENT_PHONE_OWNER_API,
                                        "cas_home_address": AUDIENCE_VALIDATION_AGENT_POSTAL, "cas_office_address": AUDIENCE_VALIDATION_AGENT_POSTAL,
                                        "business_email": AUDIENCE_VALIDATION_AGENT_EMAIL_API, "personal_email": AUDIENCE_VALIDATION_AGENT_EMAIL_API,
                                        "mobile_phone_dnc": AUDIENCE_VALIDATION_AGENT_PHONE_OWNER_API
                                        
                                    }
                                    queue_name = queue_map[column_name]
                                    if queue_name == AUDIENCE_VALIDATION_AGENT_NOAPI:
                                            message_body["recency_business_days"] = recency_business_days
                                            message_body["recency_personal_days"] = recency_personal_days

                                    await publish_rabbitmq_message(
                                        connection=connection,
                                        queue_name=queue_name,
                                        message_body=message_body
                                        )
                                await message.ack()
                                return
                    
            await complete_validation(db_session, aud_smart_id, connection, user_id)
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
            name=AUDIENCE_VALIDATION_FILLER,
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