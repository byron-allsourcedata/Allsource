import logging
import os
import re
import sys
import asyncio
import functools
import json
from datetime import datetime, timezone
from typing import List, Optional, Dict

import chardet
import io
import csv
import boto3
import aioboto3
from aio_pika import IncomingMessage, Connection
from aiormq.abc import AbstractConnection
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from itertools import islice

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from schemas.scripts.audience_source import MessageBody, PersonRow, DataBodyFromSource
from models.five_x_five_emails import FiveXFiveEmails
from models.leads_users import LeadUser
from sqlalchemy import and_, or_, func, create_engine
from enums import SourceType, LeadStatus, TypeOfCustomer
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from models.audience_sources import AudienceSource
from models.leads_users_added_to_cart import LeadsUsersAddedToCart
from models.leads_users_ordered import LeadsUsersOrdered
from models.users import Users
from models.five_x_five_users import FiveXFiveUser
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_SOURCES_READER = 'aud_sources_files1'
AUDIENCE_SOURCES_MATCHING = 'aud_sources_matching1'
SOURCE_PROCESSING_PROGRESS = "SOURCE_PROCESSING_PROGRESS"
S3_BUCKET_NAME = "maximiz-data"
SELECTED_ROW_COUNT = 500

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


def extract_amount(amount_raw: str) -> float:
    match = re.search(r'[\d,]+(?:\.\d+)?', amount_raw)
    if match:
        return float(match.group(0).replace(',', ''))
    else:
        return 0.0

def parse_date(date_str: str) -> str | None:
    if not date_str:
        return None

    formats = [
        '%m/%d/%Y %H:%M',
        '%Y-%m-%dT%H:%M:%S%z',
        '%Y-%m-%dT%H:%M:%S',
    ]

    for fmt in formats:
        try:
            parsed_date = datetime.strptime(date_str, fmt)
            if parsed_date.tzinfo is not None:
                parsed_date = parsed_date.astimezone(timezone.utc).replace(tzinfo=None)
            return parsed_date.isoformat()
        except ValueError:
            continue

    logging.warning(f"Unknown date format: {date_str}")
    return None

async def parse_csv_file(*, data, source_id: str, db_session: Session, s3_session: Session, connection: Connection, user_id: int):
    logging.info(f"Processing AudienceSource with ID: {source_id}")

    source = db_session.query(AudienceSource).filter_by(id=source_id).first()
    if not source:
        logging.warning(f"AudienceSource with ID {source_id} not found.")
        return False

    file_url = source.file_url
    if not file_url:
        logging.warning(f"File URL is missing for AudienceSource ID {source_id}.")
        return False

    sts_client = create_sts_client(os.getenv('S3_KEY_ID'), os.getenv('S3_KEY_SECRET'))
    credentials = assume_role(os.getenv('S3_ROLE_ARN'), sts_client)
    key = extract_key_from_url(file_url)
    async with s3_session.client(
            's3',
            region_name='us-east-2',
            aws_access_key_id=credentials['AccessKeyId'],
            aws_secret_access_key=credentials['SecretAccessKey'],
            aws_session_token=credentials['SessionToken']
    ) as s3:
        try:
            s3_obj = await s3.get_object(Bucket=S3_BUCKET_NAME, Key=key)
            body = await s3_obj['Body'].read()
        except Exception as s3_error:
            db_session.rollback()
            logging.error(f"Error reading S3 object: {s3_error}")
            return False

    result = chardet.detect(body)
    encoding = result['encoding']
    batch_content = body.decode(encoding, errors='replace')
    csv_file = io.StringIO(batch_content)
    csv_reader = csv.DictReader(csv_file)
    total_rows = sum(1 for _ in csv_reader)
    csv_file.seek(0)
    next(csv_reader, None)
    processed_rows = 0

    logging.info(f"Total row in CSV file: {total_rows}")
    source.total_records = total_rows
    db_session.add(source)
    db_session.commit()
    await send_sse(connection, user_id, {"source_id": source_id, "total": total_rows, "processed": processed_rows})

    send_rows = 0
    mapped_fields: Dict[str, str] = data.get("mapped_fields", {})
    status = data.get("statuses", "").strip() or None
    while send_rows < total_rows:
        batch_rows: List[PersonRow] = []
        for row in islice(csv_reader, SELECTED_ROW_COUNT):

            extracted_data = {
                key: row.get(mapped_fields.get(key, ""), "").strip()
                for key in mapped_fields
            }

            email = extracted_data.get("Email", "")
            sale_amount_raw = extracted_data.get("Order Amount", "")

            date_field = None
            if status == TypeOfCustomer.CUSTOMER_CONVERSIONS.value:
                date_field = "Transaction Date"
            if status == TypeOfCustomer.FAILED_LEADS.value:
                date_field = "Lead Date"
            if status == TypeOfCustomer.INTEREST.value:
                date_field = "Interest Date"

            date = extracted_data.get(date_field, "") if date_field else None

            if date:
                date = parse_date(date)

            sale_amount = 0.0
            if sale_amount_raw:
                try:
                    sale_amount = extract_amount(sale_amount_raw)
                except ValueError as sale_error:
                    logging.warning(f"Error parsing amount '{sale_amount_raw}': {sale_error}")

            # logging.info(f"{date}")

            batch_rows.append(PersonRow(
                email=email,
                date=date,
                sale_amount=sale_amount,
            ))

        if batch_rows:
            message_body = MessageBody(
            type='emails',
            data=DataBodyFromSource(
                persons=batch_rows,
                source_id=str(source_id),
                user_id=user_id
            ),
            status=status
        )

            await publish_rabbitmq_message(connection=connection, queue_name=AUDIENCE_SOURCES_MATCHING, message_body=message_body)
        send_rows += SELECTED_ROW_COUNT

    db_session.commit()
    return True

def get_max_ids(db_session, domain_id, statuses):
    query = db_session.query(
        func.max(LeadUser.id),
        func.count(FiveXFiveUser.id)
    ).join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)\
    .filter(
        LeadUser.domain_id == domain_id
    )

    filters = []
    if LeadStatus.VIEWED_PRODUCT.value in statuses:
        filters.append(
            and_(
                LeadUser.behavior_type == "viewed_product",
                LeadUser.is_converted_sales == False
            )
        )
    if LeadStatus.VISITOR.value in statuses:
        filters.append(
            and_(
                LeadUser.behavior_type == "visitor",
                LeadUser.is_converted_sales == False
            )
        )
    if LeadStatus.ABANDONED_CART.value in statuses or LeadStatus.CONVERTED_SALES.value in statuses:
        query = query.outerjoin(
                    LeadsUsersAddedToCart, LeadsUsersAddedToCart.lead_user_id == LeadUser.id
                ).outerjoin(
                    LeadsUsersOrdered, LeadsUsersOrdered.lead_user_id == LeadUser.id
                )
        if LeadStatus.ABANDONED_CART.value in statuses:
            filters.append(
                or_(
                    and_(
                        LeadUser.behavior_type == "product_added_to_cart",
                        LeadUser.is_converted_sales == False
                    ),
                    and_(
                        LeadUser.behavior_type == "product_added_to_cart",
                        LeadsUsersAddedToCart.added_at > LeadsUsersOrdered.ordered_at
                    )
                )
            )
    if LeadStatus.CONVERTED_SALES.value in statuses:
        filters.append(
            or_(
                and_(
                    LeadUser.behavior_type != "product_added_to_cart",
                    LeadUser.is_converted_sales == True
                ),
                and_(
                    LeadUser.is_converted_sales == True,
                    LeadsUsersAddedToCart.added_at < LeadsUsersOrdered.ordered_at
                )
            )
        )

    if filters:
        query = query.filter(or_(*filters))

    max_id, total_count = query.one()

    return max_id, total_count

async def send_pixel_contacts(*, data, source_id, db_session, connection, user_id):
    domain_id = data.get('domain_id')
    statuses = data.get('statuses')
    logging.info(f"Processing AudienceSource with ID: {source_id}")

    source = db_session.query(AudienceSource).filter_by(id=source_id).first()
    if not source:
        logging.warning(f"AudienceSource with ID {source_id} not found.")
        return False

    max_id, total_rows = get_max_ids(db_session, domain_id, statuses)
    processed_rows = 0
    logging.info(f"Total row in pixel file: {total_rows}")
    source.total_records = total_rows
    db_session.add(source)
    db_session.commit()

    await send_sse(connection, user_id, {"source_id": source_id, "total": total_rows, "processed": processed_rows})
    if not max_id:
        return False
    current_id = -1
    while(current_id < max_id):
        query = (
            db_session.query(FiveXFiveUser.id, LeadUser.id)
            .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)
            .filter(LeadUser.domain_id == domain_id)
            .filter(LeadUser.id > current_id)
        )
        filters = []
        if LeadStatus.VIEWED_PRODUCT.value in statuses:
            filters.append(and_(
                    LeadUser.behavior_type == "viewed_product",
                    LeadUser.is_converted_sales == False
                ))
        if LeadStatus.VISITOR.value in statuses:
            filters.append(and_(
                    LeadUser.behavior_type == "visitor",
                    LeadUser.is_converted_sales == False
                ))
        if LeadStatus.ABANDONED_CART.value in statuses or LeadStatus.CONVERTED_SALES.value in statuses:
            query = query.outerjoin(
                        LeadsUsersAddedToCart, LeadsUsersAddedToCart.lead_user_id == LeadUser.id
                    ).outerjoin(
                        LeadsUsersOrdered, LeadsUsersOrdered.lead_user_id == LeadUser.id
                    )
            if LeadStatus.ABANDONED_CART.value in statuses:
                filters.append(
                    or_(
                        and_(
                            LeadUser.behavior_type == "product_added_to_cart",
                            LeadUser.is_converted_sales == False
                        ),
                        and_(
                            LeadUser.behavior_type == "product_added_to_cart",
                            LeadsUsersAddedToCart.added_at > LeadsUsersOrdered.ordered_at
                        )
                    )
                )
        if LeadStatus.CONVERTED_SALES.value in statuses:
            filters.append(
                or_(
                    and_(
                        LeadUser.behavior_type != "product_added_to_cart",
                        LeadUser.is_converted_sales == True
                    ),
                    and_(
                        LeadUser.is_converted_sales == True,
                        LeadsUsersAddedToCart.added_at < LeadsUsersOrdered.ordered_at
                    )
                )
            )

        if filters:
            query = query.filter(or_(*filters))

        query = query.order_by(LeadUser.id.asc()).limit(SELECTED_ROW_COUNT)
        results = query.all()
        persons: List[PersonRow] = []
        for result in results:
            user_id, current_id = result

            if current_id <= max_id:
                persons.append(PersonRow(user_id=user_id))

        message_body = MessageBody(
            type="user_ids",
            data=DataBodyFromSource(
                persons=persons,
                source_id=str(source_id),
                user_id=user_id
            )
        )

        await publish_rabbitmq_message(connection=connection, queue_name=AUDIENCE_SOURCES_MATCHING, message_body=message_body)

    return True

async def aud_sources_reader(message: IncomingMessage, db_session: Session, s3_session, connection):
    try:
        message_body = json.loads(message.body)
        type = message_body.get('type')
        data = message_body.get('data')
        if not data:
            logging.warning("Message data is missing.")
            await message.ack()
            return
        user_id = data.get('user_id')
        source_id = str(data.get('source_id'))
        if type == SourceType.CSV.value:
            await parse_csv_file(data=data, source_id=source_id, db_session=db_session, s3_session=s3_session, connection=connection, user_id=user_id)

        if type == SourceType.PIXEL.value:
            await send_pixel_contacts(data=data, source_id=source_id, db_session=db_session, connection=connection, user_id=user_id)

        await message.ack()

    except BaseException as e:
        db_session.rollback()
        logging.error(f"Error processing message: {e}", exc_info=True)
        await message.ack()

def extract_key_from_url(s3_url: str):
    parsed_url = s3_url.split("amazonaws.com/", 1)
    if len(parsed_url) != 2:
        raise ValueError(f"Invalid S3 URL format: {s3_url}")
    return parsed_url[1].split("?", 1)[0]


async def send_sse(connection: Connection, user_id: int, data: dict):
    try:
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
        rmq_connection = RabbitMQConnection()
        connection = await rmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        engine = create_engine(
            f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}", pool_pre_ping=True
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()
        s3_session = aioboto3.Session()

        reader_queue = await channel.declare_queue(
            name=AUDIENCE_SOURCES_READER,
            durable=True,
        )
        await reader_queue.consume(functools.partial(aud_sources_reader, db_session=db_session, s3_session=s3_session, connection=connection))

        await asyncio.Future()

    except Exception:
        db_session.rollback()
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