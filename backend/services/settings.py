import logging

from persistence.settings_persistence import SettingsPersistence
from models.users import User
from sqlalchemy.orm import Session
from schemas.settings import AccountDetailsRequest
logger = logging.getLogger(__name__)
from services.jwt_service import get_password_hash
from enums import SettingStatus

class SettingsService:

    def __init__(self, db: Session, settings_persistence_service: SettingsPersistence,):
        self.settings_persistence_service = settings_persistence_service


    def get_account_details(self, user):
        user_info = self.settings_persistence_service.get_account_details(user.get('id'))
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
                changes['email'] = account_details.account.email_address
            
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
            self.settings_persistence_service.change_columns_data_by_userid(changes, user.get('id'))

        return SettingStatus.SUCCESS
        
