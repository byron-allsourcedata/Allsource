import logging
import os

from persistence.settings_persistence import SettingsPersistence
from models.users import User
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.user_persistence import UserPersistence
from persistence.plans_persistence import PlansPersistence
from services.subscriptions import SubscriptionService
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from .jwt_service import get_password_hash, create_access_token, decode_jwt_data, verify_password
from schemas.settings import AccountDetailsRequest
from enums import VerifyToken
logger = logging.getLogger(__name__)
from datetime import datetime, timedelta
from .sendgrid import SendgridHandler
from enums import SettingStatus, SendgridTemplate, TeamAccessLevel
import hashlib
import json
from services.stripe_service import *

OVERAGE_CONTACT = 1

class SettingsService:

    def __init__(self, settings_persistence: SettingsPersistence, plan_persistence: PlansPersistence, user_persistence: UserPersistence, send_grid_persistence: SendgridPersistence,
                 subscription_service: SubscriptionService):
        self.settings_persistence = settings_persistence
        self.plan_persistence = plan_persistence
        self.subscription_service = subscription_service
        self.user_persistence = user_persistence
        self.send_grid_persistence = send_grid_persistence


    def get_account_details(self, user):
        member_id = None
        if user.get('team_member'):
            member_id = user.get('team_member').get('id')
        user_info = self.settings_persistence.get_account_details(owner_id=user.get('id'), member_id=member_id)
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
            
    def change_account_details(self, user: dict, account_details: AccountDetailsRequest):
        changes = {}
        
        if account_details.business_info:
            if user.get('team_member'):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. Owner only."
                )
            if account_details.business_info.organization_name:
                changes['company_name'] = account_details.business_info.organization_name
            if account_details.business_info.company_website:
                changes['company_website'] = account_details.business_info.company_website
            if account_details.business_info.visits_to_website:
                changes['company_website_visits'] = account_details.business_info.visits_to_website
        
        if account_details.account:
            if user.get('team_member'):
                user_id = user.get('team_member').get('id')
                user = self.user_persistence.get_user_by_id(user_id)
            
            if account_details.account.full_name:
                changes['full_name'] = account_details.account.full_name
            if account_details.account.email_address:
                if user.get('is_email_confirmed') == False:
                    return SettingStatus.EMAIL_NOT_CONFIRMED
                template_id = self.send_grid_persistence.get_template_by_alias(
                SendgridTemplate.CHANGE_EMAIL_TEMPLATE.value)
                if not template_id:
                    logger.info("template_id is None")
                    return SettingStatus.FAILED
                message_expiration_time = user.get('change_email_sent_at')
                time_now = datetime.now()
                if message_expiration_time is not None:
                    if (message_expiration_time + timedelta(minutes=1)) > time_now:
                        return SettingStatus.RESEND_TOO_SOON
                token_info = {
                    "id": user.get('id'),
                }
                token = create_access_token(token_info)           
                confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/authentication/verify-token?token={token}&mail={account_details.account.email_address}"
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
                if not verify_password(account_details.change_password.current_password, user.get('password')):
                    return SettingStatus.INCORRECT_PASSWORD
                changes['password'] = get_password_hash(account_details.change_password.new_password)
                self.settings_persistence.set_reset_password_sent_now(user.get('id'))

        if changes:
            self.settings_persistence.change_columns_data_by_userid(changes, user.get('id'))

        return SettingStatus.SUCCESS
    
    def change_email_account_details(self, token, email: str):
        if email is None:
            SettingStatus.INCORRECT_MAIL
        try:
            data = decode_jwt_data(token)
        except:
            return {'status': VerifyToken.INCORRECT_TOKEN}
        
        check_user_object = self.user_persistence.get_user_by_id(data.get('id'))
        if check_user_object:
            changes = {}
            changes['email'] = email
            self.settings_persistence.change_columns_data_by_userid(changes, data.get('id'))
            token_info = {
                "id": check_user_object.get('id'),
            }
            user_token = create_access_token(token_info)
            return {
                'status': VerifyToken.SUCCESS,
                'user_token': user_token
            }
        return {'status': VerifyToken.INCORRECT_TOKEN}
    
    def get_team_members(self, user: dict):
        result = {}
        team_arr = []
        teams_data = self.settings_persistence.get_team_members_by_userid(user_id=user.get('id'))
        for team_data in teams_data:
            invited, inviter_mail = team_data
            team_info = {
                'email': invited.email,
                'last_sign_in': invited.last_signed_in.strftime('%d.%m.%Y %H:%M') if invited.last_signed_in else None,
                'access_level': invited.team_access_level,
                'invited_by': inviter_mail,
                'added_on': invited.added_on.strftime('%d.%m.%Y %H:%M') if invited.added_on else None
            }
            team_arr.append(team_info)
        result['teams'] = team_arr
        current_plan = self.plan_persistence.get_current_plan(user_id=user.get('id'))
        current_subscription = self.subscription_service.get_subscription_by_user_id(user_id=user.get('id'))
        result['member_limit'] = current_plan.members_limit if current_plan else 0
        result['member_count'] = current_plan.members_limit - current_subscription.members_limit if current_subscription else 0
        return result
            
        
    def get_pending_invations(self, user: dict):
        result = []
        invations_data = self.settings_persistence.get_pending_invations_by_userid(user_id=user.get('id'))
        for invation_data in invations_data:
            team_info = {
                'email': invation_data.mail,
                'role': invation_data.access_level,
                'date': invation_data.date_invited_at.strftime('%d.%m.%Y %H:%M') if invation_data.date_invited_at else None,
                'status': invation_data.status
            }
            result.append(team_info)
        return result
    
    def check_team_invitations_limit(self, user):
        user_limit = self.subscription_service.check_invitation_limit(user_id=user.get('id'))
        if user_limit is False:
            return SettingStatus.INVITATION_LIMIT_REACHED
        return SettingStatus.INVITATION_LIMIT_NOT_REACHED
    
    def get_team_invitations_count(self, user):
        user_limit = self.subscription_service.get_invitation_limit(user_id=user.get('id'))
        return user_limit
    
    def change_user_role(self, user: dict, email, access_level=TeamAccessLevel.READ_ONLY):
        self.settings_persistence.change_user_role(email, access_level)
        return {
                'status': SettingStatus.SUCCESS,
            }
    
    def invite_user(self, user: dict, invite_user, access_level=TeamAccessLevel.READ_ONLY):
        user_limit = self.subscription_service.check_invitation_limit(user_id=user.get('id'))
        if user_limit is False:
            return {
                'status': SettingStatus.INVITATION_LIMIT_REACHED,
                'invitation_count': self.get_team_invitations_count(user)
            }
        if access_level not in TeamAccessLevel:
            access_level = TeamAccessLevel.READ_ONLY.value
        exists_team_member = self.settings_persistence.exists_team_member(user_id=user.get('id'), user_mail=invite_user)
        if exists_team_member:
            return {
                    'status': SettingStatus.ALREADY_INVITED,
                    'invitation_count': self.get_team_invitations_count(user)
                }
        template_id = self.send_grid_persistence.get_template_by_alias(
                SendgridTemplate.TEAM_MEMBERS_TEMPLATE.value)
        if not template_id:
            logger.info("template_id is None")
            return {
                    'status': SettingStatus.FAILED,
                    'invitation_count': self.get_team_invitations_count(user)
                }
        
        md5_token_info = {
                    'id': user.get('id'),
                    'user_teams_mail': invite_user,
                    'salt': os.getenv('SECRET_SALT')
                }
        json_string = json.dumps(md5_token_info, sort_keys=True)
        md5_hash = hashlib.md5(json_string.encode()).hexdigest()
        confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/signup?token={md5_hash}&user_teams_mail={invite_user}"
        mail_object = SendgridHandler()
        mail_object.send_sign_up_mail(
            to_emails=invite_user,
            template_id=template_id,
            template_placeholder={"full_name": invite_user, "link": confirm_email_url, "company_name": user.get('company_name')}
        )
        invited_by_id = user.get('team_member').get('id') if user.get('team_member') else user.get('id')
        self.settings_persistence.save_pending_invations_by_userid(team_owner_id=user.get('id'), user_mail=invite_user, invited_by_id=invited_by_id, access_level=access_level, md5_hash=md5_hash)
        invitation_limit = -1
        self.subscription_service.update_invitation_limit(user_id=user.get('id'), invitation_limit=invitation_limit)
        current_plan = self.plan_persistence.get_current_plan(user_id=user.get('id')).members_limit
        return {
                    'status': SettingStatus.SUCCESS,
                    'invitation_count': current_plan - self.get_team_invitations_count(user)
                }
    
    def change_teams(self, user: dict, teams_details):
        pending_invitation_revoke = teams_details.pending_invitation_revoke
        remove_user = teams_details.remove_user
        if pending_invitation_revoke:
            self.settings_persistence.pending_invitation_revoke(user_id=user.get('id'), mail=pending_invitation_revoke)
        if remove_user:
            mail = user.get('team_member').get('email') if user.get('team_member') else user.get('email')
            result = self.settings_persistence.team_members_remove(user_id=user.get('id'), mail_remove_user=remove_user, mail = mail)
            if result['success'] == False:
                return {'status': result['error']}
                
        invitation_limit = 1
        self.subscription_service.update_invitation_limit(user_id=user.get('id'), invitation_limit=invitation_limit)
        current_plan = self.plan_persistence.get_current_plan(user_id=user.get('id')).members_limit
        return {
                    'status': SettingStatus.SUCCESS,
                    'invitation_count': current_plan - self.get_team_invitations_count(user)
                }
        
        
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
        result['usages_credits'] = {
                        'leads_credits': user.get('leads_credits'),
                        'plan_leads_credits': self.plan_persistence.get_current_plan(user_id=user.get('id')).leads_credits,
                        'prospect_credits': user.get('prospect_credits')
                        }
        return result
    
    def extract_billing_history(self, customer_id, page, per_page):
        result = []
        billing_history, count, max_page = get_billing_history_by_userid(customer_id=customer_id, page=page, per_page=per_page)
        for billing_data in billing_history:
            billing_hash = {}
            line_item = billing_data['lines']
            billing_hash['date'] = self.timestamp_to_date(line_item['data'][0]['plan']['created'])
            billing_hash['invoice_id'] = line_item['data'][0]['invoice']
            billing_hash['pricing_plan'] = determine_plan_name_from_product_id(line_item['data'][0]['plan']['product'])
            billing_hash['total'] = billing_data['subtotal'] / 100
            billing_hash['status'] = billing_data['status']
            
            status = billing_data['status']
            if status == "paid":
                billing_hash['status'] = "Successful"
            elif status == "uncollectible":
                billing_hash['status'] = "Decline"
            else:
                billing_hash['status'] = "Failed"
            
            result.append(billing_hash)
        return result, count, max_page
           
    
    def get_billing_history(self, user: dict, page, per_page):
        result = {}
        result['billing_history'], result['count'], result['max_page'] = self.extract_billing_history(user.get('customer_id'), page, per_page)
        return result
    
    def add_card(self, user: dict, payment_method_id):
        return add_card_to_customer(user.get('customer_id'), payment_method_id)
    
    def delete_card(self, payment_method_id):
        return detach_card_from_customer(payment_method_id)
    
    def default_card(self, user: dict, payment_method_id):
        return set_default_card_for_customer(user.get('customer_id'), payment_method_id)
    
    def get_subscription_plan(self, user: dict):
        result = {}
        current_plan = self.plan_persistence.get_current_plan(user_id=user.get('id'))
        current_plan = {
            'current_plan_id': current_plan.id,
            'current_plan_name': current_plan.title
        }
        result['current_plan'] = current_plan
        return result
        
        
    def get_api_details(self, user):
        get_api_details = self.settings_persistence.get_api_details(user.get('id'))
        return [
            {
                "api_key": result[0],
                "description": result[1],
                "created_date": result[2],
                "name": result[3],
                "id": result[4],
                "api_id": result[5],
                "last_used_at": result[6]
            }
            for result in get_api_details
        ]
    
    def delete_api_details(self, user, api_keys_request):
        self.settings_persistence.delete_data_api_details(user_id=user.get('id'), api_keys_id=api_keys_request.id)
        return SettingStatus.SUCCESS
    
    def insert_api_details(self, user, api_keys_request):
        self.settings_persistence.insert_data_api_details(user_id=user.get('id'), api_keys_request=api_keys_request)
        return SettingStatus.SUCCESS
    
    
    def change_api_details(self, user, api_keys_request):
        changes = {}

        if api_keys_request.api_key:
            changes['api_key'] = api_keys_request.api_key
            
        if api_keys_request.api_id:
            changes['api_id'] = api_keys_request.api_id
        
        if api_keys_request.name:
            changes['name'] = api_keys_request.name
        if api_keys_request.description:
            changes['description'] = api_keys_request.description

        if changes:
            self.settings_persistence.change_columns_data_api_details(changes=changes, user_id=user.get('id'), api_keys_id=api_keys_request.id)
        else:
            changes['last_used_at'] = datetime.now()
            self.settings_persistence.change_columns_data_api_details(changes=changes, user_id=user.get('id'), api_keys_id=api_keys_request.id)
        return SettingStatus.SUCCESS