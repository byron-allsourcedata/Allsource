import logging
import os
import sys
import asyncio
import functools
import json
import chardet
import io
import csv
import boto3
import aioboto3
from aio_pika import IncomingMessage, Message, Channel
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from itertools import islice

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.five_x_five_emails import FiveXFiveEmails
from models.leads_users import LeadUser
from sqlalchemy import and_, or_, func, create_engine
from enums import SourceType, LeadStatus
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from models.audience_sources import AudienceSource
from models.leads_users_added_to_cart import LeadsUsersAddedToCart
from models.leads_users_ordered import LeadsUsersOrdered
from models.users import Users
from models.five_x_five_users import FiveXFiveUser
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_SOURCES_READER = 'aud_sources_files'
AUDIENCE_SOURCES_MATCHING = 'aud_sources_matching'
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

async def parse_csv_file(*, data, source_id, db_session, s3_session, connection, user_id):
    email_field = data.get('email') 
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
    email_field = email_field.strip().replace('"', '')
    total_rows = sum(1 for _ in csv_reader)
    csv_file.seek(0)
    processed_rows = 0

    logging.info(f"Total row in CSV file: {total_rows}")
    source.total_records = total_rows
    db_session.add(source)
    db_session.commit()
    await send_sse(connection, user_id, {"source_id": source_id, "total": total_rows, "processed": processed_rows})

    send_rows = 0
    while send_rows < total_rows:
        batch_rows = []
        for row in islice(csv_reader, SELECTED_ROW_COUNT):
            email = row.get(email_field, "")
            batch_rows.append(email)

        persons = [{"email": email} for email in batch_rows]
        if persons:
            message_body = {
                "type": 'emails',
                "data": {
                    "persons": persons,
                    "source_id": source_id,
                    "user_id": user_id
                },
            }

            await publish_rabbitmq_message(connection=connection, queue_name=AUDIENCE_SOURCES_MATCHING, message_body=message_body)
        send_rows += SELECTED_ROW_COUNT
    
    db_session.commit()
    return True

def get_min_max_ids(db_session, domain_id, statuses):
    query = db_session.query(
        func.min(FiveXFiveUser.id), 
        func.max(FiveXFiveUser.id),
        func.count(FiveXFiveUser.id)
    ).join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id).filter(
        LeadUser.domain_id == domain_id
    )

    filters = []
    
    if LeadStatus.VIEW_PRODUCT.value in statuses and LeadStatus.CONVERTED_SALES.value in statuses:
        or_(
                LeadUser.behavior_type == "viewed_product",
                LeadUser.is_converted_sales == True
            )
        
    if LeadStatus.VIEW_PRODUCT.value in statuses and LeadStatus.CONVERTED_SALES.value not in statuses:
        and_(
                LeadUser.behavior_type == "viewed_product",
                LeadUser.is_converted_sales == False
            )
    
    if LeadStatus.VISITOR.value in statuses and LeadStatus.CONVERTED_SALES.value in statuses:
        or_(
                LeadUser.behavior_type == "visitor",
                LeadUser.is_converted_sales == True
            )
        
    if LeadStatus.VISITOR.value in statuses and LeadStatus.CONVERTED_SALES.value not in statuses:
        and_(
                LeadUser.behavior_type == "visitor",
                LeadUser.is_converted_sales == False
            )
                
    if LeadStatus.CONVERTED_SALES.value in statuses and LeadStatus.ABANDONED_CART.value in statuses:
        query = query.outerjoin(
                LeadsUsersAddedToCart, LeadsUsersAddedToCart.lead_user_id == LeadUser.id
            ).outerjoin(
                LeadsUsersOrdered, LeadsUsersOrdered.lead_user_id == LeadUser.id
            )
        filters.append(
            or_(
                and_(
                    LeadUser.behavior_type == "product_added_to_cart",
                    LeadUser.is_converted_sales == True
                ),
                    LeadsUsersAddedToCart.added_at < LeadsUsersOrdered.ordered_at
                
            )
        )
    elif LeadStatus.CONVERTED_SALES.value not in statuses and LeadStatus.ABANDONED_CART.value in statuses:
        filters.append(
        or_(
            and_(
                LeadUser.behavior_type == "product_added_to_cart",
                LeadUser.is_converted_sales == False
            ),
            LeadsUsersAddedToCart.added_at > LeadsUsersOrdered.ordered_at
        )
    )
    elif LeadStatus.CONVERTED_SALES.value in statuses and LeadStatus.ABANDONED_CART.value not in statuses:
        filters.append(LeadUser.is_converted_sales == True)
            
    if filters:
        query = query.filter(or_(*filters))

    min_id, max_id, total_count = query.one()

    return min_id, max_id, total_count

async def send_pixel_contacts(*, data, source_id, db_session, connection, user_id):
    domain_id = data.get('domain_id')
    statuses = data.get('statuses')
    logging.info(f"Processing AudienceSource with ID: {source_id}")

    source = db_session.query(AudienceSource).filter_by(id=source_id).first()
    if not source:
        logging.warning(f"AudienceSource with ID {source_id} not found.")
        return False
    
    min_id, max_id, total_rows = get_min_max_ids(db_session, domain_id, statuses)
    processed_rows = 0
    logging.info(f"Total row in CSV file: {total_rows}")
    source.total_records = total_rows
    db_session.add(source)
    db_session.commit()
    
    await send_sse(connection, user_id, {"source_id": source_id, "total": total_rows, "processed": processed_rows})
    
    for start_id in range(min_id, max_id + 1, SELECTED_ROW_COUNT):
        end_id = min(start_id + SELECTED_ROW_COUNT - 1, max_id)
        query = (
            db_session.query(FiveXFiveUser.id)
            .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)
            .filter(LeadUser.domain_id == domain_id)
            .filter(FiveXFiveUser.id >= start_id, FiveXFiveUser.id <= end_id)
        )
        filters = []
    
    if LeadStatus.VIEW_PRODUCT.value in statuses and LeadStatus.CONVERTED_SALES.value in statuses:
        or_(
                LeadUser.behavior_type == "viewed_product",
                LeadUser.is_converted_sales == True
            )
        
    if LeadStatus.VIEW_PRODUCT.value in statuses and LeadStatus.CONVERTED_SALES.value not in statuses:
        and_(
                LeadUser.behavior_type == "viewed_product",
                LeadUser.is_converted_sales == False
            )
    
    if LeadStatus.VISITOR.value in statuses and LeadStatus.CONVERTED_SALES.value in statuses:
        or_(
                LeadUser.behavior_type == "visitor",
                LeadUser.is_converted_sales == True
            )
        
    if LeadStatus.VISITOR.value in statuses and LeadStatus.CONVERTED_SALES.value not in statuses:
        and_(
                LeadUser.behavior_type == "visitor",
                LeadUser.is_converted_sales == False
            )
                
    if LeadStatus.CONVERTED_SALES.value in statuses and LeadStatus.ABANDONED_CART.value in statuses:
        query = query.outerjoin(
                LeadsUsersAddedToCart, LeadsUsersAddedToCart.lead_user_id == LeadUser.id
            ).outerjoin(
                LeadsUsersOrdered, LeadsUsersOrdered.lead_user_id == LeadUser.id
            )
        filters.append(
            or_(
                and_(
                    LeadUser.behavior_type == "product_added_to_cart",
                    LeadUser.is_converted_sales == True
                ),
                    LeadsUsersAddedToCart.added_at < LeadsUsersOrdered.ordered_at
                
            )
        )
    elif LeadStatus.CONVERTED_SALES.value not in statuses and LeadStatus.ABANDONED_CART.value in statuses:
        filters.append(
        or_(
            and_(
                LeadUser.behavior_type == "product_added_to_cart",
                LeadUser.is_converted_sales == False
            ),
            LeadsUsersAddedToCart.added_at > LeadsUsersOrdered.ordered_at
        )
    )
    elif LeadStatus.CONVERTED_SALES.value in statuses and LeadStatus.ABANDONED_CART.value not in statuses:
        filters.append(LeadUser.is_converted_sales == True)
            
    if filters:
        query = query.filter(or_(*filters))
            
    user_ids = query.all()
    persons = [{"user_id": email[0]} for email in user_ids]
    if persons:
        message_body = {
            "type": 'user_ids',
            "data": {
                "persons": persons,
                "source_id": source_id,
                "user_id": user_id
            },
        }

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

    except Exception as e:
        db_session.rollback()
        logging.error(f"Error processing message: {e}", exc_info=True)
        await message.nack()

def extract_key_from_url(s3_url: str):
    parsed_url = s3_url.split("amazonaws.com/", 1)
    if len(parsed_url) != 2:
        raise ValueError(f"Invalid S3 URL format: {s3_url}")
    return parsed_url[1].split("?", 1)[0]


async def send_sse(connection, user_id: int, data: dict):
    try:
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