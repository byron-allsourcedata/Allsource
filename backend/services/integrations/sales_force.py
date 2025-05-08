import os
import re
import csv
import logging
import io
import hashlib
from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from persistence.domains import UserDomainsPersistence
from schemas.integrations.integrations import *
from schemas.integrations.sales_force import SalesForceProfile
from fastapi import HTTPException
from faker import Faker
from services.integrations.commonIntegration import get_states_dataframe
from datetime import datetime, timedelta
from utils import extract_first_email
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult, DataSyncType, IntegrationLimit
import httpx
from models.enrichment.enrichment_users import EnrichmentUser
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
        writer = csv.DictWriter(output, fieldnames=records[0].keys(), lineterminator='\n')
        writer.writeheader()
        for rec in records:
            writer.writerow(rec)
        return output.getvalue()
    
    def generate_external_id(self, profile: dict) -> str:
        unique_value = profile.get('email')
        if not unique_value:
            unique_value = str(profile)
            
        return hashlib.md5(unique_value.encode('utf-8')).hexdigest()

    def bulk_upsert_leads(self, profiles: list[dict], instance_url: str, access_token: str) -> str:
        try:
            for profile in profiles:
                profile['External_Contact_ID__c'] = profile.get('Email')
                    
            job_payload = {
                "object": "Lead",
                "operation": "upsert",
                "externalIdFieldName": 'External_Contact_ID__c',
                "contentType": "CSV"
            }
            base_url = f"{instance_url}/services/data/v59.0/jobs/ingest"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            job_resp = self.__handle_request(method='POST', url=base_url, json=job_payload, headers=headers)
            job_resp.raise_for_status()
            job_id = job_resp.json()['id']

            csv_data = self._to_csv(profiles)
            upload_headers = {
                'Authorization': headers['Authorization'],
                'Content-Type': 'text/csv'
            }
            upload_url = f"{base_url}/{job_id}/batches"
            upload_resp = self.__handle_request(method='PUT', url=upload_url, data=csv_data, headers=upload_headers)
            upload_resp.raise_for_status()
            close_url = f"{base_url}/{job_id}"
            close_payload = {"state": "UploadComplete"}
            close_resp = self.__handle_request(method='PATCH', url=close_url, json=close_payload, headers=headers)
            close_resp.raise_for_status()
        except Exception as e:
            logging.error(e)
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        
        return ProccessDataSyncResult.SUCCESS.value
    
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
    
    def get_failed_results(self, job_id: str, instance_url: str, access_token: str) -> str:
        url = f"{instance_url}/services/data/v59.0/jobs/ingest/{job_id}/failedResults"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        response = self.__handle_request(method='GET', url=url, headers=headers)
        response.raise_for_status()
        return response.text

    async def process_data_sync(self, user_integration, data_sync, enrichment_users: EnrichmentUser):
        profiles = []
        access_token = self.get_access_token(user_integration.access_token)
        if not access_token:
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        
        for enrichment_user in enrichment_users:
            profile = self.__mapped_sales_force_profile(enrichment_user, data_sync.data_map)
            if profile:
                profiles.append(profile)
                
        if not profiles:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value
        
        response_result = self.bulk_upsert_leads(profiles=profiles, instance_url=user_integration.instance_url, access_token=access_token)
        if response_result in (ProccessDataSyncResult.AUTHENTICATION_FAILED.value, ProccessDataSyncResult.INCORRECT_FORMAT.value):
            return profile
            
        return ProccessDataSyncResult.SUCCESS.value
                
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
    
    def __map_properties(self, enrichment_user: EnrichmentUser, data_map: List[DataMap]) -> dict:
        properties = {}
        for mapping in data_map:
            five_x_five_field = mapping.get("type")  
            new_field = mapping.get("value")  
            value_field = getattr(enrichment_user, five_x_five_field, None)
            
            if value_field is not None: 
                properties[new_field] = value_field.isoformat() if isinstance(value_field, datetime) else value_field
            else:
                properties[new_field] = None
            
        return properties
    
    def __mapped_sales_force_profile(self, enrichment_user: EnrichmentUser, data_map: dict) -> dict:
        verified_email, verified_phone = self.sync_persistence.get_verified_email_and_phone(enrichment_user.id)
        enrichment_contacts = enrichment_user.contacts
        if not enrichment_contacts:
            return None
        first_name = enrichment_contacts.first_name
        last_name = enrichment_contacts.last_name
        
        fake = Faker()
        verified_email = fake.email()
        verified_phone = fake.phone_number()
        if not verified_email or not first_name or not last_name:
            return None
        
        enrichment_professional_profiles = enrichment_user.professional_profiles
        city = None
        state = None
        gender = None
        company_name = None
        
        if enrichment_professional_profiles:
            company_name = enrichment_professional_profiles.current_company_name
            
        if not company_name:
            return None
                    
        json_data = {
            'Email': verified_email,
            'FirstName': first_name,
            'LastName': last_name,
            
            'Business Email': 'Business Email',
            'Personal Email': 'Personal Email',
            'Phone': verified_phone,
            'City': city,
            'State': state,
            'Country': 'USA',
            'Company': company_name,
            'Gender__c': gender,
            'Business email last seen date': 'Business email last seen date',
            'Personal email last seen': 'Personal email last seen',
            'Linkedin url': 'Linkedin url'
        }
        
        required_types = {mapping.get('type') for mapping in data_map}
        
        if 'city' in required_types or 'state' in required_types:
            enrichment_postal = enrichment_user.enrichment_postals 
            if enrichment_postal:
                if 'city' in required_types:
                    json_data['city'] = enrichment_postal.city
                if 'state' in required_types:
                    json_data['state'] = enrichment_postal.state_name
        
        json_data = {k: v for k, v in json_data.items() if v is not None}
            
        return json_data
