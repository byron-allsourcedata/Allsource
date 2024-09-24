from persistence.leads_persistence import LeadsPersistence, LeadUser, FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.domains import UserDomainsPersistence
from schemas.integrations.integrations import *
from schemas.integrations.klaviyo import *
from fastapi import HTTPException
from enums import IntegrationsStatus
import httpx
import json
from typing import List, Dict
import logging 

class KlaviyoIntegrationsService:

    def __init__(self, domain_persistence: UserDomainsPersistence, integrations_persistence: IntegrationsPresistence, leads_persistence: LeadsPersistence,
                 sync_persistence: IntegrationsUserSyncPersistence):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.client = httpx.Client()

    def __handle_request(self, method: str, url: str, headers: dict = None, json: dict = None, data: dict = None, params: dict = None, api_key: str = None):
        
        if not headers:
            headers = {
                'Authorization': f'Klaviyo-API-Key {api_key}',
                'revision': '2024-07-15',
                'accept': 'application/json', 
                'content-type': 'application/js'
            }
        response = self.client.request(method, url, headers=headers, json=json, data=data, params=params)

        if response.is_redirect:
            redirect_url = response.headers.get('Location')
            if redirect_url:
                response = self.client.request(method, redirect_url, headers=headers, json=json, data=data, params=params)

        return response

    def get_credentials(self, domain_id: str):
        credential = self.integrations_persisntece.get_credentials_for_service(domain_id, 'Klaviyo')
        if not credential:
            raise HTTPException(status_code=403, detail={"status": IntegrationsStatus.CREDENTIALS_NOT_FOUND.value})
        return credential
        

    def __save_integrations(self, api_key: str, domain_id: int):
        if self.get_credentials(domain_id):
            return
        integartions = self.integrations_persisntece.create_integration({
            'domain_id': domain_id,
            'access_token': api_key,
            'service_name': 'Klaviyo'
        })
        if not integartions:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return integartions


    def __mapped_list(self, list) -> KlaviyoList:
        return KlaviyoList(id=list['id'], list_name=list['attributes']['name'])
    
    def get_list(self, domain_id: int):
        credentials = self.get_credentials(domain_id)
        return self.__get_list(credentials.access_token)

    def __get_list(self, access_token: str):
        response = self.client.get('https://a.klaviyo.com/api/lists/', headers={
             'Authorization': f'Klaviyo-API-Key {access_token}',
             'revision': '2023-08-15'
             })
        return [self.__mapped_list(list) for list in response.json().get('data')]

    def __create_tags(self, access_token: str, tags_name: str):
        ...

    def __get_tags(self, access_token: str):
        response = self.__handle_request(method='GET', url="https://a.klaviyo.com/api/tags/", api_key=access_token)
        return [self.__mapped_tags(tag) for tag in response.json().get('data')]

    def get_tags(self, domain_id: int):
        credentials = self.get_credentials(domain_id)
        return self.__get_tags(credentials.access_token)

    def create_tags(self, tag_name: str, domain_id: int):
        credentail = self.get_credentials(domain_id)
        response = self.__handle_request(method='POST', url='https://a.klaviyo.com/api/tags/', api_key=credentail.access_token, json=json.dump(self.__mapped_tags_json_to_klaviyo(tag_name)))
        if response.status_code == 201:
            return {'status': IntegrationsStatus.SUCCESS}
        else: raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})


    def create_list(self, list_name: str, domain_id: int):
        credentail = self.get_credentials(domain_id)
        response = self.client.post('https://a.klaviyo.com/api/lists', headers={
            'Authorization': f'Klaviyo-API-Key {credentail.access_token}',
            'revision': '2024-07-15',
            'accept': 'application/json', 
            'content-type': 'application/js'
            }, data=json.dumps( { "data": { "type": "list", "attributes": { "name": list_name } } } ) )
        if response.status_code != 201:
            raise HTTPException(status_code=response.status_code, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return self.__mapped_list(response.json().get('data'))


    def add_integration(self, credentials: IntegrationCredentials, domain_id: int):
        try:
            self.__get_list(credentials.klaviyo.api_key)
        except:
            raise HTTPException(status_code=400, detail=IntegrationsStatus.CREDENTAILS_INVALID.value)
        integrations = self.__save_integrations(credentials.klaviyo.api_key, domain_id)
        return {
            'status': IntegrationsStatus.SUCCESS.value
        }
    
    def create_sync(self, supperssion: bool, leads_type: List[str], data_map: Dict[str, str], domain_id: int):
        credentials = self.get_credentials(domain_id)
        self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'domain_id': domain_id,
            'supperssion': supperssion,
            'leads_type': leads_type,
            'data_map': data_map
        })
    
    def data_sync(self):
        domains = self.domain_persistence.get_domain_by_filter()
        for domain in domains:
            credentials = self.get_credentials(domain.id)
            data_syncs_list = self.sync_persistence.get_filter_by(domain_id=domain.id, integration_id=credentials.id, is_active=True)
            leads = self.leads_persistence.get_leads_domain(domain.id)
            for data_sync_item in data_syncs_list:
                for lead in leads:
                    self.__create_profile(lead.id, data_sync_item.supression, json.loads(data_sync_item.data_map), credentials.access_token)
                

    def __create_profile(self, lead_id: int, supersision: bool, data_map: Dict[str, str], api_key: str):
        try:
            lead_data = self.leads_persistence.get_lead_data(lead_id)
            profile = self.__mapped_klaviyo_profile(lead_data, data_map)
            json_data = {
                'type': 'profile',
                'attributes': {
                    'email': profile.email,
                    'phone_number': profile.phone_number,
                    'first_name': profile.first_name,
                    'last_name': profile.last_name,
                    'organization': profile.organization,
                    'title': profile.title,
                    'properties': profile.properties
                }
            }
            response = self.__handle_request(
                method='POST',
                url='https://a.klaviyo.com/api/profiles/',
                api_key=api_key,
                json=json_data
            )
            if response.status_code == 409 and not supersision:
                klaviyo_id = response.json().get('errors', {}).get('meta', {}).get('duplicate_profile_id')
                if klaviyo_id:
                    response = self.__handle_request(
                        method='PATCH',
                        url=f'https://a.klaviyo.com/api/profiles/{klaviyo_id}',
                        api_key=api_key,
                        json={
                            **json_data,
                            'id': klaviyo_id
                        }
                    )
        except Exception as e:
            logging.error(f'Export lead: {lead_id} Error: {e}')
        return response


    def __mapped_klaviyo_profile(self, lead: FiveXFiveUser, data_map: Dict[str, str]) -> KlaviyoProfile:
        return KlaviyoProfile(
            email=getattr(lead, data_map['email']),
            phone_number=getattr(lead, data_map['phone_number']),
            first_name=getattr(lead, data_map['first_name'], None),
            last_name=getattr(lead, data_map['last_name'], None),
            organization=getattr(lead, data_map['organization'], None),
            title=getattr(lead, data_map['title'], None),
            properties={
                key: getattr(lead, value, None) for key, value in data_map['properties'].items()
            }
        )
        
    def __mapped_tags(self, tag: dict):
        return KlaviyoTags(id=tag.get('id'), tag_name=tag.get('attributes').get('name'))
    
    def __mapped_tags_json_to_klaviyo(self, tag_name: str):
        return {
            'type': 'tag',
            "attributes": { "name": tag_name },
        }
