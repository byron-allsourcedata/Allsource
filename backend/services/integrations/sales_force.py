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
from services.integrations.commonIntegration import *
from models.integrations.users_domains_integrations import UserIntegration
from models.integrations.integrations_users_sync import IntegrationUserSync
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
        
        all_keys = set()
        for rec in records:
            all_keys.update(rec.keys())
        
        writer = csv.DictWriter(output, fieldnames=list(all_keys), lineterminator='\n')
        writer.writeheader()
        
        for rec in records:
            full_rec = {key: rec.get(key, "") for key in all_keys}
            writer.writerow(full_rec)
        
        return output.getvalue()
    
    def generate_external_id(self, profile: dict) -> str:
        unique_value = profile.get('email')
        if not unique_value:
            unique_value = str(profile)
            
        return hashlib.md5(unique_value.encode('utf-8')).hexdigest()
    
    # def test(self, profiles, instance_url, access_token):
    #     url = f"{instance_url}/services/data/v59.0/sobjects/Lead"
    #     headers = {
    #         "Authorization": f"Bearer {access_token}",
    #         "Content-Type": "application/json"
    #     }
    #     response = self.__handle_request(method='POST', url=url, json=profiles[-3], headers=headers)
    #     if response.status_code == 201:
    #         print("Created:", response.json())
    #     elif response.status_code == 204:
    #         print("Updated existing record")
    #     else:
    #         print("Error:", response.status_code, response.json())

    def bulk_upsert_leads(self, profiles: list[dict], instance_url: str, access_token: str) -> str:
        try:        
            job_payload = {
                "object": "Lead",
                "operation": "upsert",
                "externalIdFieldName": "Id",
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
            refresh_token = token_data.get('refresh_token')
            instance_url = token_data.get('instance_url')
            integration = self.__save_integrations(refresh_token, instance_url, None if domain is None else domain.id, user)
            return {
                'integrations': integration,
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

    async def process_data_sync(self, user_integration: UserIntegration, integration_data_sync: IntegrationUserSync, enrichment_users: EnrichmentUser, target_schema: str, validations: dict):
        profiles = []
        access_token = self.get_access_token(user_integration.access_token)
        if not access_token:
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        
        for enrichment_user in enrichment_users:
            profile = self.__mapped_sales_force_profile(enrichment_user, target_schema, validations, integration_data_sync.data_map)
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
    
    def __mapped_sales_force_profile(self, enrichment_user: EnrichmentUser, target_schema: str, validations: dict, data_map: list) -> dict:
        enrichment_contacts = enrichment_user.contacts
        if not enrichment_contacts:
            return None
        
        business_email, personal_email, phone = self.sync_persistence.get_verified_email_and_phone(enrichment_user.id)
        main_email, main_phone = resolve_main_email_and_phone(enrichment_contacts=enrichment_contacts, validations=validations, target_schema=target_schema, 
                                                              business_email=business_email, personal_email=personal_email, phone=phone)
        first_name = enrichment_contacts.first_name
        last_name = enrichment_contacts.last_name
        
        if not main_email or not first_name or not last_name:
            return None
        
        professional_profiles = enrichment_user.professional_profiles
        if not professional_profiles:
            return None
        
        company = professional_profiles.current_company_name
        if not company:
            return None
        
        primary_industry = professional_profiles.primary_industry
        current_job_title = professional_profiles.current_job_title
        country = None
        state = None
        city = None
        postal_code = None
        if enrichment_user.postal:
            enrichment_postal = enrichment_user.postal
            country = enrichment_postal.home_country or enrichment_postal.business_country
            state = enrichment_postal.home_state or enrichment_postal.business_state
            city = enrichment_postal.home_city or enrichment_postal.business_city
            postal_code = enrichment_postal.home_postal_code or enrichment_postal.business_postal_code

        result = {
            # 'Id': str(enrichment_user.id),
            'Email': main_email,
            'FirstName': first_name,
            'LastName': last_name,
            'Company': company,
            'Title': current_job_title,
            'Phone': main_phone,
            "Industry": primary_industry,
            "City": city,
            "State": state,
            "PostalCode": postal_code,
            "Country": country,
        }
                
        return result
