from fastapi import HTTPException
from httpx import Client
from schemas.integrations.klaviyo import KlaviyoUsersScheme
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from .utils import IntegrationsABC
from typing import List, Any
from datetime import datetime
import logging
from persistence.integrations.klaviyo_persistence import KlaviyoPersistence
from persistence.leads_persistence import LeadsPersistence

class KlaviyoIntegrations():

    def __init__(self, integration_persistence: IntegrationsPresistence, 
                 client: Client, 
                 klaviyo_persistence: KlaviyoPersistence,
                 leads_persistence: LeadsPersistence,
                 user):
        self.integration_persistence = integration_persistence
        self.klaviyo_persistence = klaviyo_persistence
        self.leads_persistence = leads_persistence
        self.client = client
        self.user = user
        
    list = None

    def __mapped_leads(self, leads: List[Any]) -> List[KlaviyoUsersScheme]:
        klaviyo_users = list()
        for lead in leads:
            attributes = lead.get("attributes", {})
            location = attributes.get("location", {})
            klaviyo_users.append(KlaviyoUsersScheme(
                klaviyo_user_id=lead["id"],
                first_name=attributes['first_name'],
                last_name=attributes['last_name'],
                email=attributes["email"],
                phone_number=attributes.get("phone_number"),
                ip=location.get("ip"),
                organization=attributes.get("organization"),
                updated_at=datetime.now(),
                external_id=attributes.get("external_id"),
                anonymous_id=attributes.get("anonymous_id"),
                city=location.get("city"),
                zip=location.get("zip"),
                timezone=location.get("timezone"),
            ))
        return klaviyo_users


    def get_leads(self, api_key: str):
        logging.info(f'Get leads from klaviyo <- email: {self.user['email']}, Klaviyo-API-Key: {api_key}')
        response = self.client.get('https://a.klaviyo.com/api/profiles/', headers={'Authorization': f'Klaviyo-API-Key {api_key}', 'revision': '2023-08-15'})
        logging.info(f'Response Klaviyo {response.status_code}')
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail='Klaviyo credentials not valid')
        return response.json().get('data')
    

    def __save_integrations(self, api_key: str):
        credentials = {'user_id': self.user['id'], 'access_token': api_key, 'service_name': 'klaviyo' }
        integration = self.integration_persistence.get_user_integrations_by_service(self.user['id'], 'klaviyo')
        if not integration:
            logging.info(f'{self.user['email']} create integration Klaviyo')
            integration = self.integration_persistence.create_integration(credentials)
            return integration
        logging.info(f'{self.user['email']} update integration Klaviyo')
        self.integration_persistence.edit_integrations(integration.id, credentials)
        return 


    def __save_leads(self, leads: List[KlaviyoUsersScheme]):
        for lead in leads:
            klaviyo_user = self.klaviyo_persistence.save_klaviyo_users(lead.model_dump())
            self.leads_persistence.update_user_leads_by_klaviyo(klaviyo_user.id, self.user['id'])


    def create_integration(self, api_key: str):
        leads = self.get_leads(api_key)
        self.__save_integrations(api_key)
        self.__save_leads(self.__mapped_leads(leads))
        return 
    