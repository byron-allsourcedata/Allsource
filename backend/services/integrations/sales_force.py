import os
import re
import csv
import io
from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from persistence.domains import UserDomainsPersistence
from schemas.integrations.integrations import *
from schemas.integrations.sales_force import SalesForceProfile
from fastapi import HTTPException
from faker import Faker
from services.integrations.commonIntegration import get_valid_email, get_valid_phone, get_valid_location
from datetime import datetime, timedelta
from utils import extract_first_email
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult, DataSyncType, IntegrationLimit
import httpx
from models.enrichment_users import EnrichmentUser
import json
from utils import format_phone_number
from typing import List
from utils import validate_and_format_phone, format_phone_number
from uuid import UUID


class SalesForceIntegrationsService:

    def __init__(self, domain_persistence: UserDomainsPersistence, integrations_persistence: IntegrationsPresistence, leads_persistence: LeadsPersistence,
                 sync_persistence: IntegrationsUserSyncPersistence, client: httpx.Client, million_verifier_integrations: MillionVerifierIntegrationsService):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.client = client

    def __handle_request(self, method: str, url: str, headers: dict = None, json: dict = None, data: dict = None, params: dict = None, api_key: str = None):
         
        if not headers:
            headers = {
                'accept': 'application/json', 
                'content-type': 'application/json'
            }
        response = self.client.request(method, url, headers=headers, json=json, data=data, params=params)
        if response.is_redirect:
            redirect_url = response.headers.get('Location')
            if redirect_url:
                response = self.client.request(method, redirect_url, headers=headers, json=json, data=data, params=params)
        return response

    def get_credentials(self, domain_id: int, user_id: int):
        credential = self.integrations_persisntece.get_credentials_for_service(domain_id=domain_id, user_id=user_id, service_name=SourcePlatformEnum.SALES_FORCE.value)
        return credential

    def get_smart_credentials(self, user_id: int):
        credential = self.integrations_persisntece.get_smart_credentials_for_service(user_id=user_id, service_name=SourcePlatformEnum.SALES_FORCE.value)
        return credential
        

    def __save_integrations(self, api_key: str, instance_url: str, domain_id: int, user: dict):
        credential = self.get_credentials(domain_id, user.get('id'))
        if credential:
            credential.access_token = api_key
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persisntece.db.commit()
            return credential
        
        common_integration = os.getenv('COMMON_INTEGRATION') == 'True'
        integration_data = {
            'access_token': api_key,
            'full_name': user.get('full_name'),
            'instance_url': instance_url,
            'service_name': SourcePlatformEnum.SALES_FORCE.value,
            'limit': IntegrationLimit.SALESFORCE.value
        }

        if common_integration:
            integration_data['user_id'] = user.get('id')
        else:
            integration_data['domain_id'] = domain_id
            
        integartion = self.integrations_persisntece.create_integration(integration_data)
        
        if not integartion:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        
        return integartion
    
    def get_list(self, domain_id: int, user_id: int):
        credentials = self.get_credentials(domain_id, user_id)
        if not credentials:
            return
        return self.__get_list(credentials.access_token, credentials)
    
    def edit_sync(self, leads_type: str, integrations_users_sync_id: int, domain_id: int, created_by: str, user_id: int, data_map: List[DataMap] = []):
        credentials = self.get_credentials(domain_id, user_id)
        sync = self.sync_persistence.edit_sync({
            'integration_id': credentials.id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        }, integrations_users_sync_id)
        return sync
            
    def get_access_token(self, refresh_token):
        data = {
            "grant_type": "refresh_token",
            "client_id": os.getenv("SALES_FORCE_TOKEN"),
            "client_secret": os.getenv("SALES_FORCE_SECRET"),
            "refresh_token": refresh_token,
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
        response = self.__handle_request(method='POST', url="https://login.salesforce.com/services/oauth2/token", data=data, headers=headers)
        return response.json().get("access_token")
    
    
    def _to_csv(self, records: list[dict]) -> str:
        if not records:
            return ""
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=records[0].keys())
        writer.writeheader()
        for rec in records:
            writer.writerow(rec)
        return output.getvalue()
    
    def bulk_upsert_leads(self, profiles: list[dict], external_id_field: str, instance_url: str, access_token: str) -> str:
        job_payload = {
            "object": "Lead",
            "operation": "upsert",
            "externalIdFieldName": external_id_field,
            "contentType": "CSV"
        }
        base_url = f"{instance_url}/services/data/v59.0/jobs/ingest"
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        job_resp = self.__handle_request(method='POST', url=base_url, json=job_payload, headers=headers)
        
        job_resp.raise_for_status()
        job_id = job_resp.json()['id']

        csv_data = self._to_csv(profiles)
        upload_headers = {
            'Authorization': self.headers['Authorization'],
            'Content-Type': 'text/csv'
        }
        upload_url = f"{base_url}/{job_id}/batches"
        upload_resp = self.__handle_request(method='PUT', url=upload_url, data=csv_data, headers=upload_headers)
        upload_resp.raise_for_status()

        # 3. Закрыть job (начать обработку)
        close_url = f"{base_url}/{job_id}"
        close_resp = self.__handle_request(method='PATCH', url=close_url, json={"state": "UploadComplete"}, headers=headers)
        close_resp.raise_for_status()

        return job_id
    
    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        client_id = os.getenv("SALES_FORCE_TOKEN")
        client_secret = os.getenv("SALES_FORCE_SECRET")
        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": credentials.sales_force.code,
            "grant_type": "authorization_code",
            "redirect_uri": f"{os.getenv('SITE_HOST_URL')}/sales-force-landing",
        }
        response = self.__handle_request(method='POST', url="https://login.salesforce.com/services/oauth2/token", data=data, headers = {"Content-Type": "application/x-www-form-urlencoded"})
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access_token')
            refresh_token = token_data.get('refresh_token')
            instance_url = token_data.get('instance_url')
            integrations = self.__save_integrations(refresh_token, instance_url, domain.id, user)
            return {
                'integrations': integrations,
                'status': IntegrationsStatus.SUCCESS.value
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
    async def create_sync(self, leads_type: str, domain_id: int, created_by: str, user: dict, data_map: List[DataMap] = []):
        credentials = self.get_credentials(domain_id=domain_id, user_id=user.get('id'))
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        })
        return sync
    
    def create_smart_audience_sync(self, smart_audience_id: UUID, sent_contacts: int, created_by: str, user: dict, data_map: List[DataMap] = []):
        credentials = self.get_smart_credentials(user_id=user.get('id'))
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'sent_contacts': sent_contacts,
            'sync_type': DataSyncType.AUDIENCE.value,
            'smart_audience_id': smart_audience_id,
            'data_map': data_map,
            'created_by': created_by,
        })
        return sync

    async def process_data_sync(self, user_integration, data_sync, enrichment_users: EnrichmentUser):
        profiles = []
        profile_results = {}
        for enrichment_user in enrichment_users:
            profile = self.__mapped_sales_force_profile(enrichment_users, data_sync.data_map)
            if profile in (ProccessDataSyncResult.INCORRECT_FORMAT.value):
                profile_results[enrichment_user.id] = False
                continue
            profile_results[enrichment_user.id] = True
            profiles.append(profile)
            
        response_result = self.bulk_upsert_leads(profiles=profiles, external_id_field='', instance_url=user_integration.instance_url, access_token=user_integration.access_token)
        if response_result in (ProccessDataSyncResult.AUTHENTICATION_FAILED.value, ProccessDataSyncResult.INCORRECT_FORMAT.value):
            return profile, None
            
        return ProccessDataSyncResult.SUCCESS.value, profile_results
                
    def set_suppression(self, suppression: bool, domain_id: int, user: dict):
            credential = self.get_credentials(domain_id, user.get('id'))
            if not credential:
                raise HTTPException(status_code=403, detail=IntegrationsStatus.CREDENTIALS_NOT_FOUND.value)
            credential.suppression = suppression
            self.integrations_persisntece.db.commit()
            return {'message': 'successfuly'}  

    def get_profile(self, domain_id: int, fields: List[ContactFiled], date_last_sync: str = None) -> List[ContactSuppression]:
        credentials = self.get_credentials(domain_id)
        if not credentials:
            raise HTTPException(status_code=403, detail=IntegrationsStatus.CREDENTIALS_NOT_FOUND.value)
        params = {
            'fields[profile]': ','.join(fields),
        }
        if date_last_sync:
            params['filter'] = f'greater-than(created,{date_last_sync})'
        response = self.__handle_request(method='GET', url='https://a.klaviyo.com/api/profiles/', api_key=credentials.access_token, params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail={'status': "Profiles from Klaviyo could not be retrieved"})
        return [self.__mapped_profile_from_klaviyo(profile) for profile in response.json().get('data')]
    
    def __mapped_sales_force_profile(self, enrichment_user: EnrichmentUser, data_map: dict) -> dict:
        properties = self.__map_properties(enrichment_user, data_map) if data_map else {}
        first_email = get_valid_email(enrichment_user)
        
        if first_email in (ProccessDataSyncResult.INCORRECT_FORMAT.value):
            return first_email
        
        fake = Faker()

        first_phone = fake.phone_number()
        address_parts = fake.address()
        city_state_zip = address_parts.split("\n")[-1]

        match = re.match(r'^(.*?)(?:, ([A-Z]{2}) (\d{5}))?$', city_state_zip)

        if match:
            city = match.group(1).strip()
            state = match.group(2) if match.group(2) else ''
            zip_code = match.group(3) if match.group(3) else ''
        else:
            city, state, zip_code = '', '', ''
            
        gender = fake.passport_gender()
        first_name = fake.first_name()
        last_name = fake.last_name()
        
            
        json_data = {
            'FirstName': first_name,
            'LastName': last_name,
            'Email': first_email,
            'Phone': first_phone,
            'MobilePhone': first_phone,
            'Street': address_parts,
            'City': city,
            'State': state,
            'Country': 'USA',
            **properties,
            'Gender': gender
        }
        
        json_data = {k: v for k, v in json_data.items() if v is not None}
            
        return json_data
