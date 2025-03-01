from enums import SourcePlatformEnum, IntegrationsStatus
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
import httpx
from fastapi import HTTPException

from typing import List
from schemas.integrations.integrations import DataMap
from schemas.integrations.integrations import IntegrationCredentials
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

    def get_credentials(self, domain_id: str):
        credential = self.integrations_persisntece.get_credentials_for_service(domain_id, SourcePlatformEnum.HUBSPOT.value)
        return credential

    def __save_integrations(self, api_key: str, domain_id: int, user: dict):
        credential = self.get_credentials(domain_id)
        if credential:
            credential.access_token = api_key
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persisntece.db.commit()
            return credential
        integartions = self.integrations_persisntece.create_integration({
            'domain_id': domain_id,
            'access_token': api_key,
            'full_name': user.get('full_name'),
            'service_name': SourcePlatformEnum.HUBSPOT.value
        })
        if not integartions:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return integartions

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

    async def create_sync(self, domain_id: int, created_by: str, data_map: List[DataMap] = None, leads_type: str = None, list_id: str = None, list_name: str = None,):
        credentials = self.get_credentials(domain_id)
        data_syncs = self.sync_persistence.get_filter_by(domain_id=domain_id)
        for sync in data_syncs:
            if sync.get('integration_id') == credentials.id and sync.get('leads_type') == leads_type:
                return
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        })

