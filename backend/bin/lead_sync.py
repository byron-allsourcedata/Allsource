import asyncio
import json
import logging
import os
import random
import sys
import time
import traceback
import urllib.parse
import regex

import pytz
from dateutil.relativedelta import relativedelta

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from utils import normalize_url, get_url_params_list
from enums import NotificationTitles, PlanAlias
from persistence.leads_persistence import LeadsPersistence
from persistence.notification import NotificationPersistence
from models.plans import SubscriptionPlan
from utils import create_company_alias
from models.five_x_five_cookie_sync_file import FiveXFiveCookieSyncFile
from urllib.parse import urlparse, parse_qs
from models.leads_requests import LeadsRequests
from models.users_domains import UserDomains
from models.suppression_rule import SuppressionRule
from models.lead_company import LeadCompany
from models.leads_users_companies import LeadUserCompany
from models.state import States
from models.five_x_five_locations import FiveXFiveLocations
from models.leads_users_added_to_cart import LeadsUsersAddedToCart
from models.leads_users_ordered import LeadsUsersOrdered
from models.leads_visits import LeadsVisits
from models.five_x_five_hems import FiveXFiveHems
from models.suppressions_list import SuppressionList
from models.users_unlocked_5x5_users import UsersUnlockedFiveXFiveUser
from models.integrations.suppressed_contact import SuppressedContact
from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker, Session
from models.five_x_five_users import FiveXFiveUser
from models.leads_users import LeadUser
from models.users import Users
from models.leads_orders import LeadOrders
from models.integrations.leads_suppresions import LeadsSupperssion
from dotenv import load_dotenv
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime, timedelta, timezone
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
from models.integrations.users_domains_integrations import UserIntegration
from dependencies import (SubscriptionService, UserPersistence, PlansPersistence, ReferralService, PartnersPersistence, ReferralDiscountCodesPersistence, StripeService, ReferralPayoutsPersistence, ReferralUserPersistence)

load_dotenv()


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )


LAST_PROCESSED_FILE_PATH = 'tmp/last_processed_leads_sync.txt'
AMOUNT_CREDITS = 1
QUEUE_CREDITS_CHARGING = 'credits_charging'
EMAIL_NOTIFICATIONS = 'email_notifications'
UNLIMITED = -1

ROOT_BOT_CLIENT_EMAIL = 'master-demo@maximiz.ai'
ROOT_BOT_CLIENT_DOMAIN = 'demo.com'

count = 0


def group_requests_by_date(request_row, groupped_requests):
    key = f"{request_row.event_date}_{request_row.ip}"
    if key not in groupped_requests:
        groupped_requests[key] = []
    lead_info = {
        'TROVO_ID:': request_row.trovo_id,
        'PARTNER_ID': request_row.partner_id,
        'PARTNER_UID': request_row.partner_uid,
        'SHA256_LOWER_CASE': request_row.sha256_lower_case,
        'IP': request_row.ip,
        'JSON_HEADERS': request_row.json_headers,
        'EVENT_DATE': request_row.event_date,
        'UP_ID': request_row.up_id
    }
    groupped_requests[key].append(lead_info)


def get_all_five_x_user_emails(business_email, personal_emails, additional_personal_emails):
    emails = set()
    if business_email:
        emails.update(business_email.split(', '))
    if personal_emails:
        emails.update(personal_emails.split(', '))
    if additional_personal_emails:
        emails.update(additional_personal_emails.split(', '))
    return list(emails)


async def process_table(session, states_dict, groupped_requests, rabbitmq_connection, subscription_service, leads_persistence,
                        notification_persistence,
                        root_user=None):
    for key, possible_leads in groupped_requests.items():
        for possible_lead in reversed(possible_leads):
            up_id = possible_lead['UP_ID']
            if up_id is None or up_id == 'None':
                up_ids = session.query(FiveXFiveHems.up_id).filter(
                    FiveXFiveHems.sha256_lc_hem == str(possible_lead['SHA256_LOWER_CASE'])).all()
                if len(up_ids) == 0:
                    logging.debug(f"Not found SHA256_LOWER_CASE {possible_lead['SHA256_LOWER_CASE']}")
                    continue
                elif len(up_ids) > 1:
                    logging.debug(f"Too many SHA256_LOWER_CASEs {possible_lead['SHA256_LOWER_CASE']}")
                    continue
                up_id = up_ids[0][0]
                logging.info(f"Lead found by SHA256_LOWER_CASE {possible_lead['SHA256_LOWER_CASE']}")
            if up_id is not None and up_id != 'None':
                five_x_five_user = session.query(FiveXFiveUser).filter(
                    FiveXFiveUser.up_id == str(up_id).lower()).first()
                if five_x_five_user:
                    logging.info(f"Lead found by UP_ID {up_id}")
                    await process_user_data(states_dict, possible_lead, five_x_five_user, session, rabbitmq_connection,
                                            subscription_service, leads_persistence, notification_persistence,
                                            None)
                    if root_user:
                        await process_user_data(states_dict, possible_lead, five_x_five_user, session, rabbitmq_connection,
                                                subscription_service, leads_persistence, notification_persistence,
                                                root_user)
                    break
                else:
                    logging.warning(f"Not found by UP_ID {up_id}")


async def handle_payment_notification(user, notification_persistence, plan_leads_credits, leads_credits,
                                      plan_lead_credit_price):
    credit_usage_percentage = round(((plan_leads_credits - leads_credits) / plan_leads_credits) * 100, 2)
    if 80 == credit_usage_percentage or credit_usage_percentage == 90:
        account_notification = notification_persistence.get_account_notification_by_title(
            NotificationTitles.CONTACT_LIMIT_APPROACHING.value)
        notification_text = account_notification.text.format(int(credit_usage_percentage), plan_lead_credit_price)
        queue_name = f'sse_events_{str(user.id)}'
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()

        save_account_notification = notification_persistence.save_account_notification(user.id, account_notification.id,
                                                                                       f"{credit_usage_percentage}, {plan_lead_credit_price}")

        await publish_rabbitmq_message(
            connection=connection,
            queue_name=queue_name,
            message_body={'notification_text': notification_text, 'notification_id': save_account_notification.id}
        )


async def handle_inactive_leads_notification(user, leads_persistence, notification_persistence):
    inactive_leads_user = leads_persistence.get_inactive_leads_user(user_id=user.id)
    if len(inactive_leads_user) > 0 and len(inactive_leads_user) % 10 == 0:
        account_notification = notification_persistence.get_account_notification_by_title(
            NotificationTitles.PLAN_LIMIT_EXCEEDED.value)
        notification_text = account_notification.text.format(len(inactive_leads_user))

        queue_name = f'sse_events_{str(user.id)}'
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        save_account_notification = notification_persistence.save_account_notification(user.id, account_notification.id,
                                                                                       len(inactive_leads_user))
        await publish_rabbitmq_message(
            connection=connection,
            queue_name=queue_name,
            message_body={'notification_text': notification_text, 'notification_id': save_account_notification.id}
        )


async def notify_missing_plan(notification_persistence, user):
    account_notification = notification_persistence.get_account_notification_by_title(
        NotificationTitles.CHOOSE_PLAN.value)
    queue_name = f'sse_events_{str(user.id)}'
    rabbitmq_connection = RabbitMQConnection()
    connection = await rabbitmq_connection.connect()
    save_account_notification = notification_persistence.save_account_notification(user.id, account_notification.id)

    await publish_rabbitmq_message(
        connection=connection,
        queue_name=queue_name,
        message_body={'notification_text': account_notification.text,
                      'notification_id': save_account_notification.id}
    )


async def process_payment_unlocked_five_x_five_user(session, five_x_five_user_up_id, user_domain_id, user, lead_user,
                                      leads_persistence, notification_persistence, plan_leads_credits,
                                      plan_lead_credit_price):
    users_unlocked_five_x_five_user = session.query(UsersUnlockedFiveXFiveUser).filter(
        UsersUnlockedFiveXFiveUser.five_x_five_up_id == str(five_x_five_user_up_id),
        UsersUnlockedFiveXFiveUser.domain_id == user_domain_id
    ).first()
    if users_unlocked_five_x_five_user:
        logging.debug(f"users_unlocked_five_x_five_user is already exists with id = {users_unlocked_five_x_five_user.id}")
        return

    if plan_leads_credits != UNLIMITED and user.leads_credits - AMOUNT_CREDITS < 0:
        if user.is_leads_auto_charging is False:
            await handle_inactive_leads_notification(user, leads_persistence, notification_persistence)
            logging.debug(f"User leads_auto_charging is False")
        lead_user.is_active = False
        return
    
    users_unlocked_five_x_five_user = UsersUnlockedFiveXFiveUser(user_id=user.id,
                                                          amount_credits=AMOUNT_CREDITS,
                                                          domain_id=user_domain_id,
                                                          five_x_five_up_id=five_x_five_user_up_id)

    session.add(users_unlocked_five_x_five_user)
    if plan_leads_credits != UNLIMITED:
        user.leads_credits -= AMOUNT_CREDITS
        await handle_payment_notification(user, notification_persistence, plan_leads_credits, user.leads_credits,
                                        plan_lead_credit_price)
    session.flush()


def check_certain_urls(page, suppression_rule):
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


def check_activate_based_urls(page, suppression_rule):
    if suppression_rule.is_based_activation and suppression_rule.activate_based_urls:
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

def process_root_user_behavior(lead_user, behavior_type, requested_at, session):
    events = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    random_event = random.choice(events)

    if behavior_type == 'checkout_completed' or random_event % 4 == 0:
        if not lead_user.is_converted_sales:
            lead_user.is_converted_sales = True
            session.flush()

        order_detail = generate_random_order_detail()
        session.add(LeadOrders(
            lead_user_id=lead_user.id,
            platform_order_id=order_detail.get('platform_order_id'),
            total_price=order_detail.get('total_price'),
            currency_code=order_detail.get('currency'),
            platform_created_at=order_detail['platform_created_at'],
            created_at=datetime.now()
        ))

        existing_record = session.query(LeadsUsersOrdered).filter_by(lead_user_id=lead_user.id).first()
        if existing_record:
            existing_record.ordered_at = requested_at
        else:
            new_record = LeadsUsersOrdered(lead_user_id=lead_user.id, ordered_at=requested_at)
            session.add(new_record)

    if behavior_type == 'product_added_to_cart' or random_event % 3 == 0:
        existing_record = session.query(LeadsUsersAddedToCart).filter_by(lead_user_id=lead_user.id).first()
        if existing_record:
            existing_record.added_at = requested_at
        else:
            new_record = LeadsUsersAddedToCart(lead_user_id=lead_user.id, added_at=requested_at)
            session.add(new_record)


async def dispatch_leads_to_rabbitmq(session, user, rabbitmq_connection, plan_id):
    user_ids = (
        session.query(LeadUser)
        .filter_by(user_id=user.id, is_active=False)
        .all()
    )

    if user_ids and len(user_ids) % 100 == 0:
        await publish_rabbitmq_message(
            connection=rabbitmq_connection,
            queue_name=QUEUE_CREDITS_CHARGING,
            message_body={
                'customer_id': user.customer_id,
                'plan_id': plan_id
            }
        )

        logging.info(f"Push to RMQ: {{'customer_id': {user.customer_id}, 'plan_id': {plan_id}")

def get_five_x_five_location(session, company_city, company_state, states_dict):
    city = company_city
    state = company_state
    state_id = None
    if city is None and state is None:
        return None
    
    if city:
        city = city.lower()
    if state:
        state = state.lower()
        state_id = states_dict.get(state)
    
    if not state_id:
        return None
        
    location = session.query(FiveXFiveLocations).filter(
        FiveXFiveLocations.country == 'us',
        FiveXFiveLocations.city == city,
        FiveXFiveLocations.state_id == state_id
    ).first()
    if not location:
        return None
    return location.id

def get_company(session: Session, five_x_five_user: FiveXFiveUser):
    if five_x_five_user.company_name:
        company_name = five_x_five_user.company_name.strip()
        alias = regex.sub(r'[\p{Z}\s]+', ' ', company_name)
        alias = company_name.replace(" ", "_")
        alias = alias.lower()
        return session.query(LeadCompany).filter_by(alias=alias).first()

def create_lead_user_company(session, company_id, lead_user_id):
    lead_company = LeadUserCompany(
                            lead_company_id=company_id,
                            first_lead_user_id=lead_user_id
                        )
    session.add(lead_company)
    session.flush()
 
def create_company(session: Session, five_x_five_user: FiveXFiveUser, states_dict: dict):
    alias = create_company_alias(five_x_five_user.company_name)
    five_x_five_location_id = get_five_x_five_location(session, five_x_five_user.company_city, five_x_five_user.company_state, states_dict)
    lead_company = LeadCompany(
                        name=five_x_five_user.company_name,
                        alias=alias,
                        domain=five_x_five_user.company_domain,
                        phone=five_x_five_user.company_phone,
                        sic=five_x_five_user.company_sic,
                        address=five_x_five_user.company_address,
                        five_x_five_location_id=five_x_five_location_id,
                        zip=five_x_five_user.company_zip,
                        linkedin_url=five_x_five_user.company_linkedin_url,
                        revenue=five_x_five_user.company_revenue,
                        employee_count=five_x_five_user.company_employee_count,
                        last_updated=five_x_five_user.company_last_updated,
                        description=five_x_five_user.company_description,
                        primary_industry=five_x_five_user.primary_industry
                    )
    session.add(lead_company)
    session.flush()
    return lead_company

def get_first_lead_user_by_company_and_domain(session, company_id, domain_id):
    return session.query(LeadUser).filter(LeadUser.domain_id==domain_id, LeadUser.company_id==company_id).first()

async def process_user_data(states_dict, possible_lead, five_x_five_user: FiveXFiveUser, session: Session, rabbitmq_connection,
                            subscription_service: SubscriptionService, leads_persistence: LeadsPersistence,
                            notification_persistence: NotificationPersistence,
                            root_user=None):
    global count
    partner_uid_decoded = urllib.parse.unquote(str(possible_lead['PARTNER_UID']).lower())
    partner_uid_dict = json.loads(partner_uid_decoded)
    partner_uid_client_id = partner_uid_dict.get('client_id')
    page = partner_uid_dict.get('current_page')
    puci = str(partner_uid_client_id)
    if puci == '2e23d46218de1cce79dc14427bf97a6484c0c729757007988f6f0dcf17a144a8':
        puci = 'edf1a2e46075f1b2ae6caddad58fac17c702f6a17373a7a0067583c0d2ac34cb'
    if root_user:
        result = root_user
    else:
        result = session.query(Users, UserDomains) \
            .join(UserDomains, UserDomains.user_id == Users.id) \
            .filter(UserDomains.data_provider_id == puci) \
            .first()
    if not result:
        logging.info(f"Customer not found {partner_uid_client_id}")
        return
    user, user_domain = result
    if not user_domain.is_enable and not root_user:
        logging.info(f"Domain is not enabled: {user_domain.id}")
        return
    user_domain_id = user_domain.id
    if not subscription_service.is_allow_add_lead(user.id):
        await notify_missing_plan(notification_persistence, user)
        logging.info(f"User not active: partner_uid_client_id {partner_uid_client_id}")
        return

    if page is None:
        json_headers = json.loads(str(possible_lead['JSON_HEADERS']).lower())
        referer = json_headers.get('referer')[0]
        page = referer
    behavior_type = 'visitor' if not partner_uid_dict.get('action') else partner_uid_dict.get('action')
    if root_user:
        if count % 12 == 0:
            behavior_type = 'visitor'
        elif count % 8 == 0:
            behavior_type = 'viewed_product'
        elif count % 4 == 0:
            behavior_type = 'product_added_to_cart'

    lead_user = session.query(LeadUser).filter_by(five_x_five_user_id=five_x_five_user.id,
                                                  domain_id=user_domain_id).first()
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
            emails_to_check = get_all_five_x_user_emails(five_x_five_user.business_email,
                                                         five_x_five_user.personal_emails,
                                                         five_x_five_user.additional_personal_emails)
            for email in suppressions_emails:
                if email in emails_to_check:
                    suppressed_contact = SuppressedContact(
                        five_x_five_user_id=five_x_five_user.id,
                        domain_id=user_domain_id,
                        suppression_type='email',
                        suppression_detail=email,
                        created_at=datetime.now()
                    )
                    session.add(suppressed_contact)
                    session.commit() 
                    logging.info(f"Suppression email {email}")
                    return
        if suppression_rule:
            if suppression_rule.is_url_certain_activation and suppression_rule.activate_certain_urls:
                if check_certain_urls(page, suppression_rule):
                    suppressed_contact = SuppressedContact(
                        five_x_five_user_id=five_x_five_user.id,
                        domain_id=user_domain_id,
                        suppression_type='url',
                        suppression_detail=normalize_url(page),
                        created_at=datetime.now()
                    )
                    session.add(suppressed_contact)
                    session.commit() 
                    return

            if suppression_rule.is_based_activation and suppression_rule.activate_certain_urls:
                if check_activate_based_urls(page, suppression_rule):
                    suppressed_contact = SuppressedContact(
                        five_x_five_user_id=five_x_five_user.id,
                        domain_id=user_domain_id,
                        suppression_type='url',
                        suppression_detail=normalize_url(page),
                        created_at=datetime.now()
                    )
                    session.add(suppressed_contact)
                    session.commit() 
                    return

        emails_to_check = get_all_five_x_user_emails(five_x_five_user.business_email, five_x_five_user.personal_emails,
                                                     five_x_five_user.additional_personal_emails)
        integrations_ids = [integration.id for integration in
                            session.query(UserIntegration).filter(UserIntegration.is_with_suppression == True).all()]
        lead_suppression = session.query(LeadsSupperssion).filter(
            LeadsSupperssion.domain_id == user_domain_id,
            LeadsSupperssion.email.in_(emails_to_check),
            LeadsSupperssion.integration_id.in_(integrations_ids)
        ).first() is not None
        if lead_suppression:
            suppressed_contact = SuppressedContact(
                five_x_five_user_id=five_x_five_user.id,
                domain_id=user_domain_id,
                suppression_type='lead',
                suppression_detail=None,  
                created_at=datetime.now()
            )
            session.add(suppressed_contact)
            session.commit() 
            logging.info('Charging option suppressed, skip lead')
            return

        is_first_request = True
        lead_user = LeadUser(five_x_five_user_id=five_x_five_user.id, user_id=user.id, behavior_type=behavior_type,
                             domain_id=user_domain_id, total_visit=0, avarage_visit_time=0, total_visit_time=0)
        
        session.add(lead_user)
        session.flush()
        if five_x_five_user.company_name:
            company = get_company(session, five_x_five_user)
            if company:
                if not get_first_lead_user_by_company_and_domain(session, company.id, lead_user.domain_id):
                    create_lead_user_company(session, company.id, lead_user.id)
            else:
                company = create_company(session, five_x_five_user, states_dict)
                create_lead_user_company(session, company.id, lead_user.id)
            lead_user.company_id = company.id
            
        user_subscription = subscription_service.get_user_subscription(user.id)
        if user_subscription:
            subscription_plan = session.query(SubscriptionPlan).filter(
                SubscriptionPlan.id == user_subscription.plan_id).first()
            await process_payment_unlocked_five_x_five_user(session, five_x_five_user.up_id, user_domain_id, user,
                                                lead_user, leads_persistence, notification_persistence,
                                                subscription_plan.leads_credits, subscription_plan.lead_credit_price)

            if not lead_user.is_active and user.is_leads_auto_charging:
                await dispatch_leads_to_rabbitmq(session=session, user=user, rabbitmq_connection=rabbitmq_connection,
                                                plan_id=user_subscription.plan_id)
        else:
            lead_user.is_active = False

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
        leads_result = session.query(LeadsRequests, LeadsVisits.id, LeadsVisits.behavior_type,
                                     LeadsVisits.full_time_sec) \
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
        process_leads_requests(requested_at=requested_at, page=page, leads_requests=leads_requests, visit_id=visit_id,
                               lead_visit_full_time_sec=lead_visit_full_time_sec, session=session,
                               behavior_type=lead_behavior_type, lead_user=lead_user)
    else:
        lead_visit_id = add_new_leads_visits(visited_datetime=requested_at, lead_id=lead_user.id, session=session,
                                             behavior_type=behavior_type, lead_user=lead_user).id
        if is_first_request == True:
            lead_user.first_visit_id = lead_visit_id
            session.flush()
            lead_users = session.query(LeadUser).filter_by(user_id=user.id).limit(2).all()
            if len(lead_users) == 1:
                subscription_result = subscription_service.get_user_subscription_with_trial_status(user.id)
                if subscription_result['is_artificial_status'] and not subscription_result['subscription'].plan_end and subscription_result['alias'] != PlanAlias.PARTNERS.value:
                    if subscription_result['artificial_trial_days']:
                        date_now = datetime.now(timezone.utc)
                        subscription_result['subscription'].plan_start = date_now.replace(tzinfo=None)
                        subscription_result['subscription'].plan_end = (date_now + relativedelta(
                            days=subscription_result['artificial_trial_days'])).replace(tzinfo=None)
                        session.flush()
            if not user_domain.is_pixel_installed:
                domain_lead_users = session.query(LeadUser).filter_by(domain_id=user_domain.id).limit(2).all()
                if len(domain_lead_users) == 1:
                    user_domain.is_pixel_installed = True
                    session.flush()
        else:
            if not lead_user.is_returning_visitor:
                lead_user.is_returning_visitor = True
                session.flush()
    if root_user:
        process_root_user_behavior(lead_user, behavior_type, requested_at, session)
    else:
        if behavior_type == 'checkout_completed':
            if lead_user.is_converted_sales == False:
                lead_user.is_converted_sales = True
                session.flush()
            order_detail = partner_uid_dict.get('order_detail')
            session.add(LeadOrders(lead_user_id=lead_user.id,
                                   platform_order_id=order_detail.get('platform_order_id'),
                                   total_price=order_detail.get('total_price'),
                                   currency_code=order_detail.get('currency'),
                                   platform_created_at=order_detail.get('platform_created_at'), created_at=datetime.now()))
            existing_record = session.query(LeadsUsersOrdered).filter_by(lead_user_id=lead_user.id).first()
            if existing_record:
                existing_record.ordered_at = requested_at
            else:
                new_record = LeadsUsersOrdered(lead_user_id=lead_user.id, ordered_at=requested_at)
                session.add(new_record)
        if behavior_type == 'product_added_to_cart':
            existing_record = session.query(LeadsUsersAddedToCart).filter_by(lead_user_id=lead_user.id).first()
            if existing_record:
                existing_record.added_at = requested_at
            else:
                new_record = LeadsUsersAddedToCart(lead_user_id=lead_user.id, added_at=requested_at)
                session.add(new_record)
    
    prev_leads_requests = (
        session.query(LeadsRequests)
        .filter_by(visit_id=lead_visit_id)
        .order_by(desc(LeadsRequests.id))
        .first()
    )
    if prev_leads_requests:
        total_sec = (requested_at - prev_leads_requests.requested_at).total_seconds()
        if total_sec > 0:
            prev_leads_requests.spent_time_sec = total_sec

    lead_request = insert(LeadsRequests).values(
        lead_id=lead_user.id, page_parameters = get_url_params_list(page),
        page=normalize_url(page), requested_at=requested_at, visit_id=lead_visit_id, spent_time_sec=10
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


def process_leads_requests(requested_at, page, leads_requests, visit_id, lead_visit_full_time_sec, session: Session,
                           behavior_type, lead_user):
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
    with open(LAST_PROCESSED_FILE_PATH, "w") as file:
        file.write(file_key)


async def process_files(session, rabbitmq_connection, root_user):
    subscription_service = SubscriptionService(
        db=session,
        user_persistence_service=UserPersistence(session),
        plans_persistence=PlansPersistence(session),
        referral_service=ReferralService(referral_persistence_discount_code_service=ReferralDiscountCodesPersistence(session), user_persistence=UserPersistence(session), referral_persistence_service=ReferralUserPersistence(session), stripe_service=StripeService(), referral_payouts_persistence=ReferralPayoutsPersistence(session)),
        partners_persistence=PartnersPersistence(session)
    )
    notification_persistence = NotificationPersistence(
        db=session
    )

    leads_persistence = LeadsPersistence(
        db=session
    )
    
    states = session.query(States).all()
    states_dict = {state.state_code: state.id for state in states}

    while True:
        try:
            with open(LAST_PROCESSED_FILE_PATH, "r") as file:
                last_processed_file = file.read().strip()
        except FileNotFoundError:
            last_processed_file = None
    
        five_x_five_cookie_sync_event_date = session.query(FiveXFiveCookieSyncFile.event_date)
    
        if last_processed_file:
            if '.' in last_processed_file:
                date_object = datetime.strptime(last_processed_file, '%Y-%m-%d %H:%M:%S.%f')
            else:
                date_object = datetime.strptime(last_processed_file, '%Y-%m-%d %H:%M:%S')
            five_x_five_cookie_sync_event_date = five_x_five_cookie_sync_event_date.filter(
                FiveXFiveCookieSyncFile.event_date > date_object)
    
        five_x_five_cookie_sync_file = five_x_five_cookie_sync_event_date.order_by(
            FiveXFiveCookieSyncFile.event_date)
        event_date = five_x_five_cookie_sync_file.limit(1).scalar()
        if not event_date:
            logging.info('No data in 5x5 files yet')
            return
    
        new_dt = event_date + timedelta(hours=1)
    
        cookie_sync_files_query = session.query(FiveXFiveCookieSyncFile).filter(
            FiveXFiveCookieSyncFile.event_date.between(event_date, new_dt)
        )
        cookie_sync_files = cookie_sync_files_query.order_by(FiveXFiveCookieSyncFile.event_date).all()
        last_processed_file_name = ''
        groupped_requests = {}
        for request_row in cookie_sync_files:
            group_requests_by_date(request_row, groupped_requests)
            last_processed_file_name = request_row.event_date
        if not groupped_requests:
            logging.info('All 5x5 files processed')
            return
        await process_table(session, states_dict, groupped_requests, rabbitmq_connection, subscription_service,
                            leads_persistence,
                            notification_persistence, None)
        if root_user:
            await process_table(session, states_dict,groupped_requests, rabbitmq_connection, subscription_service,
                                leads_persistence,
                                notification_persistence, root_user)
        logging.debug(f"Last processed event time {str(last_processed_file_name)}")
        update_last_processed_file(str(last_processed_file_name))


async def main():
    engine = create_engine(
        f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}", pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    session = Session()
    rabbitmq_connection = RabbitMQConnection()
    connection = await rabbitmq_connection.connect()
    channel = await connection.channel()
    log_level = logging.INFO
    if len(sys.argv) > 1:
        arg = sys.argv[1].upper()
        if arg == 'DEBUG':
            log_level = logging.DEBUG
        elif arg == 'INFO':
            log_level = logging.INFO
        else:
            sys.exit(1)

    setup_logging(log_level)

    await channel.declare_queue(
        name=QUEUE_CREDITS_CHARGING,
        durable=True,
        arguments={
            'x-consumer-timeout': 3600000,
        }
    )

    await channel.declare_queue(
        name=EMAIL_NOTIFICATIONS,
        durable=True
    )

    logging.info("Started")
    result = session.query(Users, UserDomains) \
        .join(UserDomains, UserDomains.user_id == Users.id) \
        .filter((UserDomains.domain == ROOT_BOT_CLIENT_DOMAIN) & (Users.email == ROOT_BOT_CLIENT_EMAIL)) \
        .first()
    while True:
        try:
            await process_files(session=session, rabbitmq_connection=connection, root_user=result)
            await connection.close()
            logging.info('Sleeping for 10 minutes...')
            time.sleep(60 * 10)
            connection = await rabbitmq_connection.connect()
            logging.info("Reconnected to RabbitMQ")
        except Exception as e:
            session.rollback()
            logging.error(f"An error occurred: {str(e)}")
            traceback.print_exc()
            time.sleep(30)

asyncio.run(main())
