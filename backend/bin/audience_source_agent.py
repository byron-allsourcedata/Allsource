import logging
import os
import sys
import asyncio
import functools
import json
import time
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Dict, Union, Optional

import boto3
from aiormq.abc import AbstractConnection
from sqlalchemy import update, func
from aio_pika import IncomingMessage, Message, Connection
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from enums import TypeOfCustomer
from schemas.scripts.audience_source import PersonEntry, MessageBody, DataBodyNormalize, PersonRow, DataForNormalize, DataBodyFromSource
from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from models.audience_sources import AudienceSource
from models.five_x_five_users import FiveXFiveUser
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_SOURCES_MATCHING = 'aud_sources_matching'
SOURCE_PROCESSING_PROGRESS = "SOURCE_PROCESSING_PROGRESS"
BATCH_SIZE = 500
DATE_LIMIT = 180


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


async def process_email_leads(
    persons: List[PersonRow], db_session: Session, source_id: str, include_amount: bool = False
) -> int:
    days_ago = datetime.now() - timedelta(days=DATE_LIMIT)

    matched_persons = defaultdict(lambda: {
        "orders_amount": 0.0 if include_amount else None,
        "orders_count": 0,
        "orders_date": None,
        "five_x_five_user_id": None
    })

    logging.info(f"Start processing {len(persons)} persons for source_id {source_id}")

    emails = {p.email.strip().lower() for p in persons if p.email}
    if not emails:
        logging.info("No valid emails found in input data.")
        return 0

    email_records = db_session.query(FiveXFiveEmails).filter(FiveXFiveEmails.email.in_(emails)).all()
    if not email_records:
        logging.info("No matching emails found in FiveXFiveEmails table.")
        return 0

    email_to_id = {record.email: record.id for record in email_records}

    email_ids = list(email_to_id.values())
    user_records = db_session.query(FiveXFiveUsersEmails.email_id, FiveXFiveUsersEmails.user_id).filter(
        FiveXFiveUsersEmails.email_id.in_(email_ids)
    ).all()

    email_id_to_user_id = {record.email_id: record.user_id for record in user_records}

    email_to_user_id = {email: email_id_to_user_id[email_id] for email, email_id in email_to_id.items() if
                        email_id in email_id_to_user_id}

    filtered_persons = [p for p in persons if p.email.strip().lower() in email_to_user_id]
    if not filtered_persons:
        logging.info("No valid persons left after filtering by existing emails.")
        return 0

    for person in filtered_persons:
        email = (person.email or "").strip().lower()
        transaction_date = (person.date or "").strip()

        transaction_date_obj = None
        if transaction_date:
            try:
                transaction_date_obj = datetime.fromisoformat(transaction_date)
            except Exception as date_error:
                logging.warning(f"Error parsing date '{transaction_date}': {date_error}")

        # if transaction_date_obj and transaction_date_obj < days_ago:
        #     continue

        sale_amount = Decimal(person.sale_amount) if include_amount and person.sale_amount is not None else Decimal(
            "0.0")

        if email in matched_persons:
            matched_persons[email]["orders_count"] += 1
            if include_amount:
                matched_persons[email]["orders_amount"] += sale_amount
            if transaction_date_obj:
                existing_date = matched_persons[email]["orders_date"]
                if existing_date is None or transaction_date_obj > existing_date:
                    matched_persons[email]["orders_date"] = transaction_date_obj
                    logging.debug(f"Updated orders_date for {email}: {transaction_date_obj}")
        else:
            matched_persons[email] = {
                "orders_count": 1,
                "orders_date": transaction_date_obj,
                "five_x_five_user_id": email_to_user_id[email]
            }
            if include_amount:
                matched_persons[email]["orders_amount"] = sale_amount
            logging.debug(
                f"Added new person {email} with sale amount {sale_amount} and transaction date {transaction_date_obj}")

    existing_persons = {p.email: p for p in db_session.query(AudienceSourcesMatchedPerson).filter(
        AudienceSourcesMatchedPerson.source_id == source_id,
        AudienceSourcesMatchedPerson.email.in_(matched_persons.keys())
    ).all()}

    logging.info(f"Found {len(existing_persons)} existing persons to update for source_id {source_id}")

    reference_date = datetime.now()

    matched_persons_to_update = []
    matched_persons_to_add = []
    for email, data in matched_persons.items():
        last_transaction = data["orders_date"]
        recency = (reference_date - last_transaction).days if last_transaction else None

        if email in existing_persons:
            matched_person = existing_persons[email]
            matched_person.orders_count += data["orders_count"]
            if include_amount:
                matched_person.orders_amount += data["orders_amount"]

            if data["orders_date"]:
                if matched_person.orders_date is None or data["orders_date"] > matched_person.orders_date:
                    matched_person.orders_date = data["orders_date"]
                    matched_person.recency = recency
                    logging.debug(f"Updated matched person {email}: orders_count={matched_person.orders_count}")

            matched_persons_to_update.append({
                "id": matched_person.id,
                "orders_amount": matched_person.orders_amount if include_amount else 0.0,
                "orders_count": matched_person.orders_count,
                "orders_date": matched_person.orders_date,
                "recency": recency
            })
        else:
            new_matched_person = AudienceSourcesMatchedPerson(
                source_id=source_id,
                email=email,
                orders_count=data["orders_count"],
                orders_date=data["orders_date"],
                recency=recency,
                five_x_five_user_id=data["five_x_five_user_id"]
            )
            if include_amount:
                new_matched_person.orders_amount = data["orders_amount"]

            matched_persons_to_add.append(new_matched_person)
            logging.debug(f"Added new matched person {email}: orders_count={data['orders_count']}")

    if matched_persons_to_update:
        logging.info(f"Updating {len(matched_persons_to_update)} persons in the database")
        db_session.bulk_update_mappings(AudienceSourcesMatchedPerson, matched_persons_to_update)

    if matched_persons_to_add:
        logging.info(f"Adding {len(matched_persons_to_add)} new persons to the database")
        db_session.bulk_save_objects(matched_persons_to_add)

    processed_count = len(filtered_persons)
    logging.info(f"Processed {processed_count} persons for source_id {source_id}")
    return processed_count

async def process_email_customer_conversion(persons: List[PersonRow], db_session: Session, source_id: str) -> int:
    return await process_email_leads(persons, db_session, source_id, include_amount=True)

async def process_email_failed_leads(persons: List[PersonRow], db_session: Session, source_id: str) -> int:
    return await process_email_leads(persons, db_session, source_id, include_amount=False)

async def process_user_id(persons: List[PersonRow], db_session: Session, source_id: str) -> int:
    five_x_five_user_ids = [p.user_id for p in persons]
    logging.info(f"user_ids find {len(five_x_five_user_ids)} for source_id {source_id}")

    for five_x_five_user_id in five_x_five_user_ids:
        matched_person = AudienceSourcesMatchedPerson(
            source_id=source_id,
            five_x_five_user_id=five_x_five_user_id
        )
        db_session.add(matched_person)

    return len(five_x_five_user_ids)


async def process_and_send_chunks(db_session: Session, source_id: str, batch_size: int, queue_name: str,
                                  connection, status: str):
    result = db_session.query(
        func.min(AudienceSourcesMatchedPerson.orders_amount).label('min_orders_amount'),
        func.max(AudienceSourcesMatchedPerson.orders_amount).label('max_orders_amount'),
        func.min(AudienceSourcesMatchedPerson.orders_count).label('min_orders_count'),
        func.max(AudienceSourcesMatchedPerson.orders_count).label('max_orders_count'),
        func.min(AudienceSourcesMatchedPerson.recency).label('min_recency'),
        func.max(AudienceSourcesMatchedPerson.recency).label('max_recency'),
        func.min(AudienceSourcesMatchedPerson.orders_date).label('min_orders_date'),
        func.max(AudienceSourcesMatchedPerson.orders_date).label('max_orders_date'),
        func.count().label('total_count')
    ).filter_by(source_id=source_id).first()

    min_orders_amount = float(result.min_orders_amount) if result.min_orders_amount is not None else 0.0
    max_orders_amount = float(result.max_orders_amount) if result.max_orders_amount is not None else 1.0
    min_orders_count = int(result.min_orders_count or 0)
    max_orders_count = int(result.max_orders_count or 1)
    min_recency = float(result.min_recency) if result.min_recency is not None else 0.0
    max_recency = float(result.max_recency) if result.max_recency is not None else 1.0

    if status == TypeOfCustomer.FAILED_LEADS.value:
        min_recency = 1.0 / (min_recency + 1.0)
        max_recency = 1.0 / (max_recency + 1.0)
        if min_recency > max_recency:
            min_recency, max_recency = max_recency, min_recency

    min_orders_date = result.min_orders_date
    max_orders_date = result.max_orders_date
    total_count = int(result.total_count or 0)

    logging.info(f"Processing {result}")

    for offset in range(0, total_count, batch_size):
        matched_persons_list = db_session.query(AudienceSourcesMatchedPerson) \
            .filter_by(source_id=source_id) \
            .offset(offset) \
            .limit(batch_size) \
            .all()

        if not matched_persons_list:
            logging.warning(f"No more matched persons found for source_id {source_id} at offset {offset}")
            break

        logging.info(f"Processing {len(matched_persons_list)} matched persons for source_id {source_id}")

        batch_rows: List[PersonEntry] = [
            PersonEntry(
                id=str(p.id),
                email=str(p.email),
                orders_amount=float(p.orders_amount) if p.orders_amount is not None else 0.0,
                orders_count=int(p.orders_count),
                recency=float(p.recency) if p.recency is not None else 0.0
            )
            for p in matched_persons_list
        ]

        message_body = MessageBody(
            type="emails",
            data=DataBodyNormalize(
                persons=batch_rows,
                source_id=source_id,
                data_for_normalize=DataForNormalize(
                    matched_size=offset + len(batch_rows),
                    all_size=total_count,
                    min_orders_amount=min_orders_amount,
                    max_orders_amount=max_orders_amount,
                    min_orders_count=min_orders_count,
                    max_orders_count=max_orders_count,
                    min_orders_date=min_orders_date.isoformat() if min_orders_date else None,
                    max_orders_date=max_orders_date.isoformat() if max_orders_date else None,
                    min_recency=min_recency,
                    max_recency=max_recency,
                ),
            ),
            status=status
        )

        await publish_rabbitmq_message(connection=connection, queue_name=queue_name, message_body=message_body)
        logging.info(f"RMQ message sent for batch starting at offset {offset} of size {total_count}")

    logging.info(f"All chunks processed and messages sent for source_id {source_id}")

async def normalize_persons_customer_conversion(
    persons: List[PersonEntry], source_id: str, data_for_normalize: DataForNormalize, db_session: Session
):
    logging.info(f"Processing normalization data for source_id {source_id}")

    min_orders_amount = float(data_for_normalize.min_orders_amount) if data_for_normalize.min_orders_amount is not None else 0.0
    max_orders_amount = float(data_for_normalize.max_orders_amount) if data_for_normalize.max_orders_amount is not None else 1.0
    min_orders_count = float(data_for_normalize.min_orders_count)
    max_orders_count = float(data_for_normalize.max_orders_count)
    min_recency = float(data_for_normalize.min_recency) if data_for_normalize.min_recency is not None else 0.0
    max_recency = float(data_for_normalize.max_recency) if data_for_normalize.max_recency is not None else 1.0

    def normalize(value: float, min_val: float, max_val: float) -> float:
        return (value - min_val) / (max_val - min_val) if max_val > min_val else 0.0

    w1, w2, w3 = 1.0, 1.0, 1.0

    updates = []

    for person in persons:
        orders_amount = float(person.orders_amount) if person.orders_amount is not None else 0.0
        orders_count = float(person.orders_count)
        recency = float(person.recency) if person.recency is not None else 0.0

        recency_normalized = normalize(recency, min_recency, max_recency)
        orders_count_normalized = normalize(orders_count, min_orders_count, max_orders_count)
        orders_amount_normalized = normalize(orders_amount, min_orders_amount, max_orders_amount)

        value_score = (
                w1 * orders_amount_normalized
                + w2 * orders_count_normalized
                - w3 * recency_normalized
                + 1
        )

        updates.append({
            'id': person.id,
            'source_id': source_id,
            'email': person.email,
            'recency_normalized': recency_normalized,
            'orders_amount_normalized': orders_amount_normalized,
            'orders_count_normalized': orders_count_normalized,
            'value_score': value_score
        })

    if updates:
        db_session.bulk_update_mappings(AudienceSourcesMatchedPerson, updates)
        logging.info(f"Updated {len(updates)} persons.")

    db_session.commit()

    logging.info(
        f"RMQ message sent for matched records {data_for_normalize.matched_size} matched persons "
        f"from {data_for_normalize.all_size} matched records."
    )

async def normalize_persons_failed_leads(
    persons: List[PersonEntry], source_id: str, data_for_normalize: DataForNormalize, db_session: Session
):
    logging.info(f"Processing normalization data for source_id {source_id}")

    inverted_min_recency = float(data_for_normalize.min_recency) if data_for_normalize.min_recency is not None else 0.0
    inverted_max_recency = float(data_for_normalize.max_recency) if data_for_normalize.max_recency is not None else 1.0

    logging.info(f"Inverted recency bounds: {inverted_min_recency} {inverted_max_recency}")

    def normalize(value: float, min_val: float, max_val: float) -> float:
        return (value - min_val) / (max_val - min_val) if max_val > min_val else 0.0

    updates = []

    for person in persons:
        current_recency = float(person.recency) if person.recency is not None else 0.0
        inverted_recency = 1.0 / (current_recency + 1.0)
        value_score = normalize(inverted_recency, inverted_min_recency, inverted_max_recency)

        updates.append({
            'id': person.id,
            'source_id': source_id,
            'email': person.email,
            'value_score': value_score,
            'inverted_recency': inverted_recency,
            'recency_failed': value_score,
        })

    if updates:
        db_session.bulk_update_mappings(AudienceSourcesMatchedPerson, updates)
        logging.info(f"Updated {len(updates)} persons.")

    db_session.commit()

    logging.info(
        f"RMQ message sent for matched records {data_for_normalize.matched_size} matched persons "
        f"from {data_for_normalize.all_size} matched records."
    )

async def aud_sources_matching(message: IncomingMessage, db_session: Session, connection: Connection):
    try:
        message_body_dict = json.loads(message.body)
        message_body = MessageBody(**message_body_dict)
        data: Union[DataBodyNormalize, DataBodyFromSource] = message_body.data
        source_id: str = data.source_id
        audience_source = db_session.query(AudienceSource).filter_by(id=source_id).first()

        if not data or not audience_source:
            logging.warning("Message data is missing or audience source not found.")
            await message.ack()
            return

        type: str = message_body.type
        persons: Union[List[PersonRow], List[PersonEntry]] = data.persons
        data_for_normalize: Optional[DataForNormalize] = (
            data.data_for_normalize if isinstance(data, DataBodyNormalize) else None
        )

        if type == 'emails' and data_for_normalize:
            if message_body.status == TypeOfCustomer.CUSTOMER_CONVERSIONS.value:
                await normalize_persons_customer_conversion(persons=persons, source_id=source_id, data_for_normalize=data_for_normalize,
                                                            db_session=db_session)

            if message_body.status == TypeOfCustomer.FAILED_LEADS.value:
                await normalize_persons_failed_leads(persons=persons, source_id=source_id, data_for_normalize=data_for_normalize,
                                                            db_session=db_session)

            await message.ack()
            return

        count = 0

        user_id = data.user_id

        if type == 'user_ids':
            logging.info(f"Processing {len(persons)} user_id records.")
            count = await process_user_id(persons=persons, db_session=db_session, source_id=source_id)

        if type == 'emails':
            if message_body.status == TypeOfCustomer.CUSTOMER_CONVERSIONS.value:
                logging.info(f"Processing {len(persons)} customer conversions.")
                count = await process_email_customer_conversion(persons=persons, db_session=db_session, source_id=source_id)

            if message_body.status == TypeOfCustomer.FAILED_LEADS.value:
                logging.info(f"Processing {len(persons)} failed lead records.")
                count = await process_email_failed_leads(persons=persons, db_session=db_session, source_id=source_id)

        logging.info(f"Updated processed and matched records for source_id {count}.")

        total_records, processed_records, matched_records = db_session.execute(
            update(AudienceSource)
            .where(AudienceSource.id == source_id)
            .values(
                matched_records=AudienceSource.matched_records + count,
                processed_records=AudienceSource.processed_records + len(persons)
            )
            .returning(AudienceSource.total_records, AudienceSource.processed_records, AudienceSource.matched_records)
        ).fetchone()

        db_session.flush()
        logging.info(f"Updated processed and matched records for source_id {source_id}.")

        if processed_records >= total_records:
            db_session.execute(
                update(AudienceSource)
                .where(AudienceSource.id == source_id)
                .values(matched_records_status="complete")
            )
            logging.info(f"Source_id {source_id} processing complete.")

        db_session.commit()

        if type == 'emails' and processed_records >= total_records:
            await process_and_send_chunks(db_session=db_session, source_id=source_id,
                                          batch_size=BATCH_SIZE, queue_name=AUDIENCE_SOURCES_MATCHING,
                                          connection=connection, status=message_body.status)

        await send_sse(connection, user_id,
                       {"source_id": source_id, "total": total_records, "processed": processed_records,
                        "matched": matched_records})

        await message.ack()
        logging.info(f"Processing completed for source_id {source_id}.")

    except BaseException as e:
        logging.warning(f"Message for source_id failed and will be reprocessed. {e}")
        db_session.rollback()
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
