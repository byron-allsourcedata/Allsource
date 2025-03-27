from datetime import datetime
from utils import format_phone_number
from models.integrations.integrations_users_sync import IntegrationUserSync
from persistence.domains import UserDomainsPersistence
from persistence.leads_persistence import LeadsPersistence
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from datetime import datetime, timedelta
from typing import List
import httpx
import os
from models.five_x_five_users import FiveXFiveUser
from schemas.integrations.integrations import DataMap, IntegrationCredentials
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from fastapi import HTTPException
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
from httpx import Client
from utils import extract_first_email


class WebhookIntegrationService:

    def __init__(self, lead_persistence: LeadsPersistence, domain_persistence: UserDomainsPersistence, sync_persistence: IntegrationsUserSyncPersistence,
                 integration_persistence: IntegrationsPresistence, client: Client, million_verifier_integrations: MillionVerifierIntegrationsService):
        self.leads_persistence = lead_persistence
        self.domain_persistence = domain_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.integration_persistence = integration_persistence
        self.client = client
        
    def __handle_request(self, url: str, headers: dict = None, json: dict = None, data: dict = None, params: dict = None, api_key: str = None,  method: str = 'GET'):
        try:
            if not headers:
                headers = {
                    'Authorization': f'Bearer {api_key}',
                    'accept': 'application/json', 
                    'content-type': 'application/json'
                }
            response = self.client.request(method, url, headers=headers, json=json, data=data, params=params)
            if response.is_redirect:
                redirect_url = response.headers.get('Location')
                if redirect_url:
                    response = self.client.request(method, redirect_url, headers=headers, json=json, data=data, params=params)
            return response
        except httpx.ConnectError as e:
            return None
        except httpx.RequestError as e:
            return None
    
    def save_integration(self, domain_id: int, user: dict):
        credential = self.integration_persistence.get_credentials_for_service(domain_id=domain_id, service_name=SourcePlatformEnum.WEBHOOK.value)
        if credential:
            credential.is_failed = False
            credential.error_message = None
            self.integration_persistence.db.commit()
            return credential
        
        common_integration = bool(os.getenv('COMMON_INTEGRATION'))
        integration_data = {
            'full_name': user.get('full_name'),
            'service_name': SourcePlatformEnum.WEBHOOK.value
        }

        if common_integration:
            integration_data['user_id'] = user.get('id')
        else:
            integration_data['domain_id'] = domain_id
            
        integartion = self.integration_persistence.create_integration(integration_data)
        
        if not integartion:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        
        return IntegrationsStatus.SUCCESS

    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        integration = self.save_integration(domain_id=domain.id, user=user)
        return integration

    def create_list(self, list, domain_id: int, user_id: int):
        credential = self.integration_persistence.get_credentials_for_service(domain_id=domain_id, user_id=user_id, service_name=SourcePlatformEnum.WEBHOOK.value)
        if not credential:
            raise HTTPException(status_code=403, detail={'status': IntegrationsStatus.CREDENTIALS_NOT_FOUND})
        response = self.__handle_request(url=list.webhook_url, method=list.method)
        if not response or response.status_code == 404:
            self.integration_persistence.db.commit()
            return IntegrationsStatus.INVALID_WEBHOOK_URL
        
        return list.name
                    
    async def create_sync(self, leads_type: str, list_name: str, webhook_url: str, method: str, data_map: List[DataMap], domain_id: int, created_by: str, user: dict):
        credential = self.integration_persistence.get_credentials_for_service(domain_id=domain_id, user_id=user.get('id'), service_name=SourcePlatformEnum.WEBHOOK.value)
        sync = self.sync_persistence.create_sync({
            'integration_id': credential.id,
            'list_name': list_name,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
            'hook_url': webhook_url,
            'method': method,
        })
        return sync
    
    async def process_data_sync(self, five_x_five_user, access_token, integration_data_sync, lead_user):
        profile = self.__create_profile(five_x_five_user, integration_data_sync, lead_user)
        if profile in (ProccessDataSyncResult.AUTHENTICATION_FAILED.value, ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return profile
            
        return ProccessDataSyncResult.SUCCESS.value
    
    def __create_profile(self, five_x_five_user, sync: IntegrationUserSync, lead_user):
        data = self.__mapped_lead(five_x_five_user, sync.data_map, lead_user)
        if data in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return data
        response = self.__handle_request(url=sync.hook_url, method=sync.method, json=data)
        if not response or response.status_code == 401:
                return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        if not response or response.status_code == 405:
                return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        if response.status_code == 400:
                return ProccessDataSyncResult.INCORRECT_FORMAT.value
            
        return ProccessDataSyncResult.SUCCESS.value
    
    def get_valid_email(self, five_x_five_user, email_fields) -> str:
        thirty_days_ago = datetime.now() - timedelta(days=30)
        thirty_days_ago_str = thirty_days_ago.strftime('%Y-%m-%d %H:%M:%S')
        verity = 0
        for field in email_fields:
            email = getattr(five_x_five_user, field, None)
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
    
    def build_full_url(self, page, page_parameters):
        if page_parameters:
            return f"{page}?{page_parameters}".rstrip("&")
        return page
    
    @staticmethod
    def map_phone_numbers(five_x_five_user, mapped_fields):
        properties = {}

        if "business_phone" in mapped_fields and "personal_phone" in mapped_fields:
            direct, personal, mobile = five_x_five_user.direct_number, five_x_five_user.personal_phone, five_x_five_user.mobile_phone

            match (bool(direct), bool(personal), bool(mobile)):
                case (True, True, True):
                    properties["business_phone"] = format_phone_number(direct)
                    properties["personal_phone"] = f"{format_phone_number(personal)}, {format_phone_number(mobile)}"
                case (True, False, False):
                    properties["business_phone"] = format_phone_number(direct)
                    properties["personal_phone"] = None
                case (False, False, False):
                    properties["business_phone"] = None
                    properties["personal_phone"] = None
                case (True, True, False):
                    properties["business_phone"] = format_phone_number(direct)
                    properties["personal_phone"] = format_phone_number(personal)
                case (True, False, True):
                    properties["business_phone"] = format_phone_number(direct)
                    properties["personal_phone"] = format_phone_number(mobile)
                case (False, True, True):
                    properties["business_phone"] = format_phone_number(mobile)
                    properties["personal_phone"] = format_phone_number(personal)
                case (False, False, True):
                    properties["business_phone"] = format_phone_number(mobile)
                    properties["personal_phone"] = format_phone_number(mobile)
                case (False, True, False):
                    properties["business_phone"] = None
                    properties["personal_phone"] = format_phone_number(personal)

        if "business_phone" in mapped_fields and "business_phone" not in properties:
            direct, personal, mobile = five_x_five_user.direct_number, five_x_five_user.personal_phone, five_x_five_user.mobile_phone

            match (bool(direct), bool(personal), bool(mobile)):
                case (True, True, True) | (True, True, False) | (True, False, True) | (True, False, False):
                    properties["business_phone"] = format_phone_number(direct)
                case (False, True, True) | (False, False, True):
                    properties["business_phone"] = format_phone_number(mobile)
                case (False, True, False) | (False, False, False):
                    properties["business_phone"] = None

        if "personal_phone" in mapped_fields and "personal_phone" not in properties:
            personal, mobile = five_x_five_user.personal_phone, five_x_five_user.mobile_phone

            match (bool(personal), bool(mobile)):
                case (True, True):
                    properties["personal_phone"] = f"{format_phone_number(personal)}, {format_phone_number(mobile)}"
                case (True, False):
                    properties["personal_phone"] = format_phone_number(personal)
                case (False, True):
                    properties["personal_phone"] = format_phone_number(mobile)
                case (False, False):
                    properties["personal_phone"] = None
        return properties

    def __mapped_lead(self, five_x_five_user: FiveXFiveUser, data_map, lead_user):
        properties = {}
        if all(item.get('type') == '' and item.get('value') == '' for item in data_map):
            return ProccessDataSyncResult.INCORRECT_FORMAT.value
        
        mapped_fields = {mapping["type"] for mapping in data_map}
        for mapping in data_map:
            five_x_five_field = mapping["type"]
            value_field = getattr(five_x_five_user, five_x_five_field, "")
            if value_field:
                if isinstance(value_field, datetime):
                    properties[mapping["value"]] = value_field.strftime("%Y-%m-%d")
                elif isinstance(value_field, str):
                    properties[mapping["value"]] = value_field[:2048] if len(value_field) > 2048 else value_field
                else:
                    properties[mapping["value"]] = value_field
            else:
                properties[mapping["value"]] = ""
        
        if "urls_visited" in mapped_fields:
            page_time = self.leads_persistence.get_latest_page_time(lead_user.id)
            page_time_array = [{"page": row.page, "total_spent_time": str(row.total_spent_time), "count": row.count} for row in page_time]
            for mapping in data_map:
                if mapping["type"] == "urls_visited":
                    properties[mapping["value"]] = page_time_array
        
        if "urls_visited_with_parameters" in mapped_fields:
            page_time = self.leads_persistence.get_latest_page_time(lead_user.id)
            page_time_array = [
                {
                    "page": self.build_full_url(row.page, row.page_parameters.replace(', ', '&')), 
                    "total_spent_time": str(row.total_spent_time),
                    "count": row.count
                } for row in page_time
            ]
            for mapping in data_map:
                if mapping["type"] == "urls_visited_with_parameters":
                    properties[mapping["value"]] = page_time_array
                    
        if "time_on_site" in mapped_fields or "url_visited" in mapped_fields:
            time_on_site, url_visited = self.leads_persistence.get_visit_stats(five_x_five_user.id)
            for mapping in data_map:
                if mapping["type"] == "time_on_site":
                    properties[mapping["value"]] = time_on_site
                if mapping["type"] == "url_visited":
                    properties[mapping["value"]] = url_visited

        if "business_email" in mapped_fields:
            result = self.get_valid_email(five_x_five_user, ['business_email'])
            for mapping in data_map:
                if mapping["type"] == "business_email":
                    if result in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
                        properties[mapping["value"]] = None
                    else:
                        properties[mapping["value"]] = result
        
        if "mobile_phone" in mapped_fields:
            properties["mobile_phone"] = format_phone_number(five_x_five_user.mobile_phone)
        
        properties.update(self.map_phone_numbers(five_x_five_user, mapped_fields))
            
        if "personal_email" in mapped_fields:
            email_fields = ['personal_emails', 'additional_personal_emails']
            result = self.get_valid_email(five_x_five_user, email_fields)
            for mapping in data_map:
                if mapping["type"] == "personal_email":
                    if result in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
                        properties[mapping["value"]] = None
                    else:
                        properties[mapping["value"]] = result
                        
        return properties
                    
    def edit_sync(self, list_name: str, webhook_url: str, method: str, data_map: List[DataMap], integrations_users_sync_id, leads_type: str, domain_id: int, created_by: str, user_id: int):
        sync = self.sync_persistence.edit_sync({
            'list_name': list_name,
            'leads_type': leads_type,
            'hook_url': webhook_url,
            'method': method,
            'created_by': created_by,
            'data_map': data_map
        }, integrations_users_sync_id)

        return sync