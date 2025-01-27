import logging
import os

from enums import UpdatePasswordStatus
from persistence.user_persistence import UserPersistence
from models.users import Users
from persistence.plans_persistence import PlansPersistence
from schemas.users import UpdatePassword, StripeAccountID
from schemas.domains import DomainResponse
from services.jwt_service import get_password_hash
import requests
from dotenv import load_dotenv
from persistence.domains import UserDomainsPersistence
from services.subscriptions import SubscriptionService
from persistence.domains import UserDomainsPersistence, UserDomains


logger = logging.getLogger(__name__)
load_dotenv()


class UsersService:
    def __init__(self, user, user_persistence_service: UserPersistence, plan_persistence: PlansPersistence,
                 subscription_service: SubscriptionService, domain_persistence: UserDomainsPersistence):
        self.user = user
        self.user_persistence_service = user_persistence_service
        self.plan_persistence = plan_persistence
        self.subscription_service = subscription_service
        self.domain_persistence = domain_persistence

    def update_password(self, update_data: UpdatePassword):
        if update_data.password != update_data.confirm_password:
            return UpdatePasswordStatus.PASSWORDS_DO_NOT_MATCH
        update_data.password = get_password_hash(update_data.password)
        logger.info('update password success')
        self.user_persistence_service.update_password(self.user.get('id'), update_data.password)
        return UpdatePasswordStatus.PASSWORD_UPDATED_SUCCESSFULLY

    def get_info_plan(self):
        if not self.user.get('is_book_call_passed') and not self.user.get('is_with_card'):
            return {
                'is_trial_pending': True
            }
        result = self.subscription_service.get_user_subscription_with_trial_status(
            self.user.get('id'))
        if result['subscription']:

            return {
                "is_artificial_status": result['is_artificial_status'],
                "is_trial": result['subscription'].is_trial,
                "plan_end": result['subscription'].plan_end,
            }
        return {
            "is_trial_pending": True
        }

    def get_my_info(self):
        if self.user.get('team_member'):
            team_member = self.user.get('team_member')
            return {
                "email": team_member.get('email'),
                "full_name": team_member.get('full_name'),
                "is_partner": team_member.get('is_partner'),
                "type_business": team_member.get('type_business'),
                "source": team_member.get('source_platform')
            }
        return {
            "email": self.user.get('email'),
            "full_name": self.user.get('full_name'),
            "is_partner": self.user.get('is_partner'),
            "type_business": self.user.get('type_business'),
            "source_platform": self.user.get('source_platform')
        }

    def add_percent_to_domain(self, domain: UserDomains, activate_percent):
        domain_percent = 75 if domain.is_pixel_installed else activate_percent 
        domain_data = self.domain_mapped(domain)
        domain_data["activate_percent"] = domain_percent
        return domain_data

    def get_domains(self):
        domains = self.domain_persistence.get_domains_by_user(self.user.get('id'))
        enabled_domains = [domain for domain in domains if domain.is_enable]
        disabled_domains = [domain for domain in domains if not domain.is_enable]
        enabled_domains_sorted = sorted(enabled_domains, key=lambda x: (x.created_at, x.id))
        disabled_domains_sorted = sorted(disabled_domains, key=lambda x: (x.created_at, x.id))
        sorted_domains = enabled_domains_sorted + disabled_domains_sorted
        return [
            self.add_percent_to_domain(domain, self.user.get('activate_steps_percent'))
            for domain in sorted_domains
        ]

    def domain_mapped(self, domain: UserDomains):
        return DomainResponse(
            id=domain.id,
            domain=domain.domain,
            data_provider_id=domain.data_provider_id,
            is_pixel_installed=domain.is_pixel_installed,
            enable=domain.is_enable
        ).model_dump()

    def get_calendly_info(self):
        result = {
            'utm_params': None,
            'email': None,
            'full_name': None
        }
        if self.user.get('utm_params'):
            result['utm_params'] = self.user['utm_params']
        try:
            calendly_uuid = self.user.get('calendly_uuid')
            invitee_uuid = self.user.get('calendly_invitee_uuid')
            if calendly_uuid and invitee_uuid:
                calendly_uuid = calendly_uuid.replace("uuid=", "").strip("'")
                invitee_uuid = invitee_uuid.replace("uuid=", "").strip("'")
                url = f"https://api.calendly.com/scheduled_events/{calendly_uuid}/invitees/{invitee_uuid}"

                headers = {
                    'Authorization': f'Bearer {os.getenv("CALENDLY_TOKEN")}',
                    'Content-Type': 'application/json'
                }
                
                response = requests.get(url, headers=headers).json()
                result['email'] = response.get('resource').get('email')
                result['full_name'] = response.get('resource').get('name')

        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {str(e)}")
        except Exception as e:
            logger.error(f"An error occurred: {str(e)}")
            
        return result

    def update_calendly_info(self, uuid: str, invitees: str):
        try:
            calendly_uuid = self.user.get('calendly_uuid')
            if calendly_uuid:
                calendly_uuid = calendly_uuid.replace("uuid=", "").strip("'")
                url = f"https://api.calendly.com/scheduled_events/{calendly_uuid}/cancellation"

                headers = {
                    'Authorization': f'Bearer {os.getenv("CALENDLY_TOKEN")}',
                    'Content-Type': 'application/json'
                }

                data = {
                    "reason": 'Reschedule a Call'
                }
                response = requests.post(url, headers=headers, json=data)
                if response.status_code == 204 and response.status_code == 201 and response.status_code == 200:
                    logger.info('Event completed successfully')
                else:
                    logger.error(f"Calendly cancel response code: {response.status_code}")

        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {str(e)}")
        except Exception as e:
            logger.error(f"An error occurred: {str(e)}")

        self.user_persistence_service.update_calendly_uuid(self.user.get('id'), str(uuid), str(invitees))
        return 'OK'

    def add_stripe_account(self, stripe_connected_account_id: str):
        self.user_persistence_service.add_stripe_account(self.user.get('id'), stripe_connected_account_id)
        return 'SUCCESS_CONNECT'
