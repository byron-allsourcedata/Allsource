import os
from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from persistence.domains import UserDomainsPersistence
from schemas.integrations.integrations import *
from schemas.integrations.sales_force import SalesForceProfile
from fastapi import HTTPException
from datetime import datetime, timedelta
from utils import extract_first_email
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult, DataSyncType
import httpx
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
            'service_name': SourcePlatformEnum.SALES_FORCE.value
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
    
    def update_lead(self, instance_url: str, access_token: str, lead_id: int, data: dict):
        url = f"{instance_url}/services/data/v59.0/sobjects/Lead/{lead_id}"
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        response = self.__handle_request(method='PATCH', url=url, json=data, headers=headers)
        return response

    def create_or_update_lead(self, instance_url: str, access_token: str, data: dict):
        url = f"{instance_url}/services/data/v59.0/sobjects/Lead"
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        response = self.__handle_request(method='POST', url=url, json=data, headers=headers)
        
        if response.status_code == 400:
            error_data = response.json()
            lead_id = error_data[0]["duplicateResult"]["matchResults"][0]["matchRecords"][0]["record"]["Id"]
            return self.update_lead(instance_url=instance_url, access_token=access_token, lead_id=lead_id, data=data)

        return response
    
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
    
    def create_smart_audience_sync(self, smart_audience_id: UUID, sent_contacts: int, domain_id: int, created_by: str, data_map: List[DataMap] = []):
        credentials = self.get_credentials(domain_id)
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'domain_id': domain_id,
            'sent_contacts': sent_contacts,
            'sync_type': DataSyncType.AUDIENCE.value,
            'smart_audience_id': smart_audience_id,
            'data_map': data_map,
            'created_by': created_by,
        })
        return sync

    async def process_data_sync(self, five_x_five_user, user_integration, data_sync, lead_user):
        profile = self.__create_profile(five_x_five_user=five_x_five_user, access_token=user_integration.access_token, instance_url=user_integration.instance_url)
        if profile in (ProccessDataSyncResult.AUTHENTICATION_FAILED.value, ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return profile
            
        return ProccessDataSyncResult.SUCCESS.value

    def __create_profile(self, five_x_five_user: FiveXFiveUser, access_token: str, instance_url: str):
        profile = self.__mapped_sales_force_profile(five_x_five_user)
        if profile in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return profile

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
        try:
            access_token = self.get_access_token(access_token)
            if not access_token:
                return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        except Exception:
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value 
        
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
    
    def __mapped_sales_force_profile(self, five_x_five_user: FiveXFiveUser) -> SalesForceProfile:
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
        
        company_name = getattr(five_x_five_user, 'company_name', None)
        if not company_name:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value
        
        first_phone = (
            getattr(five_x_five_user, 'mobile_phone') or 
            getattr(five_x_five_user, 'personal_phone') or 
            getattr(five_x_five_user, 'direct_number') or 
            getattr(five_x_five_user, 'company_phone', None)
        )
        phone_number = validate_and_format_phone(first_phone)
        mobile_phone = getattr(five_x_five_user, 'mobile_phone', None)
        
        location = {
            "address1": getattr(five_x_five_user, 'personal_address') or getattr(five_x_five_user, 'company_address', None),
            "city": getattr(five_x_five_user, 'personal_city') or getattr(five_x_five_user, 'company_city', None),
            "region": getattr(five_x_five_user, 'personal_state') or getattr(five_x_five_user, 'company_state', None),
            "zip": getattr(five_x_five_user, 'personal_zip') or getattr(five_x_five_user, 'company_zip', None),
        }
        
        description = getattr(five_x_five_user, 'company_description', None)
        if description:
            description = description[:9999]
            
        company_employee_count = getattr(five_x_five_user, 'company_employee_count', None)
        if company_employee_count:
            company_employee_count = str(company_employee_count).replace('+', '')
            if 'to' in company_employee_count:
                start, end = company_employee_count.split(' to ')
                company_employee_count = (int(start) + int(end)) // 2
            else:
                company_employee_count = int(company_employee_count)
            company_employee_count = str(company_employee_count)
            
        company_revenue = getattr(five_x_five_user, 'company_revenue', None)
        if company_revenue:
            try:
                company_revenue = str(company_revenue).replace('+', '').split(' to ')[-1]
                if 'Billion' in company_revenue:
                    cleaned_value = float(company_revenue.split()[0]) * 10**9
                elif 'Million' in company_revenue:
                    cleaned_value = float(company_revenue.split()[0]) * 10**6
                elif company_revenue.isdigit():
                    cleaned_value = float(company_revenue)
                else:
                    cleaned_value = 0
            except:
                cleaned_value = 0
                
            company_revenue = str(cleaned_value)
            
        return SalesForceProfile(
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
        )
