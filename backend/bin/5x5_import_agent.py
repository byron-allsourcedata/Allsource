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
from sqlalchemy import create_engine

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.five_x_five_phones import FiveXFivePhones
from models.five_x_five_users_phones import FiveXFiveUsersPhones
from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_names import FiveXFiveNames
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from config.rmq_connection import RabbitMQConnection
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import sessionmaker
from models.five_x_five_users import FiveXFiveUser
from dotenv import load_dotenv

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
    if pd.isna(value) or value is None or value == 'nan':
        return None
    return value


def save_emails_to_user(session, emails, five_x_five_user_id, type):
    for email in emails:
        email = email.strip()
        email = convert_to_none(email)
        if email:
            email_obj = session.query(FiveXFiveEmails).filter(
                FiveXFiveEmails.email == email).first()
            if not email_obj:
                email_obj = FiveXFiveEmails(
                    email=email,
                    email_host=email.split('@')[-1] if '@' in email else None
                )
                session.add(email_obj)
                session.flush()

            five_x_five_user_email = insert(FiveXFiveUsersEmails).values(
                user_id=five_x_five_user_id,
                email_id=email_obj.id,
                type=type
            ).on_conflict_do_nothing()
            session.execute(five_x_five_user_email)
            session.flush()

def save_phones_to_user(session, phones, five_x_five_user_id, type):
    for number in phones:
        number = number.strip()
        number = convert_to_none(number)
        if number:
            number = number.replace("+", "")
            phone_obj = session.query(FiveXFivePhones).filter(
                FiveXFivePhones.number == number).first()
            if not phone_obj:
                phone_obj = FiveXFivePhones(
                    number=number
                )
                session.add(phone_obj)
                session.flush()

            five_x_five_user_phone = insert(FiveXFiveUsersPhones).values(
                user_id=five_x_five_user_id,
                phone_id=phone_obj.id,
                type=type
            ).on_conflict_do_nothing()
            session.execute(five_x_five_user_phone)
            session.flush()


async def on_message_received(message, s3_session, credentials, session):
    async with message.process():
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

                    for _, row in df.iterrows():
                        try:
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

                            first_name_obj = session.query(FiveXFiveNames).filter(
                                FiveXFiveNames.name == first_name).first()
                            if not first_name_obj:
                                first_name_obj = FiveXFiveNames(name=first_name)
                                session.add(first_name_obj)
                                session.flush()
                            first_name_id = first_name_obj.id

                            last_name_obj = session.query(FiveXFiveNames).filter(
                                FiveXFiveNames.name == last_name).first()
                            if not last_name_obj:
                                last_name_obj = FiveXFiveNames(name=last_name)
                                session.add(last_name_obj)
                                session.flush()
                            last_name_id = last_name_obj.id

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
                                up_id=convert_to_none(row.get('UP_ID')),
                                cc_id=convert_to_none(row.get('CC_ID')),
                                first_name=convert_to_none(row.get('FIRST_NAME')),
                                programmatic_business_emails=convert_to_none(row.get('PROGRAMMATIC_BUSINESS_EMAILS')),
                                mobile_phone=convert_to_none(row.get('MOBILE_PHONE')),
                                direct_number=convert_to_none(row.get('DIRECT_NUMBER')),
                                gender=convert_to_none(row.get('GENDER')),
                                age_min=age_min,
                                age_max=age_max,
                                personal_phone=convert_to_none(row.get('PERSONAL_PHONE')),
                                business_email=convert_to_none(row.get('BUSINESS_EMAIL')),
                                personal_emails=convert_to_none(row.get('PERSONAL_EMAILS')),
                                last_name=convert_to_none(row.get('LAST_NAME')),
                                personal_city=convert_to_none(row.get('PERSONAL_CITY')),
                                personal_state=convert_to_none(row.get('PERSONAL_STATE')),
                                company_name=convert_to_none(row.get('COMPANY_NAME')),
                                company_domain=convert_to_none(row.get('COMPANY_DOMAIN')),
                                company_phone=convert_to_none(row.get('COMPANY_PHONE')),
                                company_sic=convert_to_none(row.get('COMPANY_SIC')),
                                company_address=convert_to_none(row.get('COMPANY_ADDRESS')),
                                company_city=convert_to_none(row.get('COMPANY_CITY')),
                                company_state=convert_to_none(row.get('COMPANY_STATE')),
                                company_zip=convert_to_none(row.get('COMPANY_ZIP')),
                                company_linkedin_url=convert_to_none(row.get('COMPANY_LINKEDIN_URL')),
                                company_revenue=convert_to_none(row.get('COMPANY_REVENUE')),
                                company_employee_count=convert_to_none(row.get('COMPANY_EMPLOYEE_COUNT')),
                                net_worth=convert_to_none(row.get('NET_WORTH')),
                                job_title=convert_to_none(row.get('JOB_TITLE')),
                                sha256_lc_hem=convert_to_none(row.get('SHA256_LC_HEM')),
                                md5_lc_hem=convert_to_none(row.get('MD5_LC_HEM')),
                                sha1_lc_hem=convert_to_none(row.get('SHA1_LC_HEM')),
                                last_updated=last_updated,
                                personal_emails_last_seen=personal_emails_last_seen,
                                company_last_updated=company_last_updated,
                                job_title_last_updated=job_title_last_updated,
                                first_name_id=first_name_id,
                                last_name_id=last_name_id,
                                additional_personal_emails=convert_to_none(row.get('ADDITIONAL_PERSONAL_EMAILS'))
                            )
                            five_x_five_user = session.merge(five_x_five_user)
                            session.flush()

                            emails = str(row.get('BUSINESS_EMAIL', '')).split(', ')
                            save_emails_to_user(session, emails, five_x_five_user.id, 'business')
                            emails = str(row.get('PERSONAL_EMAILS', '')).split(', ')
                            save_emails_to_user(session, emails, five_x_five_user.id, 'personal')
                            emails = str(row.get('ADDITIONAL_PERSONAL_EMAILS', '')).split(', ')
                            save_emails_to_user(session, emails, five_x_five_user.id, 'additional_personal')

                            mobile_phone = str(row.get('MOBILE_PHONE', '')).split(', ')
                            mobile_phone_set = set(mobile_phone)
                            direct_number = [num for num in str(row.get('DIRECT_NUMBER', '')).split(', ') if
                                             num not in mobile_phone_set]
                            personal_phone = [num for num in str(row.get('PERSONAL_PHONE', '')).split(', ') if
                                              num not in mobile_phone_set]
                            save_phones_to_user(session, mobile_phone, five_x_five_user.id, 'mobile_phone')
                            save_phones_to_user(session, direct_number, five_x_five_user.id, 'direct_number')
                            save_phones_to_user(session, personal_phone, five_x_five_user.id, 'personal_phone')

                            logging.info('Committing transaction')
                            session.commit()
                            logging.info(f"{message_json['file_name']} processed")
                        except Exception as e:
                            logging.error(f"Error processing message: {e}", exc_info=True)
                            session.rollback()
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
        db_session = Session()
        session = aioboto3.Session()
        await queue.consume(
            functools.partial(on_message_received, s3_session=session, credentials=credentials, session=db_session)
        )
        await asyncio.Future()
    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        logging.info("Connection to the database closed")
        logging.info('Shutting down...')
        db_session.close()
        await rabbitmq_connection.close()


if __name__ == "__main__":
    asyncio.run(main())
