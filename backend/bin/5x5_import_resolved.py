import tempfile
import time
import re
import boto3
import pyarrow.parquet as pq
import logging
import urllib.parse
import json
import sys
import os

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.five_x_five_users import FiveXFiveUser
from models.lead_visits import LeadVisits
from models.leads import Lead
from models.leads_users import LeadUser
from models.users import Users
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

BUCKET_NAME = 'trovo-coop-shakespeare'
FILES_PATH = 'outgoing/cookie_sync/resolved'


def create_sts_client(key_id, key_secret):
    return boto3.client('sts', aws_access_key_id=key_id, aws_secret_access_key=key_secret, region_name='us-west-2')


def get_date_from_filename(file_name):
    match = re.search(r'y=(\d{4})/m=(\d{2})/d=(\d{2})/h=(\d{2})/m=(\d{2})', file_name)
    if match:
        return match.groups()
    return None


def assume_role(role_arn, sts_client):
    credentials = sts_client.assume_role(RoleArn=role_arn, RoleSessionName="create-use-assume-role-scenario")[
        'Credentials']
    logging.info(f"Assumed role '{role_arn}', got temporary credentials.")
    return credentials


def process_file(bucket, file, session):
    obj = bucket.Object(file)
    file_data = obj.get()['Body'].read()
    if file.endswith('.snappy.parquet'):
        with tempfile.NamedTemporaryFile() as temp_file:
            temp_file.write(file_data)
            temp_file.seek(0)
            table = pq.read_table(temp_file.name)
            for i in range(len(table)):
                up_id = table['UP_ID'][i]
                if up_id is not None and str(up_id) != 'None':
                    five_x_five_user = session.query(FiveXFiveUser).filter(
                        FiveXFiveUser.up_id == str(up_id).lower()).first()
                    if five_x_five_user:
                        logging.info(f"UP_ID {up_id} found in table")
                        lead = Lead(
                            first_name=five_x_five_user.first_name,
                            mobile_phone=five_x_five_user.personal_phone,
                            business_email=five_x_five_user.business_email,
                            last_name=five_x_five_user.last_name,
                            up_id=str(up_id),
                            trovo_id=str(table['TROVO_ID'][i]).lower(),
                            partner_id=str(table['PARTNER_ID'][i]).lower(),
                            partner_uid=str(table['PARTNER_UID'][i]).lower(),
                            sha256_lower_case=str(table['SHA256_LOWER_CASE'][i]).lower(),
                            ip=str(table['IP'][i]).lower(),
                            json_headers=str(table['JSON_HEADERS'][i]).lower()
                        )
                        session.add(lead)
                        session.commit()
                        partner_uid_decoded = urllib.parse.unquote(str(table['PARTNER_UID'][i]).lower())
                        partner_uid_dict = json.loads(partner_uid_decoded)
                        partner_uid_client_id = partner_uid_dict.get('client_id')
                        user = session.query(Users).filter(
                            Users.data_provider_id == str(partner_uid_client_id)).first()
                        if user:
                            lead_id = lead.id
                            lead_user = LeadUser(lead_id=lead_id, user_id=user.id)
                            session.add(lead_user)
                            session.commit()
                            visited_at = table['EVENT_DATE'][i].as_py().isoformat()
                            json_data = json.loads(str(table['JSON_HEADERS'][i].as_py()))
                            referer = json_data.get('Referer', '')
                            if referer:
                                referer = referer[0]
                            lead_visit = LeadVisits(leads_users_id=lead_user.id, visited_at=visited_at,
                                                    referer=referer)
                            session.add(lead_visit)
                            session.commit()
                            logging.info(f"Processed UP_ID {up_id}")
        last_processed_file = file
        logging.info(f"write last processed file {file}")
        with open("tmp/last_processed_file.txt", "w") as file:
            file.write(last_processed_file)


def process_files(sts_client, session):
    try:
        with open("tmp/last_processed_file.txt", "r") as file:
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
        process_file(bucket, file.key, session)


def main():
    sts_client = create_sts_client(os.getenv('S3_KEY_ID'), os.getenv('S3_KEY_SECRET'))
    engine = create_engine(
        f'postgresql://{os.getenv('POSTGRESQL_LOGIN')}:{os.getenv('POSTGRESQL_PASSWORD')}@{os.getenv('POSTGRESQL_HOST')}/{os.getenv('POSTGRESQL_NAME')}')
    Session = sessionmaker(bind=engine)
    session = Session()
    logging.info("Started")
    while True:
        process_files(sts_client, session)
        logging.info('Sleeping for 10 minutes...')
        time.sleep(60 * 10)


main()
