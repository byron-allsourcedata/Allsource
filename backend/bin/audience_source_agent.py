import logging
import os
import sys
import asyncio
import functools
import json
import time
from collections import defaultdict
from datetime import datetime, timezone

import boto3
from sqlalchemy import update
from aio_pika import IncomingMessage, Message
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from models.audience_sources import AudienceSource
from models.five_x_five_users import FiveXFiveUser
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_SOURCES_MATCHING= 'aud_sources_matching'
SOURCE_PROCESSING_PROGRESS = "SOURCE_PROCESSING_PROGRESS"

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

def create_sts_client(key_id, key_secret):
    return boto3.client(
        'sts',
        aws_access_key_id=key_id,
        aws_secret_access_key=key_secret,
        region_name='us-east-2'
    )

def assume_role(role_arn, sts_client):
    credentials = sts_client.assume_role(
        RoleArn=role_arn,
        RoleSessionName="create-use-assume-role-scenario"
    )['Credentials']
    logging.info(f"Assumed role '{role_arn}', got temporary credentials.")
    return credentials

async def send_sse(connection, user_id: int, data: dict):
    try:
        print(f"userd_id = {user_id}")
        logging.info(f"send client throught SSE: {data, user_id}")
        await publish_rabbitmq_message(
                    connection=connection,
                    queue_name=f'sse_events_{str(user_id)}',
                    message_body={
                        "status": SOURCE_PROCESSING_PROGRESS,
                        "data": data
                    }
                )
    except Exception as e:
        logging.error(f"Error sending SSE: {e}")


async def aud_sources_matching(message: IncomingMessage, db_session: Session, connection):
    start_time = time.perf_counter()

    try:
        message_body = json.loads(message.body)
        data = message_body.get('data')
        source_id = data.get("source_id")

        query_start = time.perf_counter()
        audience_source = db_session.query(AudienceSource).filter_by(id=source_id).first()
        query_end = time.perf_counter()
        logging.info(f"🔍 DB Query (AudienceSource): {query_end - query_start:.6f} сек.")

        if not data or not audience_source:
            logging.warning("Message data is missing.")
            await message.ack()
            return

        type = message_body.get('type')
        user_id = data.get('user_id')
        persons = data.get('persons')

        if type == 'emails':
            processing_start = time.perf_counter()

            matched_persons = defaultdict(lambda: {"orders_amount": 0.0, "orders_count": 0, "orders_date": None})

            for person in persons:
                email = person.get("email", "").strip().lower()
                sale_amount = person.get("sale_amount", 0.0)
                transaction_date = person.get("transaction_date", "").strip()

                transaction_date_obj = None
                if transaction_date:
                    try:
                        transaction_date_obj = datetime.fromisoformat(transaction_date)
                    except Exception as date_error:
                        logging.warning(f"Error date '{transaction_date}': {date_error}")

                if email in matched_persons:
                    matched_persons[email]["orders_amount"] += sale_amount
                    matched_persons[email]["orders_count"] += 1
                    if transaction_date_obj:
                        existing_date = matched_persons[email]["orders_date"]
                        if existing_date is None or transaction_date_obj > existing_date:
                            matched_persons[email]["orders_date"] = transaction_date_obj
                else:
                    matched_persons[email] = {
                        "orders_amount": sale_amount,
                        "orders_count": 1,
                        "orders_date": transaction_date_obj
                    }

            processing_end = time.perf_counter()
            logging.info(f"📊 Email processing time: {processing_end - processing_start:.6f} сек.")

        logging.info(f"Processing AudienceSourceMatching with ID: {source_id}")

        db_fetch_start = time.perf_counter()
        existing_persons = {p.email: p for p in db_session.query(AudienceSourcesMatchedPerson).filter(
            AudienceSourcesMatchedPerson.source_id == source_id,
            AudienceSourcesMatchedPerson.email.in_(matched_persons.keys())
        ).all()}
        db_fetch_end = time.perf_counter()
        logging.info(f"🔍 DB Query (Existing Persons): {db_fetch_end - db_fetch_start:.6f} сек.")

        reference_date = datetime.now()

        update_start = time.perf_counter()

        matched_persons_to_update = []
        matched_persons_to_add = []
        for email, data in matched_persons.items():
            last_transaction = data["orders_date"]
            recency = (reference_date - last_transaction).days if last_transaction else None

            if email in existing_persons:
                matched_person = existing_persons[email]
                matched_person.orders_amount += data["orders_amount"]
                matched_person.orders_count += data["orders_count"]
                if data["orders_date"]:
                    if matched_person.orders_date is None or data["orders_date"] > matched_person.orders_date:
                        matched_person.orders_date = data["orders_date"]
                        matched_person.recency = recency
                matched_persons_to_update.append({
                    "id": matched_person.id,
                    "orders_amount": matched_person.orders_amount,
                    "orders_count": matched_person.orders_count,
                    "orders_date": matched_person.orders_date,
                    "recency": recency
                })
            else:
                new_matched_person = AudienceSourcesMatchedPerson(
                    source_id=source_id,
                    email=email,
                    orders_amount=data["orders_amount"],
                    orders_count=data["orders_count"],
                    orders_date=data["orders_date"],
                    recency=recency
                )
                matched_persons_to_add.append(new_matched_person)

        if matched_persons_to_update:
            db_session.bulk_update_mappings(AudienceSourcesMatchedPerson, matched_persons_to_update)

        if matched_persons_to_add:
            db_session.bulk_save_objects(matched_persons_to_add)

        db_session.flush()

        update_end = time.perf_counter()
        logging.info(f"📝 DB Update (Matched Persons): {update_end - update_start:.6f} сек.")

        db_commit_start = time.perf_counter()
        total_records, processed_records, matched_records = db_session.execute(
            update(AudienceSource)
            .where(AudienceSource.id == source_id)
            .values(
                matched_records=AudienceSource.matched_records + len(persons),
                processed_records=AudienceSource.processed_records + len(persons)
            )
            .returning(AudienceSource.total_records, AudienceSource.processed_records, AudienceSource.matched_records)
        ).fetchone()

        db_session.flush()
        if processed_records >= total_records:
            db_session.execute(
                update(AudienceSource)
                .where(AudienceSource.id == source_id)
                .values(matched_records_status="complete")
            )
        db_session.commit()

        db_commit_end = time.perf_counter()
        logging.info(f"💾 DB Commit: {db_commit_end - db_commit_start:.6f} сек.")

        send_sse_start = time.perf_counter()
        await send_sse(connection, user_id,
                       {"source_id": source_id, "total": total_records, "processed": processed_records,
                        "matched": matched_records})
        send_sse_end = time.perf_counter()
        logging.info(f"📡 SSE Send: {send_sse_end - send_sse_start:.6f} сек.")

        logging.info(f"✅ ACK message")
        await message.ack()

    except Exception as e:
        logging.error(f"❌ Error processing matching: {e}", exc_info=True)
        await message.nack()

    end_time = time.perf_counter()
    logging.info(f"⏳ Total Execution Time: {end_time - start_time:.6f} сек.")

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
            name=AUDIENCE_SOURCES_MATCHING,
            durable=True,
        )
        await queue.consume(
                functools.partial(aud_sources_matching, connection=connection, db_session=db_session)
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