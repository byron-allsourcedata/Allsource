import logging
import os
from typing import Annotated

import requests
from fastapi import Depends

from persistence.user_persistence import UserPersistence
from resolver import injectable
from schemas.users import MeetingData
from services.user_name import UserNamesService

logger = logging.getLogger(__name__)

@injectable
class MeetingScheduleService:
    def __init__(
        self,
        user_persistence_service: UserPersistence,
        user_names: UserNamesService
    ):
        self.user_persistence_service = user_persistence_service
        self.user_names = user_names

    def get_meeting_info(self, user: dict) -> MeetingData:
        result = MeetingData()

        if user.get('utm_params'):
            result.utm_params = user['utm_params']

        result.email = user.get('email')
        name = user.get('full_name')
        first_name, last_name = self.user_names.split_name(name)

        result.first_name = first_name
        result.last_name = last_name
        return result

    def update_calendly_info(
        self,
        user: dict,
        uuid: str,
        invitees: str
    ):
        try:
            calendly_uuid = user.get('calendly_uuid')
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

        self.user_persistence_service.update_calendly_uuid(user.get('id'), str(uuid), str(invitees))
        return 'OK'
