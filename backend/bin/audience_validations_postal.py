import logging
import os
import sys
import asyncio
import functools
import json
import boto3
import random
import requests
import re
from datetime import datetime
from rapidfuzz import fuzz
from sqlalchemy import update
from aio_pika import IncomingMessage, Message
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.audience_smarts import AudienceSmart
from models.audience_smarts_persons import AudienceSmartPerson
from models.audience_postals_verification import AudiencePostalVerification
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_VALIDATION_AGENT_POSTAL = 'aud_validation_agent_postal'
AUDIENCE_VALIDATION_PROGRESS = 'AUDIENCE_VALIDATION_PROGRESS'
AUDIENCE_VALIDATION_FILLER = 'aud_validation_filler'
EXPERIANAPERTURE_API_KEY = os.getenv('EXPERIANAPERTURE_API_KEY')

COLUMN_MAPPING = {
    'cas_home_address': 'cas_home_address',
    'cas_office_address': 'cas_office_address',
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

def tokenize_address(text: str) -> set[str]:
    tokens = re.findall(r'\w+', text.lower())
    filtered = {tok for tok in tokens if not re.fullmatch(r'\d{5}(?:-\d{4})?', tok)}
    return filtered

def compare_addresses(normalized_address: str, normalized_addr_text: str) -> bool:
    tokens_req = tokenize_address(normalized_address)
    tokens_text = tokenize_address(normalized_addr_text)
    return tokens_req.issubset(tokens_text)

def verify_address(addresses, address, city, state_name):
    normalized_address = re.sub(r'\s+', ' ', address.lower().strip())
    normalized_city = city.lower().strip()
    normalized_state = state_name.lower().strip()
    is_verified = False

    for addr in addresses:
        addr_text = addr.get('text', '').lower()
        normalized_addr_text = re.sub(r'\s+', ' ', addr_text.strip())
        if (compare_addresses(normalized_address, normalized_addr_text) and normalized_city in normalized_addr_text and normalized_state in normalized_addr_text):
            is_verified = True
            break

    return is_verified

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

        for record in batch:
            person_id = record.get("audience_smart_person_id")            
            postal_code =  record.get("postal_code")
            country = record.get("country")
            city = record.get("city")
            state_name = record.get("state_name")
            address = record.get("address")
            
            if not postal_code or not city or not state_name:
                failed_ids.append(person_id)
                continue
            
            existing_verification = db_session.query(AudiencePostalVerification).filter(AudiencePostalVerification.postal_code == postal_code).first()

            if not existing_verification:
                response = requests.post(
                    'https://api.experianaperture.io/address/lookup/v2',
                    json={
                        "country_iso": country or 'USA',
                        "datasets": [
                            "us-address"
                        ],
                        "key": {
                            "type": "postal_code",
                            "value": postal_code
                        }
                    },
                    headers={
                        "Auth-Token": EXPERIANAPERTURE_API_KEY,
                        "Content-Type": "application/json",
                        "Add-Addresses": "true"
                    }
                )
                response_data = response.json()
                logging.debug(f"response: {response.status_code}")

                if response.status_code == 402:
                    failed_ids.append(person_id)
                    continue

                elif response.status_code != 200 and not response_data.get("success"):
                    logging.debug(f"response: {response_data}")
                    failed_ids.append(person_id)

                addresses = response_data.get('result', {}).get('addresses', [])
                is_verified = verify_address(addresses, address, city, state_name)
                verifications.append(
                    AudiencePostalVerification(
                        postal_code=postal_code,
                        is_verified=is_verified
                    )
                )

            else: 
                logging.debug("There is such a Postal in our database")
                is_verified = existing_verification.is_verified
            

            if not is_verified:
                failed_ids.append(person_id)

        
        success_ids = [
            rec["audience_smart_person_id"]
            for rec in batch
            if rec["audience_smart_person_id"] not in failed_ids
        ]
        
        logging.info(f"success_ids len: {len(success_ids)}")
        
        if verifications:
            db_session.bulk_save_objects(verifications)
            db_session.flush()
            
        logging.info(f"failed_ids len: {len(failed_ids)}")
        
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

        queue = await channel.declare_queue(
            name=AUDIENCE_VALIDATION_AGENT_POSTAL,
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
