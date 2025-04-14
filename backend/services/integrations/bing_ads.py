import os
from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from persistence.domains import UserDomainsPersistence
from services.integrations.commonIntegration import get_valid_email, get_valid_phone, get_valid_location
from schemas.integrations.integrations import *
from fastapi import HTTPException
from faker import Faker
import re
from models.enrichment_users import EnrichmentUser
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult, IntegrationLimit
import httpx
from utils import format_phone_number
from typing import List


class BingAdsIntegrationsService:

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
        credential = self.integrations_persisntece.get_credentials_for_service(domain_id=domain_id, user_id=user_id, service_name=SourcePlatformEnum.BING_ADS.value)
        return credential

    def __save_integrations(self, api_key: str, domain_id: int, user: dict):
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
            'service_name': SourcePlatformEnum.BING_ADS.value,
            'limit': IntegrationLimit.BING_ADS.value
        }

        if common_integration:
            integration_data['user_id'] = user.get('id')
        else:
            integration_data['domain_id'] = domain_id
            
        integartion = self.integrations_persisntece.create_integration(integration_data)
            
        if not integartion:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return integartion
        
    def edit_sync(self, leads_type: str, list_id: str, list_name: str, integrations_users_sync_id: int, domain_id: int, user_id: int, created_by: str, data_map: List[DataMap] = []):
        credentials = self.get_credentials(domain_id, user_id)
        sync = self.sync_persistence.edit_sync({
            'integration_id': credentials.id,
            'list_id': list_id,
            'list_name': list_name,
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
        return response.json()["access_token"]
        
    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        client_id = os.getenv("AZURE_CLIENT_ID")
        client_secret = os.getenv("AZURE_CLIENT_SECRET")
        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": credentials.bing_ads.code,
            "grant_type": "authorization_code",
            "redirect_uri": f"{os.getenv('SITE_HOST_URL')}/bing-ads-landing",
            'code_verifier': credentials.bing_ads.code_verifier
        }
        response = self.__handle_request(method='POST', url='https://login.microsoftonline.com/common/oauth2/v2.0/token', data=data, headers = {"Content-Type": "application/x-www-form-urlencoded"})
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access_token')
            refresh_token = token_data.get('refresh_token')
            integrations = self.__save_integrations(refresh_token, domain.id, user)
            return {
                'integrations': integrations,
                'status': IntegrationsStatus.SUCCESS.value
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
    async def create_sync(self, leads_type: str, domain_id: int, created_by: str, user: dict,data_map: List[DataMap] = []):
        credentials = self.get_credentials(domain_id, user.get('id'))
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        })
        return sync

    async def process_data_sync(self, user_integration, data_sync, enrichment_users: EnrichmentUser):
        profiles = []
        for enrichment_user in enrichment_users:
            profile = self.__mapped_bing_ads_profile(enrichment_users=enrichment_user)
            profiles.append(profile)
            
        result = self.__create_profile(access_token=user_integration.access_token, profiles=profiles)
        if result in (ProccessDataSyncResult.AUTHENTICATION_FAILED.value, ProccessDataSyncResult.INCORRECT_FORMAT.value):
            return profile
            
        return ProccessDataSyncResult.SUCCESS.value

    def __create_profile(self, access_token: str, profile: List[dict]):
        
        json_data = {
            'FirstName': profile.FirstName,
            'LastName': profile.LastName,
            'Email': profile.Email,
            'Phone': profile.Phone,
            'MobilePhone': profile.MobilePhone,
            'Company': profile.Company,
            'Title': profile.Title,
            'Industry': profile.Industry,
            'LeadSource': profile.LeadSource,
            'Street': profile.Street,
            'City': profile.City,
            'State': profile.State,
            'Country': profile.Country,
            'NumberOfEmployees': profile.NumberOfEmployees,
            'AnnualRevenue': profile.AnnualRevenue,
            'Description': profile.Description
        }
        
        json_data = {k: v for k, v in json_data.items() if v is not None}
        access_token = self.get_access_token(access_token)
        response = self.create_or_update_lead(instance_url=instance_url, access_token=access_token, data=json_data)
        
        if response.status_code == 400:
                return ProccessDataSyncResult.INCORRECT_FORMAT.value
        if response.status_code == 401:
                return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
            
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
    
    def __mapped_bing_ads_profile(self, enrichment_user: EnrichmentUser):
        emails_list = [e.email.email for e in enrichment_user.emails_enrichment]
        first_email = get_valid_email(emails_list)
        fake = Faker()

        first_phone = fake.phone_number()
        address_parts = fake.address().split("\n")
        city_state_zip = address_parts[-1]

        match = re.match(r'^(.*?)(?:, ([A-Z]{2}) (\d{5}))?$', city_state_zip)

        if match:
            city = match.group(1).strip()
            state = match.group(2) if match.group(2) else ''
            zip_code = match.group(3) if match.group(3) else ''
        else:
            city, state, zip_code = '', '', ''
            
        gender = ''
        
        if enrichment_user.gender == 1:
            gender = 'm'
        elif enrichment_user.gender == 2:
            gender = 'f'
            
        first_name = fake.first_name()
        last_name = fake.last_name()
        
        birth_year, birth_month, birth_day = self.get_birth_date_from_age(enrichment_user.age)
            
        return {
            FirstName=getattr(five_x_five_user, 'first_name', None),
            LastName=getattr(five_x_five_user, 'last_name', None),
            Email=first_email,
            Phone=', '.join(phone_number.split(', ')[-3:]) if phone_number else None,
            MobilePhone=', '.join(mobile_phone.split(', ')[-3:]) if mobile_phone else None,
            Company=company_name,
            Title=getattr(five_x_five_user, 'job_title', None),
            Industry=getattr(five_x_five_user, 'primary_industry', None),
            LeadSource='Web',
            City=location.get('city'),
            State=location.get('region'),
            Country='USA',
            NumberOfEmployees=company_employee_count,
            AnnualRevenue=company_revenue,
            Description=description 
        }
