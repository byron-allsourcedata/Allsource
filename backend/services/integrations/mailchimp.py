from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.domains import UserDomainsPersistence
from schemas.integrations.integrations import *
from schemas.integrations.klaviyo import *
from fastapi import HTTPException
from schemas.integrations.mailchimp import MailchimpProfile
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
import json
from utils import format_phone_number
from utils import extract_first_email, validate_and_format_phone
from typing import List
import mailchimp_marketing as MailchimpMarketing
from mailchimp_marketing.api_client import ApiClientError

class MailchimpIntegrationsService:

    def __init__(self, domain_persistence: UserDomainsPersistence, 
                 integrations_persistence: IntegrationsPresistence, leads_persistence: LeadsPersistence,
                 sync_persistence: IntegrationsUserSyncPersistence):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.client = MailchimpMarketing.Client()

    def get_credentials(self, domain_id: int):
        return self.integrations_persisntece.get_credentials_for_service(domain_id, SourcePlatformEnum.MAILCHIMP.value)
    
    def create_list(self, list_data, domain_id):
        credential = self.get_credentials(domain_id)
        response = None
        self.client.set_config({
            'api_key': credential.access_token,
            'server': credential.data_center
        })
        list_info = {
            "name": list_data.name,
            "permission_reminder": "You are receiving this email because you signed up for updates.",
            "email_type_option": True,
            "contact": {
                "company": "Default Company",
                "address1": "123 Default St.",
                "city": "Default City",
                "state": "Default State",
                "zip": "00000",
                "country": "US"
            },
            "campaign_defaults": {
            "from_name": "Maximiz",
            "from_email": "login@maximiz.ai",
            "subject": "Welcome to Our Updates",
            "language": "en"
            }
        }
        custom_fields = [
            {"name": "Gender", "tag": "GENDER", "type": "text"},
            {"name": "Company Domain", "tag": "COMPANY_DOMAIN", "type": "text"},
            {"name": "Company SIC", "tag": "COMPANY_SIC", "type": "text"},
            {"name": "Company LinkedIn URL", "tag": "COMPANY_LI_URL", "type": "text"},
            {"name": "Company Revenue", "tag": "COMPANY_REV", "type": "text"},
            {"name": "Company Employee Count", "tag": "COMPANY_EMP", "type": "text"},
            {"name": "Net Worth", "tag": "NET_WORTH", "type": "text"},
            {"name": "Last Updated", "tag": "LAST_UPDATED", "type": "text"},
            {"name": "Personal Emails Last Seen", "tag": "PE_LAST_SEEN", "type": "text"},
            {"name": "Company Last Updated", "tag": "COMPANY_LAST_UPD", "type": "text"},
            {"name": "Job Title Last Updated", "tag": "JOB_TITLE_LAST", "type": "text"},
            {"name": "Age Min", "tag": "AGE_MIN", "type": "text"},
            {"name": "Age Max", "tag": "AGE_MAX", "type": "text"},
            {"name": "Additional Personal Emails", "tag": "ADD_PERSONAL_EMAILS", "type": "text"},
            {"name": "LinkedIn URL", "tag": "LINKEDIN_URL", "type": "text"},
            {"name": "Married", "tag": "MARRIED", "type": "text"},
            {"name": "Children", "tag": "CHILDREN", "type": "text"},
            {"name": "Income Range", "tag": "INCOME_RANGE", "type": "text"},
            {"name": "Homeowner", "tag": "HOMEOWNER", "type": "text"},
            {"name": "Seniority Level", "tag": "SENIORITY", "type": "text"},
            {"name": "Department", "tag": "DEPARTMENT", "type": "text"},
            {"name": "Primary Industry", "tag": "PRIMARY_INDUSTRY", "type": "text"},
            {"name": "Work History", "tag": "WORK_HISTORY", "type": "text"},
            {"name": "Education History", "tag": "EDUCATION_HISTORY", "type": "text"},
            {"name": "Company Description", "tag": "COMPANY_DESC", "type": "text"},
            {"name": "Related Domains", "tag": "RELATED_DOMAINS", "type": "text"},
            {"name": "Social Connections", "tag": "SOCIAL_CONN", "type": "text"},
            {"name": "DPV Code", "tag": "DPV_CODE", "type": "text"}
        ]
        try:
            response = self.client.lists.create_list(list_info)
            list_id = response['id']
            for field in custom_fields:
                self.client.lists.add_list_merge_field(list_id, field)

        except ApiClientError as error:
            if error.status_code == 403:
                return ({
                    'status': IntegrationsStatus.CREATE_IS_FAILED.value
                })
            if error.status_code == 401:
                credential.error_message = 'Invalid API Key'
                credential.is_failed = True
                self.integrations_persisntece.db.commit()
                return ({
                    'status': IntegrationsStatus.CREDENTAILS_INVALID.value
                })

        return self.__mapped_list(response) if response else None


    def get_list(self, domain_id: int = None, api_key: str = None, server: str = None):
        if domain_id:
            credentials = self.get_credentials(domain_id)
            if not credentials: return
            self.client.set_config({
                'api_key': credentials.access_token,
                'server': credentials.data_center
            })
        else:
            self.client.set_config({
                'api_key': api_key,
                'server': server
            })
        try:
            response = self.client.lists.get_all_lists()
            return [self.__mapped_list(list) for list in response.get('lists')]
        except ApiClientError as error:
            if credentials:
                credentials.error_message = json.loads(error.text).get('detail')
                credentials.is_failed = True
                self.integrations_persisntece.db.commit()
                return


    def __save_integation(self, domain_id: int, api_key: str, server: str):
        credential = self.get_credentials(domain_id)
        if credential:
            credential.access_token = api_key
            credential.data_center = server
            credential.is_failed = False
            self.integrations_persisntece.db.commit()
            return credential
        integartions = self.integrations_persisntece.create_integration({
            'domain_id': domain_id,
            'access_token': api_key,
            'data_center': server,
            'service_name': SourcePlatformEnum.MAILCHIMP.value
        })
        if not integartions:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return integartions


    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        data_center = credentials.mailchimp.api_key.split('-')[-1]
        try:
            lists = self.get_list(api_key=credentials.mailchimp.api_key, server=data_center)
            if not lists:
                raise HTTPException(status_code=200, detail={"status": IntegrationsStatus.CREDENTAILS_INVALID.value})
        except:
            raise HTTPException(status_code=200, detail={'status': IntegrationsStatus.CREDENTAILS_INVALID.value})
        integration = self.__save_integation(domain_id=domain.id, api_key=credentials.mailchimp.api_key, server=data_center)
        return integration

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

    async def process_data_sync(self, five_x_five_user, access_token, integration_data_sync):
        profile = self.__create_profile(five_x_five_user, access_token, integration_data_sync)
        if profile == ProccessDataSyncResult.AUTHENTICATION_FAILED.value or profile == ProccessDataSyncResult.INCORRECT_FORMAT.value:
            return profile
            
        return ProccessDataSyncResult.SUCCESS.value

    def __create_profile(self, five_x_five_user, user_integration, integration_data_sync):
        profile = self.__mapped_member_into_list(five_x_five_user)
        if profile == ProccessDataSyncResult.INCORRECT_FORMAT.value:
            return profile
        if integration_data_sync.data_map:
            properties = self.__map_properties(five_x_five_user, integration_data_sync.data_map)
        else:
            properties = {}
        self.client.set_config({
            'api_key': user_integration.access_token,
            'server': user_integration.data_center
        })
        phone_number = validate_and_format_phone(profile.phone_number)
        json_data = {
                    'email_address': profile.email,
                    'status': profile.status,
                    'email_type': profile.email_type,
                    "merge_fields": {
                        "FNAME": profile.first_name,
                        "LNAME": profile.last_name,
                        'PHONE': phone_number.split(', ')[-1] if phone_number else 'N/A',
                        'COMPANY': profile.company_name or 'N/A',
                        "ADDRESS": {
                            "addr1": profile.location['address'] or 'N/A',
                            "city": profile.location['city'] or 'N/A',
                            "state": profile.location['region'] or 'N/A',
                            "zip": profile.location['zip'] or 'N/A',
                            },
                        **properties
                    },
        }
        try:
            response = self.client.lists.add_list_member(integration_data_sync.list_id, json_data)
        except ApiClientError as error:
            if error.status_code == 400:
                return "Already exists"
            
            if error.status_code == 403:
                return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
            
            raise error

        return response

    def edit_sync(self, leads_type: str, list_id: str, list_name: str, integrations_users_sync_id: int,
                  data_map: List[DataMap], domain_id: int, created_by: str):
        credentials = self.get_credentials(domain_id)
        data_syncs = self.sync_persistence.get_filter_by(domain_id=domain_id)
        for sync in data_syncs:
            if sync.get('integration_id') == credentials.id and sync.get('leads_type') == leads_type:
                return
        sync = self.sync_persistence.edit_sync({
            'integration_id': credentials.id,
            'list_id': list_id,
            'list_name': list_name,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        }, integrations_users_sync_id)

        return sync

    def __mapped_list(self, list):
        return ListFromIntegration(id=list['id'], list_name=list['name'])
    
    def __mapped_member_into_list(self, five_x_five_user: FiveXFiveUser):
        first_email = (
            getattr(five_x_five_user, 'business_email') or 
            getattr(five_x_five_user, 'personal_emails') or 
            getattr(five_x_five_user, 'additional_personal_emails') or
            getattr(five_x_five_user, 'programmatic_business_emails', None)
        )
        first_email = extract_first_email(first_email) if first_email else None
        if not first_email:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value
        
        first_phone = (
            getattr(five_x_five_user, 'mobile_phone') or 
            getattr(five_x_five_user, 'personal_phone') or 
            getattr(five_x_five_user, 'direct_number') or 
            getattr(five_x_five_user, 'company_phone', None)
        )

        location = {
            "address": getattr(five_x_five_user, 'personal_address') or getattr(five_x_five_user, 'company_address', None),
            "city": getattr(five_x_five_user, 'personal_city') or getattr(five_x_five_user, 'company_city', None),
            "region": getattr(five_x_five_user, 'personal_state') or getattr(five_x_five_user, 'company_state', None),
            "zip": getattr(five_x_five_user, 'personal_zip') or getattr(five_x_five_user, 'company_zip', None),
        }
        return MailchimpProfile(
            email=first_email,
            phone_number=format_phone_number(first_phone),
            first_name=getattr(five_x_five_user, 'first_name', None),
            last_name=getattr(five_x_five_user, 'last_name', None),
            organization=getattr(five_x_five_user, 'company_name', None),
            location=location,
            job_title=getattr(five_x_five_user, 'job_title', None),
            company_name=getattr(five_x_five_user, 'company_name', None),
            status='subscribed',
            email_type='text'
            )
        
    def __map_properties(self, five_x_five_user: FiveXFiveUser, data_map: List[DataMap]) -> dict:
        properties = {}
        for mapping in data_map:
            five_x_five_field = mapping.get("type")  
            new_field = mapping.get("value")  
            value_field = getattr(five_x_five_user, five_x_five_field, None)
            if value_field is not None:
                new_field = new_field.replace(" ", "_").upper()
                if isinstance(value_field, datetime):
                    properties[new_field] = value_field.strftime("%Y-%m-%d")
                else:
                    if isinstance(value_field, str):
                        if len(value_field) > 2048:
                            value_field = value_field[:2048]
                    properties[new_field] = value_field
                    
        return properties
    