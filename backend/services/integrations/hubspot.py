import logging

from pydantic import EmailStr

from enums import SourcePlatformEnum, IntegrationsStatus, ProccessDataSyncResult
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
import httpx
import os
from datetime import datetime, timedelta
from fastapi import HTTPException

from typing import List

from schemas.integrations.hubspot import HubspotProfile
from schemas.integrations.integrations import DataMap
from schemas.integrations.integrations import IntegrationCredentials
from services.integrations.commonIntegration import get_valid_email, get_valid_phone, get_valid_location
from services.integrations.million_verifier import MillionVerifierIntegrationsService


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

    def __save_integrations(self, api_key: str, domain_id: int, user: dict):
        credential = self.get_credentials(domain_id)
        if credential:
            credential.access_token = api_key
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persisntece.db.commit()
            return credential
              
        common_integration = bool(os.getenv('COMMON_INTEGRATION'))
        integration_data = {
            'access_token': api_key,
            'full_name': user.get('full_name'),
            'service_name': SourcePlatformEnum.HUBSPOT.value
        }

        if common_integration:
            integration_data['user_id'] = user.get('id')
        else:
            integration_data['domain_id'] = domain_id
            
        integartion = self.integrations_persisntece.create_integration(integration_data)
        
        
        if not integartion:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        
        return integartion

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
        integartions = self.__save_integrations(credentials.hubspot.access_token, domain.id, user)
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

    def edit_sync(self, leads_type: str, integrations_users_sync_id: int,
                 domain_id: int, created_by: str,  user_id: int, data_map: List[DataMap] = None):
        credentials = self.get_credentials(domain_id, user_id)
        sync = self.sync_persistence.edit_sync({
            'integration_id': credentials.id,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        }, integrations_users_sync_id)

        return sync

    async def process_data_sync(self, five_x_five_user, user_integration, data_sync, lead_user):
        profile = self.__create_profile(five_x_five_user, user_integration.access_token, data_sync.data_map)

        if profile in (
                ProccessDataSyncResult.AUTHENTICATION_FAILED.value,
                ProccessDataSyncResult.INCORRECT_FORMAT.value,
                ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value
        ):
            return profile

        return ProccessDataSyncResult.SUCCESS.value

    def __create_profile(self, five_x_five_user, access_token, data_map):
        profile = self.__mapped_profile(five_x_five_user)

        if isinstance(profile, str):
            return profile

        email = profile.email
        if not email:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        properties = self.__map_properties(five_x_five_user, data_map) if data_map else {}
        json_data = {
            "properties": {
                "email": profile.email,
                "firstname": profile.firstname,
                "lastname": profile.lastname,
                "phone": profile.phone,
                "city": profile.city,
                "gender": profile.gender,
                "twitterhandle": profile.twitterhandle,

                # "address": profile.address,
                # "state": profile.state,
                # "zip": profile.zip,
                # "company": profile.company,
                # "jobtitle": profile.jobtitle,
                # "website": profile.website,
                # "lifecyclestage": profile.lifecyclestage,
                # "industry": profile.industry,
                # "annualrevenue": profile.annualrevenue,
                # "hs_linkedin_url": profile.hs_linkedin_url,
                **properties
            }
        }

        json_data["properties"] = {k: v for k, v in json_data["properties"].items() if v is not None}

        response = self.__handle_request(
            url="https://api.hubapi.com/crm/v3/objects/contacts",
            method="POST",
            access_token=access_token,
            json=json_data
        )

        if response.status_code not in (200, 201):
            if response.status_code in (403, 401):
                return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
            if response.status_code == 400:
                return ProccessDataSyncResult.INCORRECT_FORMAT.value
            logging.error("Error response: %s", response.text)
            return None

        return response.json()

    def __mapped_profile(self, five_x_five_user) -> HubspotProfile:
        first_email = get_valid_email(
            five_x_five_user,
            self.million_verifier_integrations
        )

        if first_email in (
        ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return first_email

        first_phone = get_valid_phone(five_x_five_user)
        location = get_valid_location(five_x_five_user)

        return HubspotProfile(
            email=first_email,
            phone=first_phone,
            lifecyclestage=None,
            twitterhandle=None,
            address=location[0],
            city=location[1],
            state=location[2],
            zip=location[3],
            firstname=getattr(five_x_five_user, 'first_name', None),
            lastname=getattr(five_x_five_user, 'last_name', None),
            company=getattr(five_x_five_user, 'company_name', None),
            website=getattr(five_x_five_user, 'company_domain', None),
            jobtitle=getattr(five_x_five_user, 'job_title', None),
            industry=getattr(five_x_five_user, 'primary_industry', None),
            annualrevenue=getattr(five_x_five_user, 'company_revenue', None),
            hs_linkedin_url=getattr(five_x_five_user, 'linkedin_url', None),
            gender=getattr(five_x_five_user, 'gender', None)
        )


    def __map_properties(self, five_x_five_user, data_map: List[DataMap]) -> dict:
        properties = {}
        for mapping in data_map:
            five_x_five_field = mapping.get("type")
            new_field = mapping.get("value")
            value_field = getattr(five_x_five_user, five_x_five_field, None)

            if value_field is not None:
                properties[new_field] = value_field.isoformat() if isinstance(value_field, datetime) else value_field

        return properties

