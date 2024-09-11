import asyncio
import functools
import gzip
import json
import logging
import os
import sys
import tempfile
import aioboto3
import boto3
import pandas as pd

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from dotenv import load_dotenv
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection

# Load environment variables
load_dotenv()
logging.basicConfig(level=logging.INFO)

# Configuration
BUCKET_NAME = 'trovo-coop-shakespeare'
FILES_PATH = 'outgoing/upid_hem_1_6_0'
LAST_PROCESSED_FILE_PATH = 'tmp/last_processed_file_hems.txt'
QUEUE_HEMS_EXPORT = '5x5_hems_export'
QUEUE_HEMS_FILES = '5x5_hems_files'

def create_sts_client(key_id, key_secret):
    return boto3.client(
        'sts',
        aws_access_key_id=key_id,
        aws_secret_access_key=key_secret,
        region_name='us-west-2'
    )


def assume_role(role_arn, sts_client):
    credentials = sts_client.assume_role(
        RoleArn=role_arn,
        RoleSessionName="create-use-assume-role-scenario"
    )['Credentials']
    logging.info(f"Assumed role '{role_arn}', got temporary credentials.")
    return credentials


file_list = [
        "outgoing/upid_hem_1_6_0/upid_hem_0_0_0.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_0_1.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_1_0.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_1_1.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_2_0.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_3_0.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_4_1.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_6_1.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_10_0_1.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_1_1.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_3_1.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_5_1.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_7_0.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_10_0_0.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_10_1_1.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_10_3_1.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_2_1.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_4_0.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_5_0.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_6_0.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_0_7_1.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_10_1_0.csv.gz",
        "outgoing/upid_hem_1_6_0/upid_hem_10_3_0.csv.gz"
    ]

async def on_message_received(message_body, s3_session, sts_client, rmq_connection):
    message_body_json = json.loads(message_body)
    file_name = message_body_json['file_name']
    logging.info(f"{file_name}")
    if file_name in file_list:
        return
    credentials = assume_role(os.getenv('S3_ROLE_ARN'), sts_client)
    try:
        message_json = json.loads(message_body)
        async with s3_session.client(
                's3',
                region_name='us-west-2',
                aws_access_key_id=credentials['AccessKeyId'],
                aws_secret_access_key=credentials['SecretAccessKey'],
                aws_session_token=credentials['SessionToken']
        ) as s3:
            s3_obj = await s3.get_object(Bucket=BUCKET_NAME, Key=message_json['file_name'])
            async with s3_obj["Body"] as body:
                with tempfile.NamedTemporaryFile(delete=True) as temp_file:
                    file_data = await body.read()
                    temp_file.write(file_data)
                    temp_file.seek(0)
                    with gzip.open(temp_file.name, 'rt', encoding='utf-8') as f:
                        df = pd.read_csv(f)
                    for _, row in df.iterrows():
                        await publish_rabbitmq_message(
                            connection=rmq_connection,
                            queue_name=QUEUE_HEMS_EXPORT,
                            message_body={'hem': row.to_dict()}
                        )
        logging.info(f"{message_json['file_name']} processed")
    except Exception as e:
        logging.error(f"Error processing message: {e}", exc_info=True)
        
async def main():
    logging.info("Started")
    try:
        sts_client = create_sts_client(os.getenv('S3_KEY_ID'), os.getenv('S3_KEY_SECRET'))
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        queue = await channel.declare_queue(
            name=QUEUE_HEMS_FILES,
            durable=True,
            arguments={
            'x-consumer-timeout': 14400000,
            }
        )
        session = aioboto3.Session()
        
        connection = await rabbitmq_connection.connect()
        while(True):
            channel = await connection.channel()
            queue = await channel.get_queue(QUEUE_HEMS_FILES)
            message = await queue.get(no_ack=False)
            if message:
                await message.ack()
                await on_message_received(message.body, session, sts_client, connection)
            else:
                print("No message returned")
                await asyncio.sleep(5) 
                break
            await channel.close()
        await connection.close()
        
    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        logging.info('Shutting down...')
        await rabbitmq_connection.close()


if __name__ == "__main__":
    asyncio.run(main())