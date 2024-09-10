import gzip
import logging
import os
import sys
import tempfile
import time
import traceback

import boto3
import pandas as pd

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.five_x_five_hems import FiveXFiveHems
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

BUCKET_NAME = 'trovo-coop-shakespeare'
FILES_PATH = 'outgoing/upid_hem_1_6_0'
LAST_PROCESSED_FILE_PATH = 'tmp/last_processed_file_hems.txt'


def create_sts_client(key_id, key_secret):
    return boto3.client('sts', aws_access_key_id=key_id, aws_secret_access_key=key_secret, region_name='us-west-2')


def assume_role(role_arn, sts_client):
    credentials = sts_client.assume_role(RoleArn=role_arn, RoleSessionName="create-use-assume-role-scenario")[
        'Credentials']
    logging.info(f"Assumed role '{role_arn}', got temporary credentials.")
    return credentials


def process_file(bucket, file):
    obj = bucket.Object(file)
    count = 0
    with obj.get()['Body'] as body:
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(body.read())
            temp_file.seek(0)

            with gzip.open(temp_file.name, 'rt', encoding='utf-8') as f:
                df = pd.read_csv(f)
            for index, row in df.iterrows():
                count += 1
    print(count)


def process_files(sts_client):
    try:
        with open(LAST_PROCESSED_FILE_PATH, "r") as file:
            last_processed_file = file.read().strip()
    except FileNotFoundError:
        last_processed_file = None
    credentials = assume_role(os.getenv('S3_ROLE_ARN'), sts_client)
    s3 = boto3.resource('s3', region_name='us-west-2', aws_access_key_id=credentials['AccessKeyId'],
                        aws_secret_access_key=credentials['SecretAccessKey'],
                        aws_session_token=credentials['SessionToken'])

    bucket = s3.Bucket(BUCKET_NAME)
    if last_processed_file:
        files = bucket.objects.filter(Prefix=FILES_PATH, Marker=last_processed_file)
    else:
        files = bucket.objects.filter(Prefix=FILES_PATH)
    for file in files:
        process_file(bucket, file.key)


def main():
    sts_client = create_sts_client(os.getenv('S3_KEY_ID'), os.getenv('S3_KEY_SECRET'))
    logging.info("Started")
    try:
        while True:
            process_files(sts_client)
            logging.info('Sleeping for 10 minutes...')
            time.sleep(60 * 10)
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        traceback.print_exc()
    finally:
        logging.info("Connection to the database closed")


main()
