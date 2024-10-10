import json
import logging
import os
import sys
import tempfile
import asyncio
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

from utils import normalize_url
from models.leads_requests import LeadsRequests
from models.users_domains import UserDomains
from models.suppression_rule import SuppressionRule
from models.leads_users_added_to_cart import LeadsUsersAddedToCart
from models.leads_users_ordered import LeadsUsersOrdered
from models.leads_visits import LeadsVisits
from models.subscriptions import UserSubscriptions
from models.five_x_five_hems import FiveXFiveHems
from models.suppressions_list import SuppressionList
from models.users_payments_transactions import UsersPaymentsTransactions
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models.five_x_five_users import FiveXFiveUser
from models.leads_users import LeadUser
from models.users import Users
from models.subscriptions import SubscriptionPlan
from models.leads_orders import LeadOrders
from models.integrations.suppresions import LeadsSupperssion
from dotenv import load_dotenv
from sqlalchemy.dialects.postgresql import insert
from collections import defaultdict
from datetime import datetime, timedelta
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
from models.integrations.users_domains_integrations import UserIntegration

load_dotenv()
logging.basicConfig(level=logging.INFO)

BUCKET_NAME = 'trovo-coop-shakespeare'
FILES_PATH = 'outgoing/cookie_sync/resolved'
LAST_PROCESSED_FILE_PATH = 'tmp/last_processed_file_resolved.txt'
AMOUNT_CREDITS = 1
QUEUE_CREDITS_CHARGING = 'credits_charging'
QUEUE_DATA_SYNC = 'data_sync_leads'

ROOT_BOT_CLIENT_EMAIL = 'onlineinet.ru@gmail.com'
ROOT_BOT_CLIENT_DOMAIN = 'https://app.maximiz.ai'

EMAIL_LIST = ['business_email', 'personal_emails', 'additional_personal_emails']

def create_sts_client(key_id, key_secret):
    return boto3.client('sts', aws_access_key_id=key_id, aws_secret_access_key=key_secret, region_name='us-west-2')


def assume_role(role_arn, sts_client):
    credentials = sts_client.assume_role(RoleArn=role_arn, RoleSessionName="create-use-assume-role-scenario")[
        'Credentials']
    logging.info(f"Assumed role '{role_arn}', got temporary credentials.")
    return credentials


async def process_file(bucket, file_key, session, channel, root_user):
    obj = bucket.Object(file_key)
    file_data = obj.get()['Body'].read()
    if file_key.endswith('.snappy.parquet'):
        with tempfile.NamedTemporaryFile(delete=True) as temp_file:
            temp_file.write(file_data)
            temp_file.seek(0)
            table = pq.read_table(temp_file.name)
            await process_table(table, session, file_key, channel, root_user)


async def process_table(table, session, file_key, channel, root_user):
    for i in reversed(range(len(table))):
        up_id = table['UP_ID'][i]
        five_x_five_user = 1
        if not up_id.is_valid:
            up_ids = session.query(FiveXFiveHems.up_id).filter(
                FiveXFiveHems.sha256_lc_hem == str(table['SHA256_LOWER_CASE'][i])).all()
            if len(up_ids) != 1:
                continue
            up_id = up_ids[0][0]
        five_x_five_user = session.query(FiveXFiveUser).filter(FiveXFiveUser.up_id == str(up_id).lower()).first()
        if five_x_five_user:
            logging.info(f"UP_ID {up_id} found in table")
            await process_user_data(table, i, five_x_five_user, session, channel, None)
            if root_user:
                await process_user_data(table, i, five_x_five_user, session, channel, root_user)
            break
    update_last_processed_file(file_key)
    
def get_all_five_x_user_emails(business_email, personal_emails, additional_personal_emails):
    emails = {business_email.split(', ')}
    emails.update(personal_emails.split(', '))
    emails.update(additional_personal_emails.split(', '))
    return list(emails)


async def process_user_data(table, index, five_x_five_user: FiveXFiveUser, session: Session, rmq_connection, root_user=None):
    partner_uid_decoded = urllib.parse.unquote(str(table['PARTNER_UID'][index]).lower())
    partner_uid_dict = json.loads(partner_uid_decoded)
    partner_uid_client_id = partner_uid_dict.get('client_id')
    page = partner_uid_dict.get('current_page')
    if root_user:
        result = root_user
    else:
        result = session.query(Users, UserDomains.id) \
                    .join(UserDomains, UserDomains.user_id == Users.id) \
                    .filter(UserDomains.data_provider_id == str(partner_uid_client_id)) \
                    .first()
    if not result:
        logging.info(f"result not found with client_id {partner_uid_client_id}")
        return
    user, user_domain_id = result
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
        suppression_rule = session.query(SuppressionRule).filter(SuppressionRule.domain_id == user_domain_id).first()
        suppression_list = session.query(SuppressionList).filter(SuppressionList.domain_id == user_domain_id).first()
        suppressions_emails = []
        if suppression_list and suppression_list.total_emails:
            suppressions_emails.append(suppression_list.total_emails.split(', '))
        if suppression_rule and suppression_rule.suppressions_multiple_emails:
            suppressions_emails.append(suppression_rule.suppressions_multiple_emails.split(', '))
        suppressions_emails = list(set(suppressions_emails))
        if suppression_rule or suppression_list:
            emails_to_check = get_all_five_x_user_emails(five_x_five_user.business_email, five_x_five_user.personal_emails, five_x_five_user.additional_personal_emails)
            for email in suppressions_emails:
                if email in emails_to_check:
                    logging.info(f"{email} exists in five_x_five_user.")
                    return
        if suppression_rule:
            if suppression_rule.is_url_certain_activation and any(url in page for url in suppression_rule.activate_certain_urls):
                logging.info(f"activate_certain_urls exists: {suppression_rule.activate_certain_urls}")
                return
            
            if suppression_rule.is_based_activation and any(url in page for url in suppression_rule.activate_based_urls):
                logging.info(f"activate_based_urls exists: {suppression_rule.activate_based_urls}")
                return
            
        if root_user is None:
            users_payments_transactions = session.query(UsersPaymentsTransactions).filter(
                UsersPaymentsTransactions.five_x_five_up_id == str(five_x_five_user.up_id),
                UsersPaymentsTransactions.domain_id == user_domain_id
            ).first()
            if users_payments_transactions:
                logging.info(f"users_payments_transactions is already exists with id = {users_payments_transactions.id}")
                return
            user_payment_transactions = UsersPaymentsTransactions(user_id=user.id, status='success', amount_credits=AMOUNT_CREDITS, type='buy_lead', domain_id=user_domain_id, five_x_five_up_id=five_x_five_user.up_id)
            session.add(user_payment_transactions)
            if (user.leads_credits - AMOUNT_CREDITS) < 0:
                if user.is_leads_auto_charging is False:
                    logging.info(f"User eads_auto_charging is False")
                    return
                user.leads_credits -= AMOUNT_CREDITS
                if user.leads_credits % 100 == 0:
                    await publish_rabbitmq_message(
                        connection=rmq_connection,
                        queue_name=QUEUE_CREDITS_CHARGING,
                        message_body={'customer_id': user.customer_id, 'credits': user.leads_credits}
                    )
                    logging.info({'customer_id': user.customer_id, 'credits': user.leads_credits})
            else:
                user.leads_credits -= AMOUNT_CREDITS
            session.flush()
        
        is_first_request = True
        lead_user = LeadUser(five_x_five_user_id=five_x_five_user.id, user_id=user.id, behavior_type=behavior_type, domain_id=user_domain_id, total_visit=0, avarage_visit_time=0, total_visit_time=0)
        emails_to_check = get_all_five_x_user_emails(five_x_five_user.business_email, five_x_five_user.personal_emails, five_x_five_user.additional_personal_emails)
        integrations_ids = [integration.id for integration in session.query(UserIntegration).filter(UserIntegration.is_with_suppression == True).all()]
        lead_suppression = session.query(LeadsSupperssion).filter(
            LeadsSupperssion.domain_id == user_domain_id,
            LeadsSupperssion.email.in_(emails_to_check),
            LeadsSupperssion.integration_id.in_(integrations_ids)
        ).first() is not None
        if not lead_suppression:
            session.add(lead_user)
            session.flush()
            channel = await rmq_connection.channel()
            await channel.declare_queue(
                name=QUEUE_DATA_SYNC,
                durable=True
            )
            publish_rabbitmq_message(rmq_connection, QUEUE_DATA_SYNC, {'domain_id': user_domain_id, 'leads_type': behavior_type, 'lead': {
                'id': lead_user.id,
                'five_x_five_user_id': lead_user.five_x_five_user_id
            }})
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
        leads_result = session.query(LeadsRequests, LeadsVisits.id, LeadsVisits.behavior_type, LeadsVisits.full_time_sec) \
            .join(LeadsVisits, LeadsRequests.visit_id == LeadsVisits.id) \
            .filter(LeadsRequests.visit_id == visit_id) \
            .all()
        leads_requests = [leads_request for leads_request, _, _, _ in leads_result]
        lead_visit_id = leads_result[0][1]
        lead_behavior_type = leads_result[0][2]
        lead_visit_full_time_sec = leads_result[0][3]
        if lead_user.behavior_type in ('visitor', 'viewed_product') and behavior_type in (
        'viewed_product', 'product_added_to_cart') and lead_user.behavior_type != behavior_type:
            session.query(LeadUser).filter(LeadUser.id == lead_user.id).update({
                LeadUser.behavior_type: behavior_type
            })
            session.flush()
        if lead_behavior_type == 'visitor':
            if behavior_type == 'viewed_product':
                lead_behavior_type = behavior_type
            elif behavior_type == 'product_added_to_cart':
                lead_behavior_type = behavior_type
        elif lead_behavior_type == 'viewed_product':
            if behavior_type == 'product_added_to_cart':
                lead_behavior_type = behavior_type
        process_leads_requests(requested_at=requested_at, page=page, leads_requests=leads_requests, visit_id=visit_id, lead_visit_full_time_sec=lead_visit_full_time_sec, session=session, behavior_type=lead_behavior_type, lead_user=lead_user)
    else:
        lead_visit_id = add_new_leads_visits(visited_datetime=requested_at, lead_id=lead_user.id, session=session, behavior_type=behavior_type, lead_user=lead_user).id
        if is_first_request == True:
            lead_user.first_visit_id = lead_visit_id
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
        else:
            if lead_user.is_returning_visitor == False:
                lead_user.is_returning_visitor = True
                session.flush()
                
    if behavior_type == 'checkout_completed':
        if lead_user.is_converted_sales == False:
                lead_user.is_converted_sales = True
                session.flush()
        order_detail = partner_uid_dict.get('order_detail')
        session.add(LeadOrders(lead_user_id=lead_user.id, 
                               shopify_order_id=order_detail.get('order_id'),
                               total_price=order_detail.get('total_price'), 
                               currency_code=order_detail.get('currency'),
                               created_at_shopify=order_detail['created_at_shopify'], created_at=datetime.now()))
        existing_record = session.query(LeadsUsersOrdered).filter_by(lead_user_id=lead_user.id).first()
        if existing_record:
            existing_record.ordered_at = requested_at
        else:
            new_record = LeadsUsersOrdered(lead_user_id=lead_user.id, ordered_at=requested_at)
            session.add(new_record)
    if  behavior_type == 'product_added_to_cart':
        existing_record = session.query(LeadsUsersAddedToCart).filter_by(lead_user_id=lead_user.id).first()
        if existing_record:
            existing_record.added_at = requested_at
        else:
            new_record = LeadsUsersAddedToCart(lead_user_id=lead_user.id, added_at=requested_at)
            session.add(new_record)
    lead_request = insert(LeadsRequests).values(
        lead_id=lead_user.id,
        page=page, requested_at=requested_at, visit_id=lead_visit_id
    ).on_conflict_do_nothing()
    session.execute(lead_request)
    session.flush()
    
    session.commit()

def convert_leads_requests_to_utc(leads_requests):
    utc = pytz.utc
    for request in leads_requests:
        if request.requested_at.tzinfo is None:
            request.requested_at = utc.localize(request.requested_at)
        else:
            request.requested_at = request.requested_at.astimezone(utc)

def process_leads_requests(requested_at, page, leads_requests, visit_id, lead_visit_full_time_sec, session: Session, behavior_type, lead_user):
    lead_id = lead_user.id
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

    lead_user.total_visit_time = lead_user.total_visit_time - lead_visit_full_time_sec + total_time_sec
    lead_user.avarage_visit_time = int(lead_user.total_visit_time / lead_user.total_visit)

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


def add_new_leads_visits(visited_datetime, lead_id, session, behavior_type, lead_user):
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
    
    leads_count = session.query(LeadsRequests) \
            .filter(LeadsRequests.lead_id == lead_id) \
            .count()
    
    lead_user.total_visit += 1
    lead_user.total_visit_time += 10
    lead_user.avarage_visit_time = int(lead_user.total_visit_time / lead_user.total_visit)
        
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


async def process_files(sts_client, session, channel, root_user):
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
        await process_file(bucket, file.key, session, channel, root_user)


async def main():
    sts_client = create_sts_client(os.getenv('S3_KEY_ID'), os.getenv('S3_KEY_SECRET'))
    engine = create_engine(
        f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}")
    Session = sessionmaker(bind=engine)
    session = Session()
    
    rabbitmq_connection = RabbitMQConnection()
    connection = await rabbitmq_connection.connect()
    channel = await connection.channel()
    await channel.declare_queue(
        name=QUEUE_CREDITS_CHARGING,
        durable=True,
        arguments={
            'x-consumer-timeout': 3600000,
        }
    )
    
    logging.info("Started")
    try:
        result = session.query(Users, UserDomains.id) \
            .join(UserDomains, UserDomains.user_id == Users.id) \
            .filter((UserDomains.domain == ROOT_BOT_CLIENT_DOMAIN) & (Users.email == ROOT_BOT_CLIENT_EMAIL)) \
            .first()

        while True:
            await process_files(sts_client=sts_client, session=session, channel=connection, root_user=result)
            logging.info('Sleeping for 10 minutes...')
            time.sleep(60 * 10)
    except Exception as e:
        session.rollback()
        logging.error(f"An error occurred: {str(e)}")
        traceback.print_exc()
    finally:
        session.close()
        logging.info("Connection to the database closed")


asyncio.run(main())
