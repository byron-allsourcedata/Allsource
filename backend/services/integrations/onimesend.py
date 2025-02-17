import logging
import httpx
import re
from typing import List
from datetime import datetime
from schemas.integrations.omnisend import Identifiers, OmnisendProfile
from schemas.integrations.integrations import DataMap, IntegrationCredentials
from persistence.leads_persistence import LeadsPersistence
from datetime import datetime, timedelta
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.domains import UserDomainsPersistence
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from utils import extract_first_email
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
from models.five_x_five_users import FiveXFiveUser

class OmnisendIntegrationService:

    def __init__(self, leads_persistence: LeadsPersistence, sync_persistence: IntegrationsUserSyncPersistence,
                 integration_persistence: IntegrationsPresistence, domain_persistence: UserDomainsPersistence, client: httpx.Client, million_verifier_integrations: MillionVerifierIntegrationsService):
        self.client = client
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.integration_persistence = integration_persistence
        self.domain_persistence = domain_persistence
        self.million_verifier_integrations = million_verifier_integrations

    def get_credentials(self, domain_id: int):
        return self.integration_persistence.get_credentials_for_service(domain_id, SourcePlatformEnum.OMNISEND.value)
    
    def __handle_request(self, url: str, headers: dict = None, json: dict = None, data: dict = None, params: dict = None, api_key: str = None,  method: str = 'GET'):
        if not headers:
            headers = {
                'X-API-KEY': f'{api_key}',
                'accept': 'application/json', 
                'content-type': 'application/json'
            }
        url = f'https://api.omnisend.com/v5' + url
        response = self.client.request(method, url, headers=headers, json=json, data=data, params=params)

        if response.is_redirect:
            redirect_url = response.headers.get('Location')
            if redirect_url:
                response = self.client.request(method, redirect_url, headers=headers, json=json, data=data, params=params)
        return response

    def get_list_contact(self, api_key):
        contacts = self.__handle_request('/contacts', api_key=api_key)   
        return contacts
    
    def __save_integrations(self, api_key: str, domain_id: int, user: dict):
        credential = self.get_credentials(domain_id)
        if credential:
            credential.access_token = api_key
            self.integration_persistence.db.commit()
            return credential
        integartions = self.integration_persistence.create_integration({
            'domain_id': domain_id,
            'access_token': api_key,
            'full_name': user.get('full_name'),
            'service_name': SourcePlatformEnum.OMNISEND.value
        })
        if not integartions:
            return IntegrationsStatus.CREATE_IS_FAILED 
        return IntegrationsStatus.SUCCESS


    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        if self.get_credentials(domain.id):
            return IntegrationsStatus.ALREADY_EXIST
        if self.get_list_contact(credentials.omnisend.api_key).status_code != 200:
            return IntegrationsStatus.CREDENTAILS_INVALID
        return self.__save_integrations(api_key=credentials.omnisend.api_key, domain_id=domain.id, user=user)
    
    async def create_sync(self, domain_id: int, created_by: str, data_map: List[DataMap] = None, leads_type: str = None, list_id: str = None, list_name: str = None,):
        credentials = self.get_credentials(domain_id)
        data_syncs = self.sync_persistence.get_filter_by(domain_id=domain_id)
        for sync in data_syncs:
            if sync.get('integration_id') == credentials.id and sync.get('leads_type') == leads_type:
                return
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        })
        
    async def process_data_sync(self, five_x_five_user, user_integration, data_sync, lead_user):    
        profile = self.__create_profile(five_x_five_user, user_integration.access_token, data_sync.data_map)
        
        if profile in (ProccessDataSyncResult.AUTHENTICATION_FAILED.value, ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return profile
            
        return ProccessDataSyncResult.SUCCESS.value
    
    def __create_profile(self, five_x_five_user, access_token, data_map):
        profile = self.__mapped_profile(five_x_five_user)
        identifiers = self.__mapped_identifiers(five_x_five_user)
        if identifiers in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return identifiers
        if data_map:
            properties = self.__map_properties(five_x_five_user, data_map)
        else:
            properties = {}
        json_data = {
            'customProperties': properties,
            'address': profile.address,
            'city': profile.city,
            'state': profile.state,
            'postalCode': profile.postalCode,
            'gender': profile.gender,
            'firstName': profile.firstName,
            'lastName': profile.lastName,
            'identifiers': [
                identifiers.model_dump()
            ]
        }
        json_data = {k: v for k, v in json_data.items() if v is not None}
        response = self.__handle_request('/contacts', method='POST', api_key=access_token, json=json_data)
        if response.status_code != 200:
            if response.status_code in (403, 401):
                return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
            if response.status_code == 400:
                return ProccessDataSyncResult.INCORRECT_FORMAT.value
            logging.error("Error response: %s", response.text)
        return response.json()
    

    def __mapped_identifiers(self, five_x_five_user: FiveXFiveUser):
        email_fields = [
            'business_email', 
            'personal_emails', 
            'additional_personal_emails',
        ]
        
        def get_valid_email(user) -> str:
            thirty_days_ago = datetime.now() - timedelta(days=30)
            thirty_days_ago_str = thirty_days_ago.strftime('%Y-%m-%d %H:%M:%S')
            verity = 0
            for field in email_fields:
                email = getattr(user, field, None)
                if email:
                    emails = extract_first_email(email)
                    for e in emails:
                        if e and field == 'business_email' and five_x_five_user.business_email_last_seen:
                            if five_x_five_user.business_email_last_seen.strftime('%Y-%m-%d %H:%M:%S') > thirty_days_ago_str:
                                return e.strip()
                        if e and field == 'personal_emails' and five_x_five_user.personal_emails_last_seen:
                            personal_emails_last_seen_str = five_x_five_user.personal_emails_last_seen.strftime('%Y-%m-%d %H:%M:%S')
                            if personal_emails_last_seen_str > thirty_days_ago_str:
                                return e.strip()
                        if e and self.million_verifier_integrations.is_email_verify(email=e.strip()):
                            return e.strip()
                        verity += 1
            if verity > 0:
                return ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        first_email = get_valid_email(five_x_five_user)
        
        if first_email in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return first_email
        
        return Identifiers(id=first_email)
    

    def __mapped_profile(self, five_x_five_user: FiveXFiveUser) -> OmnisendProfile:
        gender = getattr(five_x_five_user, 'gender', None)
        if gender not in ['m', 'f']:
            gender = None
        return OmnisendProfile(
            address=getattr(five_x_five_user, 'personal_address') or getattr(five_x_five_user, 'company_address', None),
            city=getattr(five_x_five_user, 'personal_city') or getattr(five_x_five_user, 'company_city', None),
            state=getattr(five_x_five_user, 'personal_state') or getattr(five_x_five_user, 'company_state', None),
            postalCode=getattr(five_x_five_user, 'personal_zip') or getattr(five_x_five_user, 'company_zip', None),
            firstName=getattr(five_x_five_user, 'first_name', None),
            lastName=getattr(five_x_five_user, 'last_name', None),
            gender=gender.lower() if gender else None
        )

    def edit_sync(self, leads_type: str, integrations_users_sync_id: int,
                  data_map: List[DataMap], domain_id: int, created_by: str):
        credentials = self.get_credentials(domain_id)
        data_syncs = self.sync_persistence.get_filter_by(domain_id=domain_id)
        for sync in data_syncs:
            if sync.get('integration_id') == credentials.id and sync.get('leads_type') == leads_type:
                return
        sync = self.sync_persistence.edit_sync({
            'integration_id': credentials.id,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        }, integrations_users_sync_id)

        return sync

    def __map_properties(self, five_x_five_user: FiveXFiveUser, data_map: List[DataMap]) -> dict:
        properties = {}
        for mapping in data_map:
            five_x_five_field = mapping.get("type")  
            new_field = mapping.get("value")  
            value_field = getattr(five_x_five_user, five_x_five_field, None)
            if value_field is not None:
                new_field = new_field.replace(" ", "_")
                if isinstance(value_field, datetime):
                    properties[new_field] = value_field.strftime("%Y-%m-%d")
                else:
                    if isinstance(value_field, str):
                        if len(value_field) > 2048:
                            value_field = value_field[:2048]
                    properties[new_field] = value_field
                    
        return properties