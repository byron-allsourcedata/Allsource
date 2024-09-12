import json
import logging
import os
import sys
import tempfile
import traceback
import pytz
import urllib.parse
from datetime import time as dt_time
import time
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, and_, or_
import boto3
import pyarrow.parquet as pq

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from models.leads_requests import LeadsRequests
from models.leads_visits import LeadsVisits
from models.subscriptions import UserSubscriptions
from models.five_x_five_hems import FiveXFiveHems
from models.users_payments_transactions import UsersPaymentsTransactions
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models.five_x_five_users import FiveXFiveUser
from models.leads_users import LeadUser
from models.users import Users
from models.subscriptions import SubscriptionPlan
from models.leads_orders import LeadOrders
from dotenv import load_dotenv
from sqlalchemy.dialects.postgresql import insert
from collections import defaultdict
from datetime import datetime, timedelta

load_dotenv()
logging.basicConfig(level=logging.INFO)

BUCKET_NAME = 'trovo-coop-shakespeare'
FILES_PATH = 'outgoing/cookie_sync/resolved'
LAST_PROCESSED_FILE_PATH = 'tmp/last_processed_file_resolved.txt'
AMOUNT_CREDITS = 1

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
            up_ids = session.query(FiveXFiveHems.up_id).filter(
                FiveXFiveHems.sha256_lc_hem == str(table['SHA256_LOWER_CASE'][i])).all()
            if len(up_ids) != 1:
                continue
            up_id = up_ids[0][0]
        five_x_five_user = session.query(FiveXFiveUser).filter(FiveXFiveUser.up_id == str(up_id).lower()).first()
        if five_x_five_user:
            logging.info(f"UP_ID {up_id} found in table")
            process_user_data(table, i, five_x_five_user, session)
    update_last_processed_file(file_key)


def process_user_data(table, index, five_x_five_user: FiveXFiveUser, session: Session):
    partner_uid_decoded = urllib.parse.unquote(str(table['PARTNER_UID'][index]).lower())
    partner_uid_dict = json.loads(partner_uid_decoded)
    partner_uid_client_id = partner_uid_dict.get('client_id')
    page = partner_uid_dict.get('current_page')
    user = session.query(Users).filter(Users.data_provider_id == str(partner_uid_client_id)).first()
    if not user:
        logging.info(f"User not found with client_id {partner_uid_client_id}")
        return
    page = partner_uid_dict.get('current_page')
    if page is None:
        json_headers = json.loads(str(table['JSON_HEADERS'][index]).lower())
        referer = json_headers.get('referer')[0]
        page = referer
    behavior_type = 'visitor' if not partner_uid_dict.get('action') else partner_uid_dict.get('action')
    lead_user = session.query(LeadUser).filter_by(five_x_five_user_id=five_x_five_user.id, user_id=user.id).first()
    is_first_request = False
    if not lead_user:
        is_first_request = True
        lead_user = LeadUser(five_x_five_user_id=five_x_five_user.id, user_id=user.id)
        session.add(lead_user)
        session.flush()
        user_payment_transactions = UsersPaymentsTransactions(user_id=user.id, status='success', amount_credits=AMOUNT_CREDITS, type='lead', lead_id=lead_user.id, five_x_five_up_id=five_x_five_user.up_id)
        session.add(user_payment_transactions)
        session.flush()
    else:
        first_visit_id = lead_user.first_visit_id

    requested_at_str = str(table['EVENT_DATE'][index].as_py())
    requested_at = datetime.fromisoformat(requested_at_str).replace(tzinfo=None)
    thirty_minutes_ago = requested_at - timedelta(minutes=30)
    current_visit_request = session.query(LeadsRequests.visit_id).filter(
        LeadsRequests.lead_id == lead_user.id,
        LeadsRequests.requested_at >= thirty_minutes_ago
        ).first()
    leads_requests = None
    if current_visit_request:
        visit_id = current_visit_request[0]
        leads_requests = session.query(LeadsRequests).filter(
        LeadsRequests.visit_id == visit_id).all()
        lead_visits_id = leads_requests[0].visit_id
        if first_visit_id == leads_requests[0].visit_id:
            if lead_user.behavior_type in ('visitor', 'viewed_product') and behavior_type in (
            'viewed_product', 'product_added_to_cart') and lead_user.behavior_type != behavior_type:
                session.query(LeadUser).filter(LeadUser.id == lead_user.id).update({
                    LeadUser.behavior_type: behavior_type
                })
                session.commit()
            if behavior_type == 'checkout_completed': 
                order_detail = partner_uid_dict.get('order_detail')
                session.add(LeadOrders(lead_user_id=lead_user.id, 
                                       total_price=order_detail.get('total_price'), 
                                       currency_code=order_detail.get('currency'),
                                       created_at_shopify=datetime.now(), created_at=datetime.now()))
        process_leads_requests(requested_at=requested_at, page=page, leads_requests=leads_requests, visit_id=visit_id, session=session, behavior_type=behavior_type)
        if behavior_type == 'product_added_to_cart':
            lead_user.is_abandoned_cart = True
        if behavior_type == 'checkout_completed':
            lead_user.is_converted_sales = True
        if lead_user.is_returning_visitors == False:
            lead_user.is_returning_visitors = True        
        session.flush()
    else:
        lead_visits_id = add_new_leads_visits(visited_datetime=requested_at, lead_id=lead_user.id, session=session, behavior_type=behavior_type).id
        if is_first_request == True:
            lead_user.first_visit_id = lead_visits_id
            session.flush()
            lead_users = session.query(LeadUser).filter_by(user_id=user.id).limit(2).all()
            if len(lead_users) == 1:
                last_subscription = session.query(UserSubscriptions).filter(UserSubscriptions.user_id == user.id).order_by(UserSubscriptions.id.desc()).first()
                if last_subscription and last_subscription.plan_start is None and last_subscription.plan_end is None:
                    trial_days = session.query(SubscriptionPlan.trial_days).filter(SubscriptionPlan.is_free_trial == True).scalar()
                    if trial_days:
                        date_now = datetime.now()
                        last_subscription.plan_start = date_now
                        last_subscription.plan_end = date_now + relativedelta(days=trial_days)
                        session.flush()
                
    
    lead_request = insert(LeadsRequests).values(
        lead_id=lead_user.id,
        page=page, requested_at=requested_at, visit_id=lead_visits_id
    ).on_conflict_do_nothing()
    session.execute(lead_request)
    session.flush()
    
    session.commit()

def normalize_url(url):
    """
    Normalize the URL by removing all query parameters and trailing slashes.
    """
    if not url:
        return url
    
    scheme_end = url.find('://')
    if scheme_end != -1:
        scheme_end += 3
        scheme = url[:scheme_end]
        remainder = url[scheme_end:]
    else:
        scheme = ''
        remainder = url
    
    path_end = remainder.find('?')
    if path_end != -1:
        path = remainder[:path_end]
    else:
        path = remainder

    path = path.rstrip('/')
    normalized_url = scheme + path
    return normalized_url

def convert_leads_requests_to_utc(leads_requests):
    utc = pytz.utc
    for request in leads_requests:
        if request.requested_at.tzinfo is None:
            request.requested_at = utc.localize(request.requested_at)
        else:
            request.requested_at = request.requested_at.astimezone(utc)

def process_leads_requests(requested_at, page, leads_requests, visit_id, session: Session, behavior_type):
    new_request = LeadsRequests(
        page=normalize_url(page),
        requested_at=requested_at,
    )
    leads_requests.append(new_request)
    
    leads_requests_sorted = sorted(leads_requests, key=lambda r: r.requested_at)

    start_date_time = leads_requests_sorted[0].requested_at
    end_date_time = leads_requests_sorted[-1].requested_at

    start_date = start_date_time.date()
    start_time = start_date_time.time()
    end_date = end_date_time.date()
    end_time = end_date_time.time()
    total_time_sec = int((end_date_time - start_date_time).total_seconds() + 10)
    pages_set = set()
    for i in range(len(leads_requests_sorted)):
        current_request = leads_requests_sorted[i]
        if current_request.page:
            pages_set.add(normalize_url(current_request.page))

    pages_count = len(pages_set)

    average_time_sec = int(total_time_sec / len(leads_requests_sorted))
    
    session.query(LeadsVisits).filter_by(id=visit_id).update({
        'start_date': start_date,
        'start_time': start_time,
        'end_date': end_date,
        'end_time': end_time,
        'pages_count': pages_count,
        'full_time_sec': total_time_sec,
        'average_time_sec': average_time_sec,
        'behavior_type': behavior_type
    })
    session.flush()


def add_new_leads_visits(visited_datetime, lead_id, session, behavior_type):
    start_date = visited_datetime.date()
    start_time = visited_datetime.time()
    date_page = visited_datetime + timedelta(seconds=10)
    end_date = date_page.date()
    end_time = date_page.time()

    leads_visits = LeadsVisits(
        start_date=start_date, start_time=start_time, end_date=end_date, end_time=end_time,
        pages_count=1, lead_id=lead_id, behavior_type=behavior_type
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
        session.rollback()
        logging.error(f"An error occurred: {str(e)}")
        traceback.print_exc()
    finally:
        session.close()
        logging.info("Connection to the database closed")


main()
