from typing import List

from fastapi import HTTPException
from httpx import Client
import os
from enums import IntegrationsStatus, SourcePlatformEnum
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from schemas.integrations.integrations import IntegrationCredentials, DataMap


class AttentiveIntegrationsService:

    def __init__(self, integrations_persistence: IntegrationsPresistence,
                 sync_persistence: IntegrationsUserSyncPersistence, client: Client):
        self.integrations_persistence = integrations_persistence
        self.sync_persistence = sync_persistence
        self.client = client

    def save_integration(self, domain_id: int, api_key: str, user: dict):
        credential = self.integrations_persistence.get_credentials_for_service(domain_id, SourcePlatformEnum.ATTENTIVE.value)
        if credential:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.ALREADY_EXIST.value})
        
        common_integration = bool(os.getenv('COMMON_INTEGRATION'))
        integration_data = {
            'access_token': api_key,
            'full_name': user.get('full_name'),
            'service_name': SourcePlatformEnum.Attentive.value
        }

        if common_integration:
            integration_data['user_id'] = user.get('id')
        else:
            integration_data['domain_id'] = domain_id
            
        integrations = self.integrations_persistence.create_integration(integration_data)
        if not integrations:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return integrations

    def http_authentication(self, api_key):
        response = self.client.get('https://api.attentivemobile.com/v1/me', headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
        if response.status_code == 401:
            return False
        return True

    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        api_key = credentials.attentive.api_key
        try:
            result_authentication = self.http_authentication(api_key=api_key)
            if not result_authentication:
                raise HTTPException(status_code=400, detail={"status": IntegrationsStatus.CREDENTAILS_INVALID.value})
        except:
            raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREDENTAILS_INVALID.value})
        integration = self.save_integration(domain_id=domain.id, api_key=api_key, user=user)
        return integration

    async def create_sync(self, leads_type: str, list_id: str, list_name: str, data_map: List[DataMap], domain_id: int,
                          created_by: str, user: dict):
        credentials = self.integrations_persistence.get_credentials_for_service(domain_id=domain_id, user_id=user.get('id'), service_name=SourcePlatformEnum.ATTENTIVE.value)
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'list_id': list_id,
            'list_name': list_name,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        })
