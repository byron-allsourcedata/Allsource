from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.domains import UserDomainsPersistence
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from schemas.integrations.integrations import *
from schemas.integrations.klaviyo import *
import hashlib
import os
from faker import Faker
import re
import logging
from services.integrations.commonIntegration import get_valid_email, get_valid_phone, get_valid_location
from models.enrichment_users import EnrichmentUser
from fastapi import HTTPException
from datetime import datetime, timedelta
from schemas.integrations.mailchimp import MailchimpProfile
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult, DataSyncType, IntegrationLimit
import json
from utils import format_phone_number
from utils import extract_first_email, validate_and_format_phone
from typing import List
import mailchimp_marketing as MailchimpMarketing
from mailchimp_marketing.api_client import ApiClientError
from uuid import UUID


class MailchimpIntegrationsService:

    def __init__(self, domain_persistence: UserDomainsPersistence,
                 integrations_persistence: IntegrationsPresistence, leads_persistence: LeadsPersistence,
                 sync_persistence: IntegrationsUserSyncPersistence,
                 million_verifier_integrations: MillionVerifierIntegrationsService):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.client = MailchimpMarketing.Client()

    def get_credentials(self, domain_id: int, user_id: int):
        return self.integrations_persisntece.get_credentials_for_service(domain_id=domain_id, user_id=user_id,
                                                                         service_name=SourcePlatformEnum.MAILCHIMP.value)

    def get_smart_credentials(self, user_id: int):
        return self.integrations_persisntece.get_smart_credentials_for_service(user_id=user_id,
                                                                               service_name=SourcePlatformEnum.MAILCHIMP.value)

    def create_list(self, list_data, domain_id: int, user_id: int):
        credential = self.get_credentials(domain_id, user_id)
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
            {"name": "DPV Code", "tag": "DPV_CODE", "type": "text"},
            {"name": "TIME ON SITE", "tag": "TIME_ON_SITE", "type": "text"},
            {"name": "URL VISITED", "tag": "URL_VISITED", "type": "text"}
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

    def get_list(self, user_id: int, domain_id: int, api_key: str = None, server: str = None):
        if api_key and server:
            self.client.set_config({
                'api_key': api_key,
                'server': server
            })
        else:
            credentials = self.get_credentials(domain_id, user_id)
            if not credentials: return
            self.client.set_config({
                'api_key': credentials.access_token,
                'server': credentials.data_center
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

    def __save_integation(self, domain_id: int, api_key: str, server: str, user: dict):
        credential = self.get_credentials(domain_id=domain_id, user_id=user.get('id'))
        if credential:
            credential.access_token = api_key
            credential.data_center = server
            credential.is_failed = False
            self.integrations_persisntece.db.commit()
            return credential

        common_integration = os.getenv('COMMON_INTEGRATION') == 'True'
        integration_data = {
            'access_token': api_key,
            'data_center': server,
            'full_name': user.get('full_name'),
            'service_name': SourcePlatformEnum.MAILCHIMP.value,
            'limit': IntegrationLimit.MAILCHIMP.value
        }

        if common_integration:
            integration_data['user_id'] = user.get('id')
        else:
            integration_data['domain_id'] = domain_id

        integartion = self.integrations_persisntece.create_integration(integration_data)

        if not integartion:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})

        return integartion

    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        data_center = credentials.mailchimp.api_key.split('-')[-1]
        try:
            lists = self.get_list(api_key=credentials.mailchimp.api_key, domain_id=domain.id, user_id=user.get('id'),
                                  server=data_center)
            if not lists:
                raise HTTPException(status_code=200, detail={"status": IntegrationsStatus.CREDENTAILS_INVALID.value})
        except:
            raise HTTPException(status_code=200, detail={'status': IntegrationsStatus.CREDENTAILS_INVALID.value})
        integration = self.__save_integation(domain_id=domain.id, api_key=credentials.mailchimp.api_key,
                                             server=data_center, user=user)
        return integration

    async def create_sync(self, leads_type: str, list_id: str, list_name: str, data_map: List[DataMap], domain_id: int,
                          created_by: str, user: dict):
        credentials = self.get_credentials(domain_id=domain_id, user_id=user.get('id'))
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'list_id': list_id,
            'list_name': list_name,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        })
        return sync

    def create_smart_audience_sync(self, smart_audience_id: UUID, sent_contacts: int, list_id: str, list_name: str,
                                   data_map: List[DataMap], created_by: str, user: dict):
        credentials = self.get_smart_credentials(user_id=user.get('id'))
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'list_id': list_id,
            'list_name': list_name,
            'sent_contacts': sent_contacts,
            'sync_type': DataSyncType.AUDIENCE.value,
            'smart_audience_id': smart_audience_id,
            'data_map': data_map,
            'created_by': created_by,
        })
        return sync

    async def process_data_sync(self, access_token: str, integration_data_sync, enrichment_users: EnrichmentUser):
        profiles = []
        for enrichment_user in enrichment_users:
            profile = self.__mapped_member_into_list(enrichment_user, integration_data_sync.data_map)
            profiles.append(profile)
            
        
        profile = self.__create_profile(access_token, integration_data_sync, profiles)
        if profile in (ProccessDataSyncResult.AUTHENTICATION_FAILED.value, ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.LIST_NOT_EXISTS.value):
            return profile

        return ProccessDataSyncResult.SUCCESS.value
    
    def sync_contacts_bulk(self, list_id: str, profiles_list: list):
        operations = []
        for profile in profiles_list:
            email = profile.get("email_address")
            subscriber_hash = hashlib.md5(email.lower().encode()).hexdigest()

            props = {k: v for k, v in profile.items() if v is not None}
            props["email_address"] = email

            operations.append({
                "method": "PUT",
                "path": f"/lists/{list_id}/members/{subscriber_hash}",
                "operation_id": subscriber_hash,
                "body": json.dumps(props)
            })

        try:
            batch = self.client.batches.start({
                "operations": operations
            })
        except ApiClientError as error:
            logging.error("Batch operation failed: %s", error.text)
            ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        
        return ProccessDataSyncResult.SUCCESS.value

    def __create_profile(self, user_integration, integration_data_sync, profiles: EnrichmentUser):
        self.client.set_config({
            'api_key': user_integration.access_token,
            'server': user_integration.data_center
        })
        
        try:
            existing_fields = self.client.lists.get_list_merge_fields(integration_data_sync.list_id)
            existing_field_names = [field['name'] for field in existing_fields['merge_fields']]
            if "estimated_household_income_code" not in existing_field_names:
                self.client.lists.add_list_merge_field(integration_data_sync.list_id, {
                    "name": "estimated_household_income_code",
                    "type": "number",
                    "tag": "EstimatedHouseholdIncomeCode"
                })

        except ApiClientError as error:
            if error.status_code == 404:
                return ProccessDataSyncResult.LIST_NOT_EXISTS.value
        try:
            response = self.sync_contacts_bulk(integration_data_sync.list_id, profiles)
        except ApiClientError as error:
            raise error

        return response

    def edit_sync(self, leads_type: str, list_id: str, list_name: str, integrations_users_sync_id: int,
                  data_map: List[DataMap], domain_id: int, created_by: str, user_id: int):
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

    def __mapped_list(self, list):
        return ListFromIntegration(id=list['id'], list_name=list['name'])

    def __mapped_member_into_list(self, enrichment_user: EnrichmentUser, data_map: dict):
        emails_list = [e.email.email for e in enrichment_user.emails_enrichment]
        first_email = get_valid_email(emails_list)

        if first_email in (ProccessDataSyncResult.INCORRECT_FORMAT.value):
            return first_email
        
        if data_map:
            properties = self.__map_properties(enrichment_user, data_map)
        else:
            properties = {}
            
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
            'email_address': first_email,
            'status': 'subscribed',
            'email_type': 'text',
            "merge_fields": {
                "FNAME": first_name,
                "LNAME": last_name,
                'PHONE': first_phone if first_phone else 'N/A',
                'COMPANY': 'N/A',
                "ADDRESS": {
                    "addr1": address_parts or 'N/A',
                    "city": city or 'N/A',
                    "state": state or 'N/A',
                    "zip": zip_code or 'N/A',
                },
                # **properties
            },
        }
        return json_data

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

        mapped_fields = {mapping.get("value") for mapping in data_map}
        if "Time on site" in mapped_fields or "URL Visited" in mapped_fields:
            time_on_site, url_visited = self.leads_persistence.get_visit_stats(five_x_five_user.id)
        if "Time on site" in mapped_fields:
            properties["TIMEONSITE"] = time_on_site
        if "URL Visited" in mapped_fields:
            properties["URLVISITED"] = url_visited
        return properties
