import logging
import os

from enums import UpdatePasswordStatus
from persistence.user_persistence import UserPersistence
from models.users import Users
from persistence.plans_persistence import PlansPersistence
from schemas.users import UpdatePassword
from services.jwt_service import get_password_hash
import requests
from dotenv import load_dotenv

from services.subscriptions import SubscriptionService

logger = logging.getLogger(__name__)
load_dotenv()


class UsersService:
    def __init__(self, user, user_persistence_service: UserPersistence, plan_persistence: PlansPersistence,
                 subscription_service: SubscriptionService):
        self.user = user
        self.user_persistence_service = user_persistence_service
        self.plan_persistence = plan_persistence
        self.subscription_service = subscription_service

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

    def get_my_info(self, domain):
        if self.user.get('team_member'):
            team_member = self.user.get('team_member')
            return {
                "email": team_member.get('email'),
                "full_name": team_member.get('full_name'),
                "activate_percent": team_member.get('activate_steps_percent'),
            }
        return {
            "email": self.user.get('email'),
            "full_name": self.user.get('full_name'),
            "activate_percent": 75 if domain and domain.is_pixel_installed else self.user.get('activate_steps_percent') ,
        }

    def get_calendly_info(self):
        try:
            if self.user.get('calendly_uuid'):
                if self.user.get('calendly_invitee_uuid'):
                    calendly_uuid = self.get_calendly_uuid()
                    invitee_uuid = self.get_calendly_invitee_uuid()

                    if calendly_uuid and invitee_uuid:
                        url = f"https://api.calendly.com/scheduled_events/{calendly_uuid}/invitees/{invitee_uuid}"

                        headers = {
                            'Authorization': f'Bearer {os.getenv("CALENDLY_TOKEN")}',
                            'Content-Type': 'application/json'
                        }

                        response = requests.get(url, headers=headers).json()

                        return {"email": response.get('resource').get('email'),
                                "full_name": response.get('resource').get('name')
                                }

        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {str(e)}")
        except Exception as e:
            logger.error(f"An error occurred: {str(e)}")

    def get_calendly_uuid(self):
        uuid_str = self.user.get('calendly_uuid')
        if uuid_str:
            uuid_cleaned = uuid_str.replace("uuid=", "").strip("'")
            return uuid_cleaned
        return None

    def get_calendly_invitee_uuid(self):
        uuid_str = self.user.get('calendly_invitee_uuid')
        if uuid_str:
            uuid_cleaned = uuid_str.replace("uuid=", "").strip("'")
            return uuid_cleaned
        return None

    def update_calendly_info(self, uuid: str, invitees: str):
        try:
            calendly_uuid = self.get_calendly_uuid()

            if calendly_uuid:
                url = f"https://api.calendly.com/scheduled_events/{calendly_uuid}/cancellation"

                headers = {
                    'Authorization': f'Bearer {os.getenv("CALENDLY_TOKEN")}',
                    'Content-Type': 'application/json'
                }

                data = {
                    "reason": 'Reschedule a Call'
                }

                response = requests.post(url, headers=headers, json=data)

                if response.status_code == 204:
                    logger.info('Event completed successfully')
                else:
                    logger.error(f"Calendly cancel response code: {response.status_code}")

        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {str(e)}")
        except Exception as e:
            logger.error(f"An error occurred: {str(e)}")

        self.user_persistence_service.update_calendly_uuid(self.user.get('id'), str(uuid), str(invitees))
        return 'OK'
