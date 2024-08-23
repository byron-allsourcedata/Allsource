from fastapi import HTTPException
from httpx import Client
from schemas.integrations.klaviyo import KlaviyoUsersScheme
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from typing import List, Any
from datetime import datetime
import logging
from .utils import IntegrationsABC
from persistence.audience_persistence import AudiencePersistence
from persistence.leads_persistence import LeadsPersistence
from services.leads import LeadsService

class KlaviyoIntegrations(IntegrationsABC):

    def __init__(self, integration_persistence: IntegrationsPresistence, 
                 client: Client, 
                 user):
        self.integration_persistence = integration_persistence
        self.client = client
        self.user = user
        self.audience_persistence: AudiencePersistence
        self.leads_persistence: LeadsPersistence
        self.leads_serivce = LeadsService

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
            raise HTTPException(status_code=400, detail='Klaviyo credentials inalid')
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
            with self.integration_persistence as persistence:
                persistence.klaviyo.save_leads(lead.model_dump(), self.user['id'])


    def create_integration(self, api_key: str):
        leads = self.get_leads(api_key)
        self.__save_integrations(api_key)
        self.__save_leads(self.__mapped_leads(leads))
        return 


    def __get_lists_upd_crt_leads_by_audience(self, list_name):
        audience = self.audience_persistence.get_audience_by_name(list_name)
        ids_leads = [audience_leads for audience_leads in self.audience_persistence.get_audience_leads_by_audience_id(audience.id)]
        for_update = list()
        for_create = list()
        for id in ids_leads:
            lead_user = self.leads_persistence.get_leads_users_by_lead_id(id, self.user['id'])
            if lead_user.klaviyo_user_id is not None: 
                for_update.append(lead_user)
            else: for_create.append(lead_user)  
        return for_update, for_create
    
#  audience -> audience_leads -> leads_users -> klaviyo -> leads -> response on update 
#                                            -> leads -> response to creaete -> response to add in list


    def export_leads(self, list_name: str):
        logging.info(f'Export into Klaviyo {self.user['email']} in list {list_name}')
        crenetials = self.integration_persistence.get_user_integrations_by_service(self.user['id'], 'klaviyo')
        headers = {'Authorization': f'Klaviyo-API-Key {crenetials.access_token}', 'revision': '2024-07-15'}
        lists = self.client.get('https://a.klaviyo.com/api/lists/', headers=headers)
        list_id = None
        for klaviyo_list in lists.json().get('data'):
            if klaviyo_list['attributes']['name'] == list_name:
                list_id = klaviyo_list['id']
        if list_id is None:
            data = { "data": { "type": "list", "attributes": { "name": list_name } } }
            list_create = self.client.post('ttps://a.klaviyo.com/api/lists/', headers=headers, data=data)
            list_id = list_create['data']['id']
        update, create = self.__get_lists_upd_crt_leads_by_audience(list_name)
        for leads_ids in update:
            klaviyo_list = self.integration_persistence.klaviyo.get_service_user_by_id(leads_ids.klaviyo_user_id)
            lead = self.leads_persistence.get_lead_data(leads_ids.lead_id)
            data = self.leads_persistence.mapped_leads_for_export(lead)
            self.client.patch('http://a.klaviyo.com/api/pofile', headers=headers, data=data)
            
            # дальше добавлять в лист по leads_ids.klaviyo_user_id
