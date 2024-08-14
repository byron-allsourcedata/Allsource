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
from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_names import FiveXFiveNames
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from config.rmq_connection import RabbitMQConnection
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.five_x_five_users import FiveXFiveUser
from dotenv import load_dotenv
from sqlalchemy.dialects.postgresql import insert

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


def convert_to_none(value):
    return value if pd.notna(value) else None


async def on_message_received(message, s3_session, credentials, db_session):
    session = db_session()
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
                            last_updated = convert_to_none(
                                pd.to_datetime(row.get('LAST_UPDATED', None), unit='s', errors='coerce'))
                            personal_emails_last_seen = convert_to_none(
                                pd.to_datetime(row.get('PERSONAL_EMAILS_LAST_SEEN', None), unit='s', errors='coerce'))
                            company_last_updated = convert_to_none(
                                pd.to_datetime(row.get('COMPANY_LAST_UPDATED', None), unit='s', errors='coerce'))
                            job_title_last_updated = convert_to_none(
                                pd.to_datetime(row.get('JOB_TITLE_LAST_UPDATED', None), unit='s', errors='coerce'))

                            first_name = str(row.get('FIRST_NAME', '')).lower().strip()
                            last_name = str(row.get('LAST_NAME', '')).lower().strip()

                            if first_name:
                                first_name_obj = session.query(FiveXFiveNames).filter(
                                    FiveXFiveNames.name == first_name).first()
                                if not first_name_obj:
                                    first_name_obj = FiveXFiveNames(name=first_name)
                                    session.add(first_name_obj)
                                    session.flush()
                                first_name_id = first_name_obj.id
                            else:
                                first_name_id = None

                            if last_name:
                                last_name_obj = session.query(FiveXFiveNames).filter(
                                    FiveXFiveNames.name == last_name).first()
                                if not last_name_obj:
                                    last_name_obj = FiveXFiveNames(name=last_name)
                                    session.add(last_name_obj)
                                    session.flush()
                                last_name_id = last_name_obj.id
                            else:
                                last_name_id = None

                            age_range = str(row.get('AGE_RANGE', None))
                            age_min = None
                            age_max = None
                            if age_range:
                                if 'and older' in age_range:
                                    age_min = age_max = int(age_range.split()[0])
                                elif '-' in age_range:
                                    age_min, age_max = age_range.split('-')
                                    age_min = int(age_min.strip())
                                    age_max = int(age_max.strip())
                                else:
                                    try:
                                        age_min = age_max = int(age_range.strip())
                                    except ValueError:
                                        logging.warning(f"Invalid age range format: {age_range}")

                            five_x_five_user = FiveXFiveUser(
                                up_id=str(row.get('UP_ID', None)),
                                cc_id=str(row.get('CC_ID', None)),
                                first_name=str(row.get('FIRST_NAME', None)),
                                programmatic_business_emails=str(row.get('PROGRAMMATIC_BUSINESS_EMAILS', None)),
                                mobile_phone=str(row.get('MOBILE_PHONE', None)),
                                direct_number=str(row.get('DIRECT_NUMBER', None)),
                                gender=str(row.get('GENDER', None)),
                                age_min=age_min,
                                age_max=age_max,
                                personal_phone=str(row.get('PERSONAL_PHONE', None)),
                                business_email=str(row.get('BUSINESS_EMAIL', None)),
                                personal_emails=str(row.get('PERSONAL_EMAILS', None)),
                                last_name=str(row.get('LAST_NAME', None)),
                                personal_city=str(row.get('PERSONAL_CITY', None)),
                                personal_state=str(row.get('PERSONAL_STATE', None)),
                                company_name=str(row.get('COMPANY_NAME', None)),
                                company_domain=str(row.get('COMPANY_DOMAIN', None)),
                                company_phone=str(row.get('COMPANY_PHONE', None)),
                                company_sic=str(row.get('COMPANY_SIC', None)),
                                company_address=str(row.get('COMPANY_ADDRESS', None)),
                                company_city=str(row.get('COMPANY_CITY', None)),
                                company_state=str(row.get('COMPANY_STATE', None)),
                                company_zip=str(row.get('COMPANY_ZIP', None)),
                                company_linkedin_url=str(row.get('COMPANY_LINKEDIN_URL', None)),
                                company_revenue=str(row.get('COMPANY_REVENUE', None)),
                                company_employee_count=str(row.get('COMPANY_EMPLOYEE_COUNT', None)),
                                net_worth=str(row.get('NET_WORTH', None)),
                                job_title=str(row.get('JOB_TITLE', None)),
                                sha256_lc_hem=str(row.get('SHA256_LC_HEM', None)),
                                md5_lc_hem=str(row.get('MD5_LC_HEM', None)),
                                sha1_lc_hem=str(row.get('SHA1_LC_HEM', None)),
                                last_updated=last_updated,
                                personal_emails_last_seen=personal_emails_last_seen,
                                company_last_updated=company_last_updated,
                                job_title_last_updated=job_title_last_updated,
                                first_name_id=first_name_id,
                                last_name_id=last_name_id
                            )

                            users_to_insert.append(five_x_five_user)

                            business_emails = str(row.get('BUSINESS_EMAIL', None)).split(', ')
                            personal_emails = str(row.get('PERSONAL_EMAILS', None)).split(', ')

                            for business_email in business_emails:
                                if business_email:
                                    emails_to_insert.append({
                                        'email': business_email,
                                        'email_host': business_email.split('@')[-1] if '@' in business_email else None
                                    })
                                    users_emails_to_insert.append({
                                        'user_id': five_x_five_user.id,
                                        'email_id': None,
                                        'type': 'business'
                                    })

                            for personal_email in personal_emails:
                                if personal_email:
                                    emails_to_insert.append({
                                        'email': personal_email,
                                        'email_host': personal_email.split('@')[-1] if '@' in personal_email else None
                                    })
                                    users_emails_to_insert.append({
                                        'user_id': five_x_five_user.id,
                                        'email_id': None,
                                        'type': 'personal'
                                    })

                            session.bulk_save_objects(users_to_insert)
                            session.flush()

                            email_stmt = insert(FiveXFiveEmails).values(
                                emails_to_insert).on_conflict_do_nothing().returning(FiveXFiveEmails.id)
                            email_results = session.execute(email_stmt)
                            email_id_map = {email['email']: id for email, id in zip(emails_to_insert, email_results)}

                            for user_email in users_emails_to_insert:
                                user_email['email_id'] = email_id_map.get(user_email['email_id'])

                            session.bulk_insert_mappings(FiveXFiveUsersEmails, users_emails_to_insert)
                            session.commit()

            logging.info(f"{message_json['file_name']} processed")
        except Exception as e:
            logging.error(f"Error processing message: {e}", exc_info=True)
            session.rollback()
        finally:
            session.close()


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
        db_session = Session

        session = aioboto3.Session()
        await queue.consume(
            functools.partial(on_message_received, s3_session=session, credentials=credentials, db_session=db_session)
        )
        await asyncio.Future()
    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        logging.info("Connection to the database closed")
        logging.info('Shutting down...')
        await rabbitmq_connection.close()


if __name__ == "__main__":
    asyncio.run(main())
