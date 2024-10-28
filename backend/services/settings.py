import logging
import os

from persistence.leads_persistence import LeadsPersistence
from persistence.settings_persistence import SettingsPersistence
from models.users import User
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.user_persistence import UserPersistence
from persistence.plans_persistence import PlansPersistence
from services.subscriptions import SubscriptionService
from services.domains import UserDomainsService
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


class SettingsService:

    def __init__(self, settings_persistence: SettingsPersistence, plan_persistence: PlansPersistence,
                 user_persistence: UserPersistence, send_grid_persistence: SendgridPersistence,
                 subscription_service: SubscriptionService, user_domains_service: UserDomainsService,
                 lead_persistence: LeadsPersistence):
        self.settings_persistence = settings_persistence
        self.plan_persistence = plan_persistence
        self.subscription_service = subscription_service
        self.user_persistence = user_persistence
        self.send_grid_persistence = send_grid_persistence
        self.user_domains_service = user_domains_service
        self.lead_persistence = lead_persistence

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
                'last_sign_in': invited.last_signed_in.strftime('%b %d, %Y') if invited.last_signed_in else None,
                'access_level': invited.team_access_level,
                'invited_by': inviter_mail,
                'added_on': invited.added_on.strftime('%b %d, %Y') if invited.added_on else None
            }
            team_arr.append(team_info)
        result['teams'] = team_arr
        current_subscription = self.plan_persistence.get_user_subscription(user_id=user.get('id'))
        member_limit = current_subscription.members_limit
        member_count = len(self.user_persistence.get_team_members(user_id=user.get('id')))
        result['member_limit'] = member_limit if current_subscription else 0
        result['member_count'] = member_count + 1 if current_subscription else 0
        return result

    def get_pending_invations(self, user: dict):
        result = []
        invations_data = self.settings_persistence.get_pending_invations_by_userid(user_id=user.get('id'))
        for invation_data in invations_data:
            team_info = {
                'email': invation_data.mail,
                'role': invation_data.access_level,
                'date': invation_data.date_invited_at.strftime('%b %d, %Y') if invation_data.date_invited_at else None,
                'status': invation_data.status
            }
            result.append(team_info)
        return result

    def check_team_invitations_limit(self, user):
        user_limit = self.subscription_service.check_invitation_limit(user_id=user.get('id'))
        if user_limit is False:
            return SettingStatus.INVITATION_LIMIT_REACHED
        return SettingStatus.INVITATION_LIMIT_NOT_REACHED

    def change_user_role(self, user: dict, email, access_level=TeamAccessLevel.READ_ONLY):
        self.settings_persistence.change_user_role(email, access_level)
        return {
            'status': SettingStatus.SUCCESS,
        }

    def invite_user(self, user: dict, invite_user, access_level=TeamAccessLevel.READ_ONLY):
        user_limit = self.subscription_service.check_invitation_limit(user_id=user.get('id'))
        if user_limit is False:
            return {
                'status': SettingStatus.INVITATION_LIMIT_REACHED
            }
        if access_level not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value,
                                TeamAccessLevel.STANDARD.value, TeamAccessLevel.READ_ONLY.value}:
            raise HTTPException(status_code=500, detail={'error': SettingStatus.INVALID_ACCESS_LEVEL.value})
        exists_team_member = self.settings_persistence.exists_team_member(user_id=user.get('id'), user_mail=invite_user)
        if exists_team_member:
            return {
                'status': SettingStatus.ALREADY_INVITED
            }
        template_id = self.send_grid_persistence.get_template_by_alias(
            SendgridTemplate.TEAM_MEMBERS_TEMPLATE.value)
        if not template_id:
            logger.info("template_id is None")
            return {
                'status': SettingStatus.FAILED
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
            template_placeholder={"full_name": invite_user, "link": confirm_email_url,
                                  "company_name": user.get('company_name')}
        )
        invited_by_id = user.get('team_member').get('id') if user.get('team_member') else user.get('id')
        self.settings_persistence.save_pending_invations_by_userid(team_owner_id=user.get('id'), user_mail=invite_user,
                                                                   invited_by_id=invited_by_id,
                                                                   access_level=access_level, md5_hash=md5_hash)
        return {
            'status': SettingStatus.SUCCESS
        }

    def change_teams(self, user: dict, teams_details):
        pending_invitation_revoke = teams_details.pending_invitation_revoke
        remove_user = teams_details.remove_user
        if pending_invitation_revoke:
            self.settings_persistence.pending_invitation_revoke(user_id=user.get('id'), mail=pending_invitation_revoke)
        if remove_user:
            mail = user.get('team_member').get('email') if user.get('team_member') else user.get('email')
            result = self.settings_persistence.team_members_remove(user_id=user.get('id'), mail_remove_user=remove_user,
                                                                   mail=mail)
            if not result['success']:
                return {'status': result['error']}

        return {
            'status': SettingStatus.SUCCESS,
            'invitation_count': self.user_persistence.get_team_members(user_id=user.get('id'))
        }

    def timestamp_to_date(self, timestamp):
        return datetime.fromtimestamp(timestamp)

    def extract_subscription_details(self, customer_id, prospect_credits, user_id):
        subscription = get_billing_details_by_userid(customer_id)
        user_subscription = self.subscription_service.get_user_subscription(user_id=user_id)
        current_plan = self.plan_persistence.get_current_plan(user_id=user_id)
        plan_limit_domain = user_subscription.domains_limit if user_subscription else 0
        user_limit_domain = len(self.user_domains_service.get_domains(user_id))
        subscription_details = None
        total_key = 'monthly_total' if current_plan.interval == 'month' else 'yearly_total'
        if subscription is None and user_subscription:
            subscription_details = {
                'billing_cycle': f"{user_subscription.plan_start.strftime('%b %d, %Y')} to {user_subscription.plan_end.strftime('%b %d, %Y')}" if user_subscription.plan_start else None,
                'plan_name': current_plan.title,
                'domains': f"{user_limit_domain}/{plan_limit_domain}",
                'prospect_credits': 'Coming soon',
                'overage': 'free' if user_subscription.lead_credit_price == -1 else user_subscription.lead_credit_price,
                'next_billing_date': None,
                'total_key': None,
                'active': True if user_subscription.status == 'active' else False,
            }
        elif subscription and user_subscription:
            plan = subscription['items']['data'][0]['plan']
            is_active = subscription.get('status') == 'active' or subscription.get('status') == 'trialing'
            plan_name = determine_plan_name_from_product_id(plan['product'])
            if user_subscription.downgrade_price_id:
                downgrade_plan = get_price_from_price_id(user_subscription.downgrade_price_id)
                downgrade_amount = downgrade_plan['unit_amount'] if downgrade_plan else 0
                total_price = f"${downgrade_amount / 100:,.0f}"
            elif user_subscription.cancel_scheduled_at:
                total_price = None
            else:
                total_price = f"${plan['amount'] / 100:,.0f}"
            subscription_details = {
                'billing_cycle': f"{user_subscription.plan_start.strftime('%b %d, %Y')} to {user_subscription.plan_end.strftime('%b %d, %Y')}" if user_subscription.plan_start else None,
                'plan_name': plan_name,
                'domains': f"{user_limit_domain}/{plan_limit_domain}",
                'prospect_credits': 'Coming soon',
                'overage': 'free' if user_subscription.lead_credit_price == -1 else user_subscription.lead_credit_price,
                'next_billing_date': self.timestamp_to_date(subscription['current_period_end']).strftime('%b %d, %Y'),
                total_key: total_price,
                'active': is_active,
            }

        billing_detail = {
            'subscription_details': subscription_details,
            'downgrade_plan': {
                'plan_name': get_product_from_price_id(
                    user_subscription.downgrade_price_id).name if user_subscription and user_subscription.downgrade_price_id else None,
                'downgrade_at': user_subscription.plan_end.strftime(
                    '%b %d, %Y') if user_subscription and user_subscription.downgrade_price_id else None,
            },
            'canceled_at': user_subscription.cancel_scheduled_at if user_subscription else None
        }

        return billing_detail

    def get_billing(self, user: dict):
        result = {}
        current_plan = self.plan_persistence.get_current_plan(user_id=user.get('id'))
        result['card_details'] = get_card_details_by_customer_id(user.get('customer_id'))
        result['billing_details'] = self.extract_subscription_details(user.get('customer_id'),
                                                                      user.get('prospect_credits'), user.get('id'))
        result['billing_details']['is_leads_auto_charging'] = user.get('is_leads_auto_charging')
        result['usages_credits'] = {
            'leads_credits': user.get('leads_credits'),
            'plan_leads_credits': current_plan.leads_credits if current_plan else 0,
            'prospect_credits': user.get('prospect_credits')
        }
        return result

    def extract_billing_history(self, customer_id, page, per_page):
        result = []
        billing_history, count, max_page, has_more = get_billing_history_by_userid(customer_id=customer_id, page=page,
                                                                                   per_page=per_page)

        for billing_data in billing_history:
            billing_hash = {}
            if isinstance(billing_data, stripe.Invoice):
                line_items = billing_data.lines.data
                billing_hash['date'] = self.timestamp_to_date(line_items[0].period.start)
                billing_hash['invoice_id'] = billing_data.id
                billing_hash['pricing_plan'] = determine_plan_name_from_product_id(line_items[0].plan.product)
                billing_hash['total'] = billing_data.subtotal / 100
                billing_hash['status'] = self.map_status(billing_data.status)

            elif isinstance(billing_data, stripe.Charge):
                billing_hash['date'] = self.timestamp_to_date(billing_data.created)
                billing_hash['invoice_id'] = billing_data.invoice
                billing_hash['pricing_plan'] = "Overage"
                billing_hash['total'] = billing_data.amount / 100
                billing_hash['status'] = self.map_status(billing_data.status)

            result.append(billing_hash)

        result.sort(key=lambda x: x['date'], reverse=True)
        for item in result:
            item['date'] = item['date'].strftime('%b %d, %Y')

        return result, count, max_page

    def map_status(self, status):
        if status in ["succeeded", "paid"]:
            return "Successful"
        elif status == "uncollectible":
            return "Decline"
        else:
            return "Failed"

    def get_billing_history(self, user: dict, page, per_page):
        result = {}
        result['billing_history'], result['count'], result['max_page'] = self.extract_billing_history(
            user.get('customer_id'), page, per_page)
        return result

    def add_card(self, user: dict, payment_method_id):
        return add_card_to_customer(user.get('customer_id'), payment_method_id)

    def switch_overage(self, user: dict):
        inactive_leads_user = self.lead_persistence.get_inactive_leads_user(user.get('id'))
        return {
            'contact_count': len(inactive_leads_user),
            'date': inactive_leads_user[0].created_at if inactive_leads_user else None,
        }

    def delete_card(self, payment_method_id):
        return detach_card_from_customer(payment_method_id)

    def billing_overage(self, user):
        is_leads_auto_charging = self.settings_persistence.billing_overage(user_id=user.get('id'))
        return {
            'status': SettingStatus.SUCCESS,
            'is_leads_auto_charging': is_leads_auto_charging
        }

    def send_billing(self, invoice_id, email, user):
        result = get_billing_by_invoice_id(invoice_id)
        if result['status'] != 'SUCCESS':
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Billing information not found.")

        invoice_number = result['data'].get('id', '')
        invoice_date = datetime.fromtimestamp(result['data'].get('created', 0)).strftime("%B %d, %Y")
        total = result['data'].get('amount_due', 0) / 100

        template_id = self.send_grid_persistence.get_template_by_alias(
            SendgridTemplate.PAYMENT_INVOICE_TEMPLATE.value)

        mail_object = SendgridHandler()
        mail_object.send_sign_up_mail(
            to_emails=email,
            template_id=template_id,
            template_placeholder={
                "full_name": user.get('full_name', ''),
                "invoice_number": invoice_number,
                "invoice_date": invoice_date,
                "total": f"{total:.2f}",
                "link": result['data'].get('hosted_invoice_url', '')
            }
        )

        return SettingStatus.SUCCESS

    def download_billing(self, invoice_id):
        result = get_billing_by_invoice_id(invoice_id)
        if result['status'] != 'SUCCESS':
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Billing information not found.")

        hosted_invoice_url = result['data'].get('hosted_invoice_url', '')
        return hosted_invoice_url

    def default_card(self, user: dict, payment_method_id):
        return set_default_card_for_customer(user.get('customer_id'), payment_method_id)

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
            self.settings_persistence.change_columns_data_api_details(changes=changes, user_id=user.get('id'),
                                                                      api_keys_id=api_keys_request.id)
        else:
            changes['last_used_at'] = datetime.now()
            self.settings_persistence.change_columns_data_api_details(changes=changes, user_id=user.get('id'),
                                                                      api_keys_id=api_keys_request.id)
        return SettingStatus.SUCCESS
