import json
import logging
import os
import sys
import tempfile
import traceback
import urllib.parse
from datetime import time

import boto3
import pyarrow.parquet as pq

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.leads_requests import LeadsRequests
from models.leads_visits import LeadsVisits
from models.five_x_five_hems import FiveXFiveHems
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.five_x_five_users import FiveXFiveUser
from models.leads_users import LeadUser
from models.users import Users
from dotenv import load_dotenv
from sqlalchemy.dialects.postgresql import insert
from collections import defaultdict
from datetime import datetime, timedelta

load_dotenv()
logging.basicConfig(level=logging.INFO)

BUCKET_NAME = 'trovo-coop-shakespeare'
FILES_PATH = 'outgoing/cookie_sync/resolved'
LAST_PROCESSED_FILE_PATH = 'tmp/last_processed_file_resolved.txt'


def create_sts_client(key_id, key_secret):
    return boto3.client('sts', aws_access_key_id=key_id, aws_secret_access_key=key_secret, region_name='us-west-2')


def assume_role(role_arn, sts_client):
    credentials = sts_client.assume_role(RoleArn=role_arn, RoleSessionName="create-use-assume-role-scenario")[
        'Credentials']
    logging.info(f"Assumed role '{role_arn}', got temporary credentials.")
    return credentials


def process_file(bucket, file_key, session):
    obj = bucket.Object(file_key)
    file_data = obj.get()['Body'].read()
    if file_key.endswith('.snappy.parquet'):
        with tempfile.NamedTemporaryFile(delete=True) as temp_file:
            temp_file.write(file_data)
            temp_file.seek(0)
            table = pq.read_table(temp_file.name)
            process_table(table, session, file_key)


def process_table(table, session, file_key):
    for i in range(len(table)):
        up_id = table['UP_ID'][i]
        if not up_id.is_valid and str(up_id) == 'None':
            up_id = session.query(FiveXFiveHems.up_id).filter(
                FiveXFiveHems.sha256_lc_hem == str(table['SHA256_LOWER_CASE'][i])).scalar()
            if not up_id:
                continue
        five_x_five_user = session.query(FiveXFiveUser).filter(FiveXFiveUser.up_id == str(up_id).lower()).first()
        if five_x_five_user:
            logging.info(f"UP_ID {up_id} found in table")
            process_user_data(table, i, five_x_five_user, session)
    update_last_processed_file(file_key)


def process_user_data(table, index, five_x_five_user, session):
    partner_uid_decoded = urllib.parse.unquote(str(table['PARTNER_UID'][index]).lower())
    partner_uid_dict = json.loads(partner_uid_decoded)
    partner_uid_client_id = partner_uid_dict.get('client_id')
    page = partner_uid_dict.get('current_page')
    user = session.query(Users).filter(Users.data_provider_id == str(partner_uid_client_id)).first()
    if not user:
        logging.info(f"User not found with client_id {partner_uid_client_id}")
        return

    lead_user = session.query(LeadUser).filter_by(five_x_five_user_id=five_x_five_user.id, user_id=user.id).first()
    if not lead_user:
        lead_user = LeadUser(five_x_five_user_id=five_x_five_user.id, user_id=user.id)
        session.add(lead_user)
        session.flush()

    requested_at = table['EVENT_DATE'][index].as_py().isoformat()
    visited_datetime = datetime.fromisoformat(requested_at)
    thirty_minutes_ago = visited_datetime - timedelta(minutes=30)

    leads_requests = session.query(LeadsRequests).filter(
        LeadsRequests.lead_id == lead_user.id,
        LeadsRequests.requested_at <= thirty_minutes_ago
    ).all()
    if leads_requests:
        lead_visits = leads_requests[0].visit_id
        logging.info("leads requests exists")
        process_leads_requests(visited_datetime, leads_requests, lead_user.id, session)
    else:
        logging.info("leads requests not exists")
        lead_visits = add_new_leads_visits(visited_datetime, lead_user.id, session).id
    lead_request = insert(LeadsRequests).values(
        lead_id=lead_user.id,
        page=page, requested_at=requested_at, visit_id=lead_visits
    ).on_conflict_do_nothing()
    session.execute(lead_request)
    session.commit()


def process_leads_requests(requested_at, leads_requests, lead_id, session):
    start_date, start_time, end_time, pages_count, average_time_sec = requested_at.date(), requested_at.time(), 10, 1, 10
    for lead_request in leads_requests:
        request_date = lead_request.requested_at
        if request_date < datetime.combine(start_date, start_time):
            start_date = request_date.date()
            start_time = request_date.time()
        pages_count += 1
        end_time += 10
        average_time_sec += 10

    date_page = datetime.combine(start_date, start_time) + timedelta(seconds=end_time)
    end_date = date_page.date()
    end_time = date_page.time()
    session.query(LeadsVisits).filter_by(lead_id=lead_id).update({
        'start_date': start_date, 'start_time': start_time, 'end_date': end_date,
        'end_time': end_time, 'pages_count': pages_count, 'average_time_sec': average_time_sec
    })
    session.flush()

def add_new_leads_visits(visited_datetime, lead_id, session):
    start_date = visited_datetime.date()
    start_time = visited_datetime.time()
    date_page = datetime.combine(start_date, start_time) + timedelta(seconds=10)
    end_date = date_page.date()
    end_time = date_page.time()


    leads_visits = LeadsVisits(
        start_date=start_date, start_time=start_time, end_date=end_date, end_time=end_time,
        pages_count=1, average_time_sec=10, lead_id=lead_id
    )
    session.add(leads_visits)
    session.flush()
    return leads_visits


def update_last_processed_file(file_key):
    logging.info(f"Writing last processed file {file_key}")
    with open(LAST_PROCESSED_FILE_PATH, "w") as file:
        file.write(file_key)


def check_visitors(bucket, files):
    all_visitors_per_day = defaultdict(lambda: {'unique_visitors': set(), 'views': 0, 'null_uids': 0})

    for file in files:
        obj = bucket.Object(file.key)
        file_data = obj.get()['Body'].read()

        if file.key.endswith('.snappy.parquet'):
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(file_data)
                temp_file.close()
                table = pq.read_table(temp_file.name)
                os.remove(temp_file.name)

                for i in range(len(table)):
                    event_date = table['EVENT_DATE'][i].as_py().date()
                    up_id = table['UP_ID'][i]

                    all_visitors_per_day[event_date]['views'] += 1

                    if not up_id.is_valid:
                        all_visitors_per_day[event_date]['null_uids'] += 1
                    else:
                        all_visitors_per_day[event_date]['unique_visitors'].add(up_id)

    for date, data in all_visitors_per_day.items():
        num_visitors = len(data['unique_visitors'])
        num_null_uids = data['null_uids']
        num_views = data['views']
        print(
            f"Date: {date}, Number of unique visitors: {num_visitors}, Number of views: {num_views}, Number of null UIDs: {num_null_uids}")


def process_files(sts_client, session):
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
        process_file(bucket, file.key, session)


def main():
    sts_client = create_sts_client(os.getenv('S3_KEY_ID'), os.getenv('S3_KEY_SECRET'))
    engine = create_engine(
        f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}")
    Session = sessionmaker(bind=engine)
    session = Session()
    logging.info("Started")
    try:
        while True:
            process_files(sts_client, session)
            logging.info('Sleeping for 10 minutes...')
            time.sleep(60 * 10)
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        traceback.print_exc()
    finally:
        session.close()
        logging.info("Connection to the database closed")


main()
