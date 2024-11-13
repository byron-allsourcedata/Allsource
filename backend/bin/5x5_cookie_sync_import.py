import asyncio
import logging
import os
import sys
import tempfile
import time
import traceback

import boto3
import pyarrow.parquet as pq

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert
from dotenv import load_dotenv
from datetime import datetime
from models.five_x_five_cookie_sync_file import FiveXFiveCookieSyncFile

load_dotenv()
logging.basicConfig(level=logging.INFO)

BUCKET_NAME = 'trovo-coop-shakespeare'
FILES_PATH = 'outgoing/cookie_sync/resolved'
LAST_PROCESSED_FILE_PATH = 'tmp/last_processed_5x5_cookie_sync.txt'


def create_sts_client(key_id, key_secret):
    return boto3.client('sts', aws_access_key_id=key_id, aws_secret_access_key=key_secret, region_name='us-west-2')


def assume_role(role_arn, sts_client):
    credentials = sts_client.assume_role(RoleArn=role_arn, RoleSessionName="create-use-assume-role-scenario")[
        'Credentials']
    logging.info(f"Assumed role '{role_arn}', got temporary credentials.")
    return credentials


async def save_files_for_db(table, session, file_key):
    for i in (range(len(table))):
        requested_at_str = str(table['EVENT_DATE'][i].as_py())
        requested_at = datetime.fromisoformat(requested_at_str).replace(tzinfo=None)
        up_id = None
        if str(table['UP_ID'][i]) != 'None':
            up_id = str(table['UP_ID'][i])
        five_x_five_cookie_sync_file = insert(FiveXFiveCookieSyncFile).values(
            trovo_id=str(table['TROVO_ID'][i]),
            partner_id=str(table['PARTNER_ID'][i]),
            partner_uid=str(table['PARTNER_UID'][i]),
            sha256_lower_case=str(table['SHA256_LOWER_CASE'][i]),
            ip=str(table['IP'][i]),
            json_headers=str(table['JSON_HEADERS'][i]),
            event_date=requested_at,
            up_id=up_id,
            file_name=file_key
        ).on_conflict_do_nothing()
        session.execute(five_x_five_cookie_sync_file)
        session.flush()

    session.commit()


async def process_file(bucket, file_key, session):
    obj = bucket.Object(file_key)
    file_data = obj.get()['Body'].read()
    if file_key.endswith('.snappy.parquet'):
        with tempfile.NamedTemporaryFile(delete=True) as temp_file:
            temp_file.write(file_data)
            temp_file.seek(0)
            table = pq.read_table(temp_file.name)
            await save_files_for_db(table, session, file_key)


def update_last_processed_file(file_key):
    logging.info(f"Writing last processed file {file_key}")
    with open(LAST_PROCESSED_FILE_PATH, "w") as file:
        file.write(file_key)


async def process_files(sts_client, session):
    credentials = assume_role(os.getenv('S3_ROLE_ARN'), sts_client)
    s3 = boto3.resource('s3', region_name='us-west-2', aws_access_key_id=credentials['AccessKeyId'],
                        aws_secret_access_key=credentials['SecretAccessKey'],
                        aws_session_token=credentials['SessionToken'])

    bucket = s3.Bucket(BUCKET_NAME)

    try:
        try:
            with open(LAST_PROCESSED_FILE_PATH, "r") as file:
                last_processed_file = file.read().strip()
        except FileNotFoundError:
            last_processed_file = None

        if last_processed_file:
            files = bucket.objects.filter(Prefix=FILES_PATH, Marker=last_processed_file)
        else:
            files = bucket.objects.filter(Prefix=FILES_PATH)

        for file in files:
            await process_file(bucket, file.key, session)
            update_last_processed_file(file.key)
    except StopIteration:
        pass


async def main():
    sts_client = create_sts_client(os.getenv('S3_KEY_ID'), os.getenv('S3_KEY_SECRET'))
    engine = create_engine(
        f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}")
    Session = sessionmaker(bind=engine)
    session = Session()

    logging.info("Started")
    try:
        while True:
            await process_files(sts_client=sts_client, session=session)
            session.close()
            logging.info('Sleeping for 10 minutes...')
            time.sleep(60 * 10)
            Session = sessionmaker(bind=engine)
            session = Session()
    except Exception as e:
        session.rollback()
        logging.error(f"An error occurred: {str(e)}")
        traceback.print_exc()
    finally:
        session.close()
        logging.info("Connection to the database closed")


asyncio.run(main())
