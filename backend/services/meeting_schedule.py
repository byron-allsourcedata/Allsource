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

