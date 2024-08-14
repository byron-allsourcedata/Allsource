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

from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_names import FiveXFiveNames
from models.five_x_five_surnames import FiveXFiveSurname, FiveXFiveSurnames
from models.five_x_five_users_emails import FiveXFiveUsersEmails

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from dotenv import load_dotenv
from models.five_x_five_users import FiveXFiveUser
from config.rmq_connection import RabbitMQConnection
from models.five_x_five_hems import FiveXFiveHems
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.five_x_five_hems import FiveXFiveHems
from models.leads_locations import LeadsLocations
from models.locations import Locations
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.five_x_five_users import FiveXFiveUser
from models.lead_visits import LeadVisits
from models.leads import Lead
from models.leads_users import LeadUser
from models.users import Users
from dotenv import load_dotenv
from sqlalchemy.dialects.postgresql import insert
from collections import defaultdict
# Load environment variables
load_dotenv()
logging.basicConfig(level=logging.INFO)

BUCKET_NAME = 'trovo-coop-shakespeare'


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


async def on_message_received(message, s3_session, credentials, db_session):
    async with message.process():
        try:
            message_json = json.loads(message.body)
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

                        users_to_insert = []
                        emails_to_insert = []
                        users_emails_to_insert = []

                        for _, row in df.iterrows():
                            last_updated = pd.to_datetime(row.get('LAST_UPDATED', None), unit='s', errors='coerce')
                            personal_emails_last_seen = pd.to_datetime(row.get('PERSONAL_EMAILS_LAST_SEEN', None),
                                                                       unit='s', errors='coerce')
                            company_last_updated = pd.to_datetime(row.get('COMPANY_LAST_UPDATED', None), unit='s',
                                                                  errors='coerce')
                            job_title_last_updated = pd.to_datetime(row.get('JOB_TITLE_LAST_UPDATED', None), unit='s',
                                                                    errors='coerce')

                            first_name = str(row.get('FIRST_NAME', '')).lower().strip()
                            last_name = str(row.get('LAST_NAME', '')).lower().strip()

                            if first_name:
                                first_name_obj = db_session.query(FiveXFiveNames).filter(
                                    FiveXFiveNames.name == first_name).first()
                                if not first_name_obj:
                                    first_name_obj = FiveXFiveNames(name=first_name)
                                    db_session.add(first_name_obj)
                                    db_session.flush()
                                first_name_id = first_name_obj.id
                            else:
                                first_name_id = None

                            if last_name:
                                last_name_obj = db_session.query(FiveXFiveSurnames).filter(
                                    FiveXFiveSurnames.name == last_name).first()
                                if not last_name_obj:
                                    last_name_obj = FiveXFiveSurnames(name=last_name)
                                    db_session.add(last_name_obj)
                                    db_session.flush()
                                last_name_id = last_name_obj.id
                            else:
                                last_name_id = None

                            five_x_five_user = FiveXFiveUser(
                                up_id=str(row.get('UP_ID', '')),
                                cc_id=str(row.get('CC_ID', '')),
                                first_name=first_name,
                                programmatic_business_emails=str(row.get('PROGRAMMATIC_BUSINESS_EMAILS', '')),
                                mobile_phone=str(row.get('MOBILE_PHONE', '')),
                                direct_number=str(row.get('DIRECT_NUMBER', '')),
                                gender=str(row.get('GENDER', '')),
                                age_range=str(row.get('AGE_RANGE', '')),
                                personal_phone=str(row.get('PERSONAL_PHONE', '')),
                                business_email=str(row.get('BUSINESS_EMAIL', '')),
                                personal_emails=str(row.get('PERSONAL_EMAILS', '')),
                                last_name=last_name,
                                personal_city=str(row.get('PERSONAL_CITY', '')),
                                personal_state=str(row.get('PERSONAL_STATE', '')),
                                company_name=str(row.get('COMPANY_NAME', '')),
                                company_domain=str(row.get('COMPANY_DOMAIN', '')),
                                company_phone=str(row.get('COMPANY_PHONE', '')),
                                company_sic=str(row.get('COMPANY_SIC', '')),
                                company_address=str(row.get('COMPANY_ADDRESS', '')),
                                company_city=str(row.get('COMPANY_CITY', '')),
                                company_state=str(row.get('COMPANY_STATE', '')),
                                company_zip=str(row.get('COMPANY_ZIP', '')),
                                company_linkedin_url=str(row.get('COMPANY_LINKEDIN_URL', '')),
                                company_revenue=str(row.get('COMPANY_REVENUE', '')),
                                company_employee_count=str(row.get('COMPANY_EMPLOYEE_COUNT', '')),
                                net_worth=str(row.get('NET_WORTH', '')),
                                job_title=str(row.get('JOB_TITLE', '')),
                                sha256_lc_hem=str(row.get('SHA256_LC_HEM', '')),
                                md5_lc_hem=str(row.get('MD5_LC_HEM', '')),
                                sha1_lc_hem=str(row.get('SHA1_LC_HEM', '')),
                                last_updated=last_updated,
                                personal_emails_last_seen=personal_emails_last_seen,
                                company_last_updated=company_last_updated,
                                job_title_last_updated=job_title_last_updated,
                                first_name_id=first_name_id,
                                last_name_id=last_name_id
                            )

                            users_to_insert.append(five_x_five_user)

                            business_emails = str(row.get('BUSINESS_EMAIL', '')).split(', ')
                            personal_emails = str(row.get('PERSONAL_EMAILS', '')).split(', ')

                            for business_email in business_emails:
                                if business_email:
                                    emails_to_insert.append({'email': business_email})
                                    users_emails_to_insert.append({
                                        'user_id': five_x_five_user.id,
                                        'email_id': None,
                                        'type': 'business'
                                    })

                            for personal_email in personal_emails:
                                if personal_email:
                                    emails_to_insert.append({'email': personal_email})
                                    users_emails_to_insert.append({
                                        'user_id': five_x_five_user.id,
                                        'email_id': None,
                                        'type': 'personal'
                                    })

                        db_session.bulk_save_objects(users_to_insert)
                        db_session.flush()

                        email_stmt = insert(FiveXFiveEmails).values(
                            emails_to_insert).on_conflict_do_nothing().returning(FiveXFiveEmails.id)
                        email_results = db_session.execute(email_stmt)
                        email_id_map = {email: id for email, id in zip(emails_to_insert, email_results)}

                        for user_email in users_emails_to_insert:
                            user_email['email_id'] = email_id_map.get(user_email['email_id'])

                        db_session.bulk_insert_mappings(FiveXFiveUsersEmails, users_emails_to_insert)
                        db_session.commit()

            logging.info(f"{message_json['file_name']} processed")
        except Exception as e:
            logging.error(f"Error processing message: {e}", exc_info=True)


async def main():
    logging.info("Started")
    try:
        sts_client = create_sts_client(os.getenv('S3_KEY_ID'), os.getenv('S3_KEY_SECRET'))
        credentials = assume_role(os.getenv('S3_ROLE_ARN'), sts_client)

        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        queue = await channel.declare_queue(
            name='5x5_import',
            durable=True,
        )

        engine = create_engine(
            f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()

        session = aioboto3.Session()
        await queue.consume(
            functools.partial(on_message_received, s3_session=session, credentials=credentials, db_session=db_session)
        )
        await asyncio.Future()
    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        logging.info('Shutting down...')
        await rabbitmq_connection.close()


if __name__ == "__main__":
    asyncio.run(main())
