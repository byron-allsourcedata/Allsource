import logging
import os
import sys
import asyncio
import functools
import json
import requests
from rapidfuzz import fuzz
from aio_pika import IncomingMessage
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import insert
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.audience_smarts import AudienceSmart
from models.audience_smarts_persons import AudienceSmartPerson
from models.audience_phones_verification import AudiencePhoneVerification
from models.audience_smarts_validations import AudienceSmartValidation
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_VALIDATION_AGENT_PHONE_OWNER_API = 'aud_validation_agent_phone-owner-api'
AUDIENCE_VALIDATION_PROGRESS = 'AUDIENCE_VALIDATION_PROGRESS'
AUDIENCE_VALIDATION_FILLER = 'aud_validation_filler'
REAL_TIME_API_KEY = os.getenv('REAL_TIME_API_KEY')
REAL_TIME_API_URL = os.getenv('REAL_TIME_API_URL')

COLUMN_MAPPING = {
    'personal_email_validation_status': 'mx',
    'business_email_validation_status': 'mx',
    'personal_email_last_seen': 'recency',
    'business_email_last_seen_date': 'recency',
    'mobile_phone_dnc': 'dnc_filter',
    'confirmation': 'confirmation'
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
        logging.info(f"aud_smart_id: {aud_smart_id}")
        logging.info(f"validation_type: {validation_type}")
        failed_ids = []
        verifications = []
        verified_phones = []

        for record in batch:
            person_id = record.get("audience_smart_person_id")
            full_name = record.get("full_name")

            for phone_field in ['phone_mobile1', 'phone_mobile2']:
                if phone_field == 'phone_mobile1' and record.get('phone_mobile1') == record.get('phone_mobile2') and not record.get('phone_mobile1'):
                    continue

                phone_number = record.get(phone_field)
                
                is_verify = False

                if not phone_number and phone_field == 'phone_mobile2':
                    failed_ids.append(person_id)
                
                if not phone_number:
                    continue

                existing_verification = db_session.query(AudiencePhoneVerification).filter_by(phone=phone_number).first()

                if not existing_verification:
                    
                    is_verify = next(
                        (verification.is_verify for verification in verifications if verification.phone == phone_number),
                        False
                    )

                    if not is_verify:
                        response = requests.get(
                            REAL_TIME_API_URL,
                            params={
                                "output": "json",
                                "phone": phone_number,
                                "token": REAL_TIME_API_KEY
                            }
                        )
                        response_data = response.json()

                        logging.info(f"response: {response.status_code} {response_data}")

                        if response.status_code != 200:
                            continue

                        if response.status_code != 200 and phone_field == 'phone_mobile2':
                            await message.ack()


                        caller_name = response_data.get("caller_name", "").title()
                        similarity = fuzz.ratio(full_name, caller_name)
                        is_verify = similarity > 70 and caller_name != 'Unavailable'

                        logging.info(f"similarity: {full_name} - {caller_name} = {similarity}")


                        verifications.append(
                            AudiencePhoneVerification(
                                phone=phone_number,
                                status=response_data.get("status", ""),
                                is_verify=is_verify
                            )
                        )

                else:
                    logging.info("There is such a Phone in our database")
                    is_verify = existing_verification.is_verify


                if not is_verify and phone_field == 'phone_mobile2':
                    failed_ids.append(person_id)
                elif is_verify:
                    verified_phones.append(
                        AudienceSmartValidation(
                            audience_smart_person_id=person_id,
                            verified_phone=phone_number
                        )
                    )
                    break
                else:
                    continue

        if len(verifications):
            verification_data = [
                {
                    "phone": v.phone,
                    "status": v.status,
                    "is_verify": v.is_verify
                }
                for v in verifications
            ]

            insert_stmt = insert(AudiencePhoneVerification).values(verification_data).on_conflict_do_nothing(
                index_elements=["phone"]
            )

            db_session.execute(insert_stmt)
            db_session.commit()
        
        if len(verified_phones):
            db_session.bulk_save_objects(verified_phones)
            db_session.commit()

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
            name=AUDIENCE_VALIDATION_AGENT_PHONE_OWNER_API,
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