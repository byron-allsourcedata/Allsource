from utils import validate_and_format_phone
from typing import List
from fastapi import HTTPException
import httpx
from datetime import datetime, timedelta
from utils import format_phone_number
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
from models.five_x_five_users import FiveXFiveUser
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from schemas.integrations.sendlane import SendlaneContact, SendlaneSender
from schemas.integrations.integrations import DataMap, IntegrationCredentials, ListFromIntegration
from persistence.domains import UserDomainsPersistence
from utils import extract_first_email
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence

class SendlaneIntegrationService:

    def __init__(self, domain_persistence: UserDomainsPersistence, integrations_persistence: IntegrationsPresistence, leads_persistence: LeadsPersistence,
                 sync_persistence: IntegrationsUserSyncPersistence, client: httpx.Client, million_verifier_integrations: MillionVerifierIntegrationsService):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.sync_persistence = sync_persistence
        self.client = client

    def get_credentials(self, domain_id: int):
        return self.integrations_persisntece.get_credentials_for_service(domain_id=domain_id, service_name=SourcePlatformEnum.SENDLANE.value)
    
    
    def __handle_request(self, url: str, headers: dict = None, json: dict = None, data: dict = None, params: dict = None, api_key: str = None,  method: str = 'GET'):
        if not headers:
            headers = {
                'Authorization': f'Bearer {api_key}',
                'accept': 'application/json', 
                'content-type': 'application/json'
            }
        url = f'https://api.sendlane.com/v2' + url
        response = self.client.request(method, url, headers=headers, json=json, data=data, params=params)

        if response.is_redirect:
            redirect_url = response.headers.get('Location')
            if redirect_url:
                response = self.client.request(method, redirect_url, headers=headers, json=json, data=data, params=params)
        return response


    def __save_integrations(self, api_key: str, domain_id: int, user: dict):
        credential = self.get_credentials(domain_id)
        if credential:
            credential.access_token = api_key
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persisntece.db.commit()
            return credential
        integartions = self.integrations_persisntece.create_integration({
            'domain_id': domain_id,
            'access_token': api_key,
            'full_name': user.get('full_name'),
            'service_name': SourcePlatformEnum.SENDLANE.value
        })
        if not integartions:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return IntegrationsStatus.SUCCESS
    
    def edit_sync(self, leads_type: str, list_id: str, list_name: str, integrations_users_sync_id: int, domain_id: int, created_by: str):
        credentials = self.get_credentials(domain_id)
        sync = self.sync_persistence.edit_sync({
            'integration_id': credentials.id,
            'list_id': list_id,
            'list_name': list_name,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'created_by': created_by,
        }, integrations_users_sync_id)

        return sync

    def __get_list(self, api_key):
        response = self.__handle_request(url='/lists', api_key=api_key)
        return response

    def get_list(self, domain_id):
        credential = self.get_credentials(domain_id)
        if not credential:
            return
        lists = self.__get_list(credential.access_token)
        if lists.status_code == 401:
            credential.is_failed = True
            credential.error_message = 'Invalid API Key'
            self.integrations_persisntece.db.commit()
            return
        return [self.__mapped_list(list) for list in lists.json().get('data')]

    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        lists = self.__get_list(credentials.sendlane.api_key)
        if lists.status_code == 401:
            raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREDENTAILS_INVALID.value})
        return self.__save_integrations(credentials.sendlane.api_key, domain_id=domain.id, user=user)

    
    def __get_sender(self, api_key):
        response = self.__handle_request('/senders', api_key=api_key)
        return response


    def get_sender(self, domain_id):
        credential = self.get_credentials(domain_id)
        if not credential:
            return
        senders = self.__get_sender(credential.access_token)
        if senders.status_code == 401:
            credential.is_failed = True
            credential.error_message = 'Invalid API Key'
            self.integrations_persisntece.db.commit()
            return
        return [self.__mapped_sender(sender) for sender in senders.json().get('data')]

    def create_list(self, list, domain_id: int):
        credential = self.get_credentials(domain_id)
        if not credential:
            raise HTTPException(status_code=403, detail={'status': IntegrationsStatus.CREDENTIALS_NOT_FOUND})
        json = {
            'name': list.name,
            'sender_id': list.sender_id
        }
        response = self.__handle_request('/lists', method='POST', api_key=credential.access_token, json=json)
        if response == 401:
            credential.is_failed = True
            credential.error_message = 'Invalid API Key'
            self.integrations_persisntece.db.commit()
            return
        if response.status_code == 422:
            raise HTTPException(status_code=422, detail={'status': response.json().get('message')})
        return self.__mapped_list(response.json().get('data'))
 
    async def create_sync(self, leads_type: str, list_id: str, list_name: str, data_map: List[DataMap], domain_id: int, created_by: str, tags_id: str = None):
        credentials = self.get_credentials(domain_id)
        data_syncs = self.sync_persistence.get_filter_by(domain_id=domain_id)
        for sync in data_syncs:
            if sync.get('integration_id') == credentials.id and sync.get('leads_type') == leads_type:
                return
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'list_id': list_id,
            'list_name': list_name,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        })

    async def process_data_sync(self, five_x_five_user, user_integration, integration_data_sync, lead_user):
        profile = self.__create_contact(five_x_five_user, user_integration.access_token, integration_data_sync.list_id)
        if profile in (ProccessDataSyncResult.AUTHENTICATION_FAILED.value, ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return profile
            
        return ProccessDataSyncResult.SUCCESS.value

    def __create_contact(self, five_x_five_user, access_token, list_id: int):
        profile = self.__mapped_sendlane_contact(five_x_five_user)
        if profile in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return profile
        
        json = {
            'contacts': [{
                **profile.model_dump()
            }]
        }
        response = self.__handle_request(f'/lists/{list_id}/contacts', api_key=access_token, json=json, method="POST")
        if response.status_code == 401:
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        if response.status_code == 202:
            return response

    def __mapped_list(self, list):
        return ListFromIntegration(
            id=str(list.get('id')),
            list_name=list.get('name')
        )
    
    def __mapped_sender(self, sender):
        return SendlaneSender(
            id=str(sender.get('id')),
            sender_name=sender.get('from_name')
        )
    
    def __mapped_sendlane_contact(self, five_x_five_user: FiveXFiveUser):
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
        
        first_phone = (
            getattr(five_x_five_user, 'mobile_phone') or 
            getattr(five_x_five_user, 'personal_phone') or 
            getattr(five_x_five_user, 'direct_number') or 
            getattr(five_x_five_user, 'company_phone', None)
        )

        if first_email:
            first_email = first_email.split(',')[-1].strip()
        first_phone = format_phone_number(first_phone)
        phone_number = validate_and_format_phone(first_phone)
        return SendlaneContact(
            email=first_email,
            first_name=five_x_five_user.first_name or None,
            last_name=five_x_five_user.last_name or None,
            phone=phone_number.split(', ')[-1] if phone_number else None
        )
