import json
import logging
import os
import sys
import tempfile
import asyncio
import traceback
import pytz
import re
import urllib.parse
import time
from dateutil.relativedelta import relativedelta
import boto3
import pyarrow.parquet as pq
import random

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from utils import normalize_url
from urllib.parse import urlparse, parse_qs
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
from datetime import datetime, timedelta, timezone
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
from models.integrations.users_domains_integrations import UserIntegration
from dependencies import (SubscriptionService, UserPersistence, PlansPersistence)

load_dotenv()
logging.basicConfig(level=logging.INFO)

BUCKET_NAME = 'trovo-coop-shakespeare'
FILES_PATH = 'outgoing/cookie_sync/resolved'
LAST_PROCESSED_FILE_PATH = 'tmp/last_processed_file_resolved.txt'
AMOUNT_CREDITS = 1
QUEUE_CREDITS_CHARGING = 'credits_charging'
QUEUE_DATA_SYNC = 'data_sync_leads'

ROOT_BOT_CLIENT_EMAIL = 'demo@maximiz.ai'
ROOT_BOT_CLIENT_DOMAIN = 'all-leads.com'

EMAIL_LIST = ['business_email', 'personal_emails', 'additional_personal_emails']


count = 0

def create_sts_client(key_id, key_secret):
    return boto3.client('sts', aws_access_key_id=key_id, aws_secret_access_key=key_secret, region_name='us-west-2')


def assume_role(role_arn, sts_client):
    credentials = sts_client.assume_role(RoleArn=role_arn, RoleSessionName="create-use-assume-role-scenario")[
        'Credentials']
    logging.info(f"Assumed role '{role_arn}', got temporary credentials.")
    return credentials

async def save_files_by_hour(table, cookie_sync_by_hour):
    for i in (range(len(table))):
        ip = str(table['IP'][i])
        requested_at_str = str(table['EVENT_DATE'][i].as_py())
        requested_at = datetime.fromisoformat(requested_at_str).replace(tzinfo=None)
        key = f"{requested_at}_{ip}"
        if key not in cookie_sync_by_hour:
            cookie_sync_by_hour[key] = []
        lead_info = {
            'TROVO_ID:': str(table['TROVO_ID'][i]),
            'PARTNER_ID': str(table['PARTNER_ID'][i]),
            'PARTNER_UID': str(table['PARTNER_UID'][i]),
            'SHA256_LOWER_CASE': str(table['SHA256_LOWER_CASE'][i]),
            'IP': str(table['IP'][i]),
            'JSON_HEADERS': str(table['JSON_HEADERS'][i]),
            'EVENT_DATE': str(table['EVENT_DATE'][i]),
            'UP_ID': str(table['UP_ID'][i])
        }
        cookie_sync_by_hour[key].append(lead_info)
        


async def process_file(bucket, file_key, cookie_sync_by_hour):
    obj = bucket.Object(file_key)
    file_data = obj.get()['Body'].read()
    if file_key.endswith('.snappy.parquet'):
        with tempfile.NamedTemporaryFile(delete=True) as temp_file:
            temp_file.write(file_data)
            temp_file.seek(0)
            table = pq.read_table(temp_file.name)
            await save_files_by_hour(table, cookie_sync_by_hour)


def get_all_five_x_user_emails(business_email, personal_emails, additional_personal_emails):
    emails = set()
    if business_email:
        emails.update(business_email.split(', '))
    if personal_emails:
        emails.update(personal_emails.split(', '))
    if additional_personal_emails:
        emails.update(additional_personal_emails.split(', '))
    return list(emails)


async def process_table(session, cookie_sync_by_hour, channel, root_user, subscription_service):
    for key, possible_leads in cookie_sync_by_hour.items():
        for possible_lead in reversed(possible_leads):
            up_id = possible_lead['UP_ID']
            if up_id is None or up_id == 'None':
                up_ids = session.query(FiveXFiveHems.up_id).filter(
                    FiveXFiveHems.sha256_lc_hem == str(possible_lead['SHA256_LOWER_CASE'])).all()
                if len(up_ids) == 0:
                    logging.warning(f"Not found SHA256_LOWER_CASE {possible_lead['SHA256_LOWER_CASE']}")
                    continue
                elif len(up_ids) > 1:
                    logging.info(f"Too many SHA256_LOWER_CASEs {possible_lead['SHA256_LOWER_CASE']}")
                    continue
                up_id = up_ids[0][0]
                logging.info(f"Lead found by SHA256_LOWER_CASE {possible_lead['SHA256_LOWER_CASE']}")
            if up_id is not None and up_id != 'None':
                five_x_five_user = session.query(FiveXFiveUser).filter(FiveXFiveUser.up_id == str(up_id).lower()).first()
                if five_x_five_user:
                    logging.info(f"Lead found by UP_ID {up_id}")
                    await process_user_data(possible_lead, five_x_five_user, session, channel, subscription_service, None)
                    if root_user:
                        await process_user_data(possible_lead, five_x_five_user, session, channel, subscription_service, root_user)
                    break
                else:
                    logging.warning(f"Not found by UP_ID {up_id}")
                    
async def process_payment_transaction(session, five_x_five_user_up_id, user_domain_id, user, rmq_connection):
    users_payments_transactions = session.query(UsersPaymentsTransactions).filter(
        UsersPaymentsTransactions.five_x_five_up_id == str(five_x_five_user_up_id),
        UsersPaymentsTransactions.domain_id == user_domain_id
    ).first()
    if users_payments_transactions:
        logging.info(f"users_payments_transactions is already exists with id = {users_payments_transactions.id}")
        return
    user_payment_transactions = UsersPaymentsTransactions(user_id=user.id, status='success', amount_credits=AMOUNT_CREDITS, type='buy_lead', domain_id=user_domain_id, five_x_five_up_id=five_x_five_user_up_id)
    session.add(user_payment_transactions)
    if (user.leads_credits - AMOUNT_CREDITS) < 0:
        if user.is_leads_auto_charging is False:
            logging.info(f"User leads_auto_charging is False")
            return
        user.leads_credits -= AMOUNT_CREDITS
        if user.leads_credits % 100 == 0:
            await publish_rabbitmq_message(
                connection=rmq_connection,
                queue_name=QUEUE_CREDITS_CHARGING,
                message_body={'customer_id': user.customer_id, 'credits': user.leads_credits}
            )
            customer_data = {'customer_id': user.customer_id, 'credits': user.leads_credits}
            logging.info(f"Push to rmq {customer_data}")
    else:
        user.leads_credits -= AMOUNT_CREDITS
    session.flush()
    
async def check_certain_urls(page, suppression_rule):
    if suppression_rule.is_url_certain_activation and suppression_rule.activate_certain_urls:
        page_path = urlparse(page).path.strip('/')
        urls_to_check = suppression_rule.activate_certain_urls.split(', ')

        for url in urls_to_check:
            url_path = urlparse(url.strip()).path.strip('/')
            if (page_path == url_path or 
                page_path.startswith(url_path + '/') or 
                url_path in page_path.split('/')):
                logging.info(f"activate_certain_urls exists: {page}")
                return True

    return False

async def check_activate_based_urls(page, suppression_rule):
    if suppression_rule.is_based_activation and suppression_rule.activate_certain_urls:
        parsed_url = urlparse(page)
        query_params = parse_qs(parsed_url.query)
        activate_based_urls = suppression_rule.activate_based_urls.split(', ')
        if any(url in values for values in query_params.values() for url in activate_based_urls):
            logging.info(f"activate_based_urls exists: {page}")
            return True

    return False

def generate_random_order_detail():
    return {
        'platform_order_id': random.randint(1000, 9999), 
        'total_price': round(random.uniform(10.0, 500.0), 2),
        'currency': random.choice(['USD', 'EUR', 'GBP']),
        'platform_created_at': datetime.now(timezone.utc).isoformat()
    }


async def process_user_data(possible_lead, five_x_five_user: FiveXFiveUser, session: Session, rmq_connection, subscription_service: SubscriptionService, root_user=None):
    global count 
    partner_uid_decoded = urllib.parse.unquote(str(possible_lead['PARTNER_UID']).lower())
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
        logging.info(f"Customer not found {partner_uid_client_id}")
        return
    user, user_domain_id = result
    if not subscription_service.is_user_has_active_subscription(user.id):
        logging.info(f"user has not active subscription {partner_uid_client_id}")
        return
    page = partner_uid_dict.get('current_page')
    if page is None:
        json_headers = json.loads(str(possible_lead['JSON_HEADERS']).lower())
        referer = json_headers.get('referer')[0]
        page = referer
    behavior_type = 'visitor' if not partner_uid_dict.get('action') else partner_uid_dict.get('action')
    if root_user:
        if count % 12 == 0:
            behavior_type = 'visitor'
        elif count % 8 ==  0:
            behavior_type = 'viewed_product'
        elif count % 4 == 0:
            behavior_type = 'product_added_to_cart'

    lead_user = session.query(LeadUser).filter_by(five_x_five_user_id=five_x_five_user.id, domain_id=user_domain_id).first()
    is_first_request = False
    if not lead_user:
        suppression_rule = session.query(SuppressionRule).filter(SuppressionRule.domain_id == user_domain_id).first()
        suppression_list = session.query(SuppressionList).filter(SuppressionList.domain_id == user_domain_id).first()
        suppressions_emails = []
        if suppression_list and suppression_list.total_emails:
            suppressions_emails.extend(suppression_list.total_emails.split(', '))
        if suppression_rule and suppression_rule.suppressions_multiple_emails:
            suppressions_emails.extend(suppression_rule.suppressions_multiple_emails.split(', '))
        suppressions_emails = list(set(suppressions_emails))
        if suppressions_emails:
            emails_to_check = get_all_five_x_user_emails(five_x_five_user.business_email, five_x_five_user.personal_emails, five_x_five_user.additional_personal_emails)
            for email in suppressions_emails:
                if email in emails_to_check:
                    logging.info(f"{email} exists in five_x_five_user")
                    return
        if suppression_rule:
            if suppression_rule.is_url_certain_activation and suppression_rule.activate_certain_urls:
                if await check_certain_urls(page, suppression_rule):
                    return
            
            if suppression_rule.is_based_activation and suppression_rule.activate_certain_urls:
                if await check_activate_based_urls(page, suppression_rule):
                    return

        emails_to_check = get_all_five_x_user_emails(five_x_five_user.business_email, five_x_five_user.personal_emails, five_x_five_user.additional_personal_emails)
        integrations_ids = [integration.id for integration in session.query(UserIntegration).filter(UserIntegration.is_with_suppression == True).all()]
        lead_suppression = session.query(LeadsSupperssion).filter(
            LeadsSupperssion.domain_id == user_domain_id,
            LeadsSupperssion.email.in_(emails_to_check),
            LeadsSupperssion.integration_id.in_(integrations_ids)   
        ).first() is not None
        if lead_suppression:
            logging.info(f"No charging option supressed, skip lead")
            return
        if root_user is None: 
            await process_payment_transaction(session, five_x_five_user.up_id, user_domain_id, user, rmq_connection)
        is_first_request = True
        lead_user = LeadUser(five_x_five_user_id=five_x_five_user.id, user_id=user.id, behavior_type=behavior_type, domain_id=user_domain_id, total_visit=0, avarage_visit_time=0, total_visit_time=0)
        
        session.add(lead_user)
        session.flush()
        channel = await rmq_connection.channel()
        await channel.declare_queue(
            name=QUEUE_DATA_SYNC,
            durable=True
        )
        await publish_rabbitmq_message(rmq_connection, QUEUE_DATA_SYNC, {'domain_id': user_domain_id, 'leads_type': behavior_type, 'lead': {
            'id': lead_user.id,
            'five_x_five_user_id': lead_user.five_x_five_user_id
        }})
    requested_at_str = str(possible_lead['EVENT_DATE'])
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
            lead_users = session.query(LeadUser).filter_by(domain_id=user_domain_id).limit(2).all()
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
    events = [1, 2 , 3, 4, 5, 6, 7, 8, 9, 10]
    random_event = random.choice(events)
    if behavior_type == 'checkout_completed' or random_event % 3 == 0:
        if lead_user.is_converted_sales == False:
                lead_user.is_converted_sales = True
                session.flush()
        order_detail = generate_random_order_detail()
        session.add(LeadOrders(lead_user_id=lead_user.id, 
                               platform_order_id=order_detail.get('platform_order_id'),
                               total_price=order_detail.get('total_price'), 
                               currency_code=order_detail.get('currency'),
                               platform_created_at=order_detail['platform_created_at'], created_at=datetime.now()))
        existing_record = session.query(LeadsUsersOrdered).filter_by(lead_user_id=lead_user.id).first()
        if existing_record:
            existing_record.ordered_at = requested_at
        else:
            new_record = LeadsUsersOrdered(lead_user_id=lead_user.id, ordered_at=requested_at)
            session.add(new_record)
    if  behavior_type == 'product_added_to_cart' or random_event % 2 != 0:
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
    count += 1
    

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
    
    lead_user.total_visit += 1
    lead_user.total_visit_time += 10
    lead_user.avarage_visit_time = int(lead_user.total_visit_time / lead_user.total_visit)
        
    session.flush()
    return leads_visits



def update_last_processed_file(file_key):
    logging.info(f"Writing last processed file {file_key}")
    with open(LAST_PROCESSED_FILE_PATH, "w") as file:
        file.write(file_key)

async def process_files(sts_client, session, channel, root_user):
    credentials = assume_role(os.getenv('S3_ROLE_ARN'), sts_client)
    s3 = boto3.resource('s3', region_name='us-west-2', aws_access_key_id=credentials['AccessKeyId'],
                        aws_secret_access_key=credentials['SecretAccessKey'],
                        aws_session_token=credentials['SessionToken'])

    bucket = s3.Bucket(BUCKET_NAME)
    
    subscription_service = SubscriptionService(
        db=session,
        user_persistence_service=UserPersistence(session),
        plans_persistence=PlansPersistence(session),
    )
    
    try:
        while True:
            try:
                with open(LAST_PROCESSED_FILE_PATH, "r") as file:
                    last_processed_file = file.read().strip()
            except FileNotFoundError:
                last_processed_file = None
                
            if last_processed_file:
                files = bucket.objects.filter(Prefix=FILES_PATH, Marker=last_processed_file)
            else:
                files = bucket.objects.filter(Prefix=FILES_PATH)
            
            file_iterator = iter(files)
            first_file = next(file_iterator)
            match_file_by_hours = re.search(r'y=(\d{4})/m=(\d{2})/d=(\d{2})/h=(\d{2})/', first_file.key)
            year = int(match_file_by_hours.group(1))
            month = int(match_file_by_hours.group(2))
            day = int(match_file_by_hours.group(3))
            hour = int(match_file_by_hours.group(4))
            time_key = f"{FILES_PATH}/y={year}/m={month:02d}/d={day:02d}/h={hour:02d}"
            cookie_sync_by_hour = {}
            files = bucket.objects.filter(Prefix=time_key)
            last_processed_file_name = ''
            for file in files:
                await process_file(bucket, file.key, cookie_sync_by_hour)
                last_processed_file_name = file.key
            await process_table(session, cookie_sync_by_hour, channel, root_user, subscription_service)
            update_last_processed_file(last_processed_file_name)
    except StopIteration:
        pass

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
