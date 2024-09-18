import logging
import os

from persistence.settings_persistence import SettingsPersistence
from models.users import User
from persistence.plans_persistence import PlansPersistence
from sqlalchemy.orm import Session
from schemas.settings import AccountDetailsRequest
logger = logging.getLogger(__name__)
from datetime import datetime, timedelta
from services.jwt_service import get_password_hash,create_access_token
from .sendgrid import SendgridHandler
from enums import SettingStatus, SendgridTemplate
from services.stripe_service import *

OVERAGE_CONTACT = 1

class SettingsService:

    def __init__(self, db: Session, settings_persistence: SettingsPersistence, plan_persistence: PlansPersistence):
        self.settings_persistence = settings_persistence
        self.plan_persistence = plan_persistence


    def get_account_details(self, user):
        user_info = self.settings_persistence.get_account_details(user.get('id'))
        if user_info:
            return {
                'full_name': user_info.full_name,
                'email_address': user_info.email,
                'reset_password_sent_at': user_info.reset_password_sent_at,
                'company_name': user_info.company_name,
                'company_website': user_info.company_website,
                'company_website_visits': user_info.company_website_visits,
                'is_email_confirmed': user_info.is_email_confirmed
            }
            
    def change_account_details(self, user: User, account_details: AccountDetailsRequest):
        changes = {}

        if account_details.account:
            if account_details.account.full_name:
                changes['full_name'] = account_details.account.full_name
            if account_details.account.email_address:
                if user.is_email_confirmed == False:
                    return SettingStatus.EMAIL_NOT_CONFIRMED
                template_id = self.send_grid_persistence_service.get_template_by_alias(
                SendgridTemplate.CHANGE_EMAIL_TEMPLATE.value)
                if not template_id:
                    logger.info("template_id is None")
                    return SettingStatus.FAILED
                message_expiration_time = self.user.get('change_email_sent_at')
                time_now = datetime.now()
                if message_expiration_time is not None:
                    if (message_expiration_time + timedelta(minutes=1)) > time_now:
                        return SettingStatus.RESEND_TOO_SOON
                token_info = {
                    "id": user.get('id'),
                }
                token = create_access_token(token_info)           
                confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/change-email?token={token}&mail={account_details.account.email_address}"
                mail_object = SendgridHandler()
                mail_object.send_sign_up_mail(
                    to_emails=account_details.account.email_address,
                    template_id=template_id,
                    template_placeholder={"full_name": user.get('full_name'), "link": confirm_email_url,
                                            },
                )
                self.settings_persistence.set_reset_email_sent_now(user.get('id'))
                logger.info("Confirmation Email Sent")
            
        if account_details.change_password:
            if account_details.change_password.current_password and account_details.change_password.new_password:
                current_hash_password = get_password_hash(account_details.change_password.current_password)
                if user.password != current_hash_password:
                    return SettingStatus.INCORRECT_PASSWORD
                changes['password'] = get_password_hash(account_details.change_password.new_password)
        
        if account_details.business_info:
            if account_details.business_info.organization_name:
                changes['company_name'] = account_details.business_info.organization_name
            if account_details.business_info.company_website:
                changes['company_website'] = account_details.business_info.company_website
            if account_details.business_info.visits_to_website:
                changes['company_website_visits'] = account_details.business_info.visits_to_website

        if changes:
            self.settings_persistence.change_columns_data_by_userid(changes, user.get('id'))

        return SettingStatus.SUCCESS
    
    def change_email_account_details(self, user: User, email: str):
        changes = {}
        changes['email'] = email

        if changes:
            self.settings_persistence.change_columns_data_by_userid(changes, user.get('id'))
    
    def timestamp_to_date(self, timestamp):
        return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')
            
    def extract_subscription_details(self, customer_id):
        subscription = get_billing_details_by_userid(customer_id)
        plan = subscription['items']['data'][0]['plan']
        subscription_details = {
            'Billing Cycle': f"{plan['interval_count']} {plan['interval']}(s)",
            'Plan Name': determine_plan_name_from_product_id(plan['product']),
            'Domains': 'N/A',
            'Prospect Credits': 'N/A',
            'Overage': OVERAGE_CONTACT,
            'Next Billing Date': self.timestamp_to_date(subscription['current_period_end']),
            'Monthly Total': f"{plan['amount'] / 100:.2f} {plan['currency']}"
        }
        
        return subscription_details
            
    def get_billing(self, user: dict):
        result = {}
        result['card_details'] = get_card_details_by_customer_id(user.get('customer_id'))
        result['billing_details'] = self.extract_subscription_details(user.get('customer_id'))
        result['usages_credits'] = {'leads_credits': user.get('leads_credits'),
                          'plan_leads_credits': self.plan_persistence.get_current_plan(user_id=user.get('id')).leads_credits,
                          'prospect_credits': user.get('prospect_credits')
                          }
        return result
    
    def extract_billing_history(self, customer_id, page, per_page):
        result = []
        billing_history = get_billing_history_by_userid(customer_id=customer_id, page=page, per_page=per_page)
        for billing_data in billing_history:
            billing_hash = {}
            billing_hash['date'] = ''
            billing_hash['invoice_id'] = ''
            billing_hash['pricing_plan'] = ''
            billing_hash['total'] = ''
            billing_hash['status'] = ''
           
    
    def get_billing_history(self, user: dict, page, per_page):
        result = {}
        result['billing_history'] = self.extract_billing_history(user.get('customer_id'), page, per_page)
        return result
