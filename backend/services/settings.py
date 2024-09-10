import logging

from persistence.settings_persistence import SettingsPersistence
from models.users import User

logger = logging.getLogger(__name__)


class SettingsService:

    def __init__(self, settings_persistence_service: SettingsPersistence,):
        self.settings_persistence_service = settings_persistence_service


    def get_my_details(self, user: User):
        user_info = self.settings_persistence_service.get_my_details(user)
        if user_info:
            return {
                'full_name': user_info.get('full_name'),
                'email_address': user_info.get('email'),
                'reset_password_sent_at': user_info.get('reset_password_sent_at'),
                'company_name': user_info.get('company_name'),
                'company_website': user_info.get('company_website'),
                'company_website_visits': user_info.get('company_website_visits')
            }
