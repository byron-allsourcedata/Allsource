import logging
import re
import json
from pydantic import EmailStr

from enums import SourcePlatformEnum, IntegrationsStatus, ProccessDataSyncResult, DataSyncType, IntegrationLimit
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
import httpx
import os
from services.integrations.commonIntegration import *
from models.integrations.users_domains_integrations import UserIntegration
from models.integrations.integrations_users_sync import IntegrationUserSync
from fastapi import HTTPException
from models.enrichment.enrichment_users import EnrichmentUser
from typing import List
from schemas.integrations.integrations import DataMap
from schemas.integrations.integrations import IntegrationCredentials
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from uuid import UUID


class HubspotIntegrationsService:
    def __init__(self, domain_persistence: UserDomainsPersistence, integrations_persistence: IntegrationsPresistence,
                 leads_persistence: LeadsPersistence,
                 sync_persistence: IntegrationsUserSyncPersistence, client: httpx.Client,
                 million_verifier_integrations: MillionVerifierIntegrationsService):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.client = client

    def __handle_request(self, method: str, url: str, headers: dict = None, json: dict = None, data: dict = None,
                         params: dict = None, access_token: str = None):

        if not headers:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        response = self.client.request(method, url, headers=headers, json=json, data=data, params=params)
        if response.is_redirect:
            redirect_url = response.headers.get('Location')
            if redirect_url:
                response = self.client.request(method, redirect_url, headers=headers, json=json, data=data,
                                               params=params)
        return response

    def get_credentials(self, domain_id: int, user_id: int):
        credential = self.integrations_persisntece.get_credentials_for_service(domain_id=domain_id, user_id=user_id, service_name=SourcePlatformEnum.HUBSPOT.value)
        return credential

    def get_smart_credentials(self, user_id: int):
        credential = self.integrations_persisntece.get_smart_credentials_for_service(user_id=user_id, service_name=SourcePlatformEnum.HUBSPOT.value)
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
            'service_name': SourcePlatformEnum.HUBSPOT.value,
            'limit': IntegrationLimit.HUBSPOT.value
        }

        if common_integration:
            integration_data['user_id'] = user.get('id')
        else:
            integration_data['domain_id'] = domain_id
            
        integration = self.integrations_persisntece.create_integration(integration_data)
        
        
        if not integration:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        
        return integration

    def test_API_key(self, access_token: str):
        json_data = {
            "properties": {
                "email": "testTest",
                "firstname": "Test Test",
                "lastname": "Test Test",
                "phone": "123-456-7890",
                "company": "Test"
              }
        }
        response = self.__handle_request(
            method='POST',
            url='https://api.hubapi.com/crm/v3/objects/contacts',
            access_token=access_token,
            json=json_data
        )

        if response.status_code == 400:
            return True
        return False

    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        try:
            if self.test_API_key(credentials.hubspot.access_token) == False:
                raise HTTPException(status_code=400, detail=IntegrationsStatus.CREDENTAILS_INVALID.value)
        except:
            raise HTTPException(status_code=400, detail=IntegrationsStatus.CREDENTAILS_INVALID.value)
        integartions = self.__save_integrations(credentials.hubspot.access_token, None if domain is None else domain.id, user)
        return {
            'integartions': integartions,
            'status': IntegrationsStatus.SUCCESS.value
        }

    async def create_sync(self, domain_id: int, created_by: str, user: dict, data_map: List[DataMap] = None, leads_type: str = None):
        credentials = self.get_credentials(domain_id=domain_id, user_id=user.get('id'))
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        })
        return sync

    def create_smart_audience_sync(self, smart_audience_id: UUID, sent_contacts: int, data_map: List[DataMap], created_by: str,  user: dict):
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

    def edit_sync(self, leads_type: str, integrations_users_sync_id: int,
                 domain_id: int, created_by: str,  user_id: int, data_map: List[DataMap] = None):
        credentials = self.get_credentials(domain_id, user_id)
        sync = self.sync_persistence.edit_sync({
            'integration_id': credentials.id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        }, integrations_users_sync_id)

        return sync

    async def process_data_sync(self, user_integration: UserIntegration, integration_data_sync: IntegrationUserSync, enrichment_users: EnrichmentUser, target_schema: str, validations: dict):
        profiles = []
        for enrichment_user in enrichment_users:
            profile = self.__mapped_profile(enrichment_user, target_schema, validations, integration_data_sync.data_map)
            if profile:
                profiles.append(profile)
        
        if not profiles:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value
        
        list_response = self.__create_profiles(user_integration.access_token, profiles)
        return list_response

    def __create_profiles(self, access_token, profiles_list):
        emails = [p.get("email") for p in profiles_list if p.get("email")]
        search_payload = {
            "filterGroups": [{
                "filters": [{
                    "propertyName": "email",
                    "operator": "IN",
                    "values": emails
                }]
            }],
            "properties": ["email"]
        }
        search_resp = self.__handle_request(
            url="https://api.hubapi.com/crm/v3/objects/contacts/search",
            method="POST",
            access_token=access_token,
            json=search_payload
        )
        if search_resp.status_code != 200:
            logging.error("Search failed: %s", search_resp.text)
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        existing = {
            item["properties"]["email"]: item["id"]
            for item in search_resp.json().get("results", [])
        }

        to_create = []
        to_update = []
        for props in profiles_list:
            clean_props = {k: v for k, v in props.items() if v is not None and k != "email"}
            email = props.get("email")
            if email in existing:
                to_update.append({
                    "id": existing[email],
                    "properties": clean_props
                })
            else:
                to_create.append({
                    "properties": clean_props
                })
                
        if to_create:
            create_resp = self.__handle_request(
                url="https://api.hubapi.com/crm/v3/objects/contacts/batch/create",
                method="POST",
                access_token=access_token,
                json={"inputs": to_create}
            )
            
            if create_resp.status_code == 402:
                category = create_resp.json().get("category")
                logging.warning(category)
                if category == "PAYMENT_REQUIRED":
                    return ProccessDataSyncResult.PAYMENT_REQUIRED.value
                
            if create_resp.status_code not in (200, 201):
                logging.error("Batch create failed: %s", create_resp.text)
                return ProccessDataSyncResult.INCORRECT_FORMAT.value

        if to_update:
            update_resp = self.__handle_request(
                url="https://api.hubapi.com/crm/v3/objects/contacts/batch/update",
                method="POST",
                access_token=access_token,
                json={"inputs": to_update}
            )
            
            if update_resp.status_code not in (200, 201):
                logging.error("Batch update failed: %s", update_resp.text)
                return ProccessDataSyncResult.INCORRECT_FORMAT.value

        return ProccessDataSyncResult.SUCCESS.value

    
    def __mapped_profile(self, enrichment_user: EnrichmentUser, target_schema: str, validations: dict, data_map: list) -> dict:
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

        result = {
            'email': main_email,
            'firstname': first_name,
            'lastname': last_name
        }
        
        required_types = {m['type'] for m in data_map}
        context = {
            'main_phone': main_phone,
            'professional_profiles': enrichment_user.professional_profiles,
            'postal': enrichment_user.postal,
            'personal_profiles': enrichment_user.personal_profiles
        }

        for field_type in required_types:
            filler = FIELD_FILLERS.get(field_type)
            if filler:
                filler(result, context)
                
        return result
