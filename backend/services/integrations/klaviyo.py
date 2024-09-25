import re
from persistence.leads_persistence import LeadsPersistence, LeadUser, FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence, IntegrationUserSync
from persistence.domains import UserDomainsPersistence
from schemas.integrations.integrations import *
from schemas.integrations.klaviyo import *
from fastapi import HTTPException
from enums import IntegrationsStatus
import httpx
import json
from typing import List
import logging 
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
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
                'content-type': 'application/json'
            }
        response = self.client.request(method, url, headers=headers, json=json, data=data, params=params)

        if response.is_redirect:
            redirect_url = response.headers.get('Location')
            if redirect_url:
                response = self.client.request(method, redirect_url, headers=headers, json=json, data=data, params=params)

        return response

    def get_credentials(self, domain_id: str):
        credential = self.integrations_persisntece.get_credentials_for_service(domain_id, 'Klaviyo')
        return credential
        

    def __save_integrations(self, api_key: str, domain_id: int):
        credential = self.get_credentials(domain_id)
        if credential:
            credential.access_token = api_key
            self.integrations_persisntece.db.commit()
            return credential
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


    def __get_tags(self, access_token: str):
        response = self.__handle_request(method='GET', url="https://a.klaviyo.com/api/tags/", api_key=access_token)
        return [self.__mapped_tags(tag) for tag in response.json().get('data')]

    def get_tags(self, domain_id: int):
        credentials = self.get_credentials(domain_id)
        return self.__get_tags(credentials.access_token)


    def create_tags(self, tag_name: str, domain_id: int):
        credentail = self.get_credentials(domain_id)
        response = self.__handle_request(method='POST', url='https://a.klaviyo.com/api/tags/', api_key=credentail.access_token, json=self.__mapped_tags_json_to_klaviyo(tag_name))
        if response.status_code == 201:
            return self.__mapped_tags(response.json().get('data'))
        else: raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})


    def create_list(self, list_name: str, domain_id: int):
        credentail = self.get_credentials(domain_id)
        response = self.client.post('https://a.klaviyo.com/api/lists', headers={
            'Authorization': f'Klaviyo-API-Key {credentail.access_token}',
            'revision': '2024-07-15',
            'accept': 'application/json', 
            'content-type': 'application/json'
            }, data=json.dumps( { "data": { "type": "list", "attributes": { "name": list_name } } } ) )
        if response.status_code != 201:
            raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return self.__mapped_list(response.json().get('data'))


    def add_integration(self, credentials: IntegrationCredentials, domain_id: int):
        try:
            self.__get_list(credentials.klaviyo.api_key)
        except:
            raise HTTPException(status_code=400, detail=IntegrationsStatus.CREDENTAILS_INVALID.value)
        self.__save_integrations(credentials.klaviyo.api_key, domain_id)
        return {
            'status': IntegrationsStatus.SUCCESS.value
        }
    
    async def create_sync(self, leads_type: str, list_id: str, tags_id: str, data_map: List[DataMap], domain_id: int):
        credentials = self.get_credentials(domain_id)
        data_syncs = self.sync_persistence.get_filter_by(domain_id=domain_id)
        for sync in data_syncs:
            if sync.integration_id == credentials.id and sync.leads_type == leads_type:
                return
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'list_id': list_id,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': [data.model_dump_json() for data in data_map]
        })
        message = {
            'sync':  {
                'id': sync.id,
                "domain_id": sync.domain_id, 
                "integration_id": sync.integration_id, 
                "leads_type": sync.leads_type, 
                "list_id": sync.list_id, 
                },
            'leads_type': leads_type,
            'domain_id': domain_id,
        }
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        await publish_rabbitmq_message(
            connection=connection,
            queue_name='data_sync_leads', 
            message_body=message)
    

    def process_data_sync(self, message):
        sync = IntegrationUserSync(**message.get('sync'))
        leads_type = message.get('leads_type')
        domain_id = message.get('domain_id')
        lead = LeadUser(**message.get('lead')) if message.get('lead') else None
        domains = self.domain_persistence.get_domain_by_filter(**{'id': domain_id} if domain_id else {})
        for domain in domains:
            credentials = self.get_credentials(domain.id)
            if not credentials:
                return
            data_syncs_list = self.sync_persistence.get_filter_by(
                domain_id=domain.id,
                integration_id=credentials.id,
                is_active=True
            )
            if lead:
                leads = [lead]
            elif not leads_type:
                leads = self.leads_persistence.get_leads_domain(domain.id) 
            else:
                leads = self.leads_persistence.get_leads_domain(domain.id, behavior_type=leads_type)
            for data_sync_item in data_syncs_list if not sync else [sync]:
                for lead in leads:
                    profile = self.__create_profile(lead.five_x_five_user_id, credentials.access_token)
                    if profile:
                        self.__add_profile_to_list(data_sync_item.list_id, profile.get('id'), credentials.access_token)
                self.sync_persistence.update_sync({
                    'last_sync_date': datetime.now()
                }, id=data_sync_item.id)


    def validate_and_format_phone(self, phone_number: str) -> str:
        if phone_number:
            cleaned_phone_number = re.sub(r'\D', '', phone_number)  
            logging.debug(f"Cleaned phone number: {cleaned_phone_number}") 
            
            if len(cleaned_phone_number) == 10: 
                formatted_phone_number = '+1' + cleaned_phone_number 
            elif len(cleaned_phone_number) == 11 and cleaned_phone_number.startswith('1'):
                formatted_phone_number = '+' + cleaned_phone_number  
            elif len(cleaned_phone_number) < 10:
                logging.error("Phone number too short: {}".format(cleaned_phone_number))
                return None  
            else:
                logging.error("Invalid phone number length: {}".format(cleaned_phone_number))
                return None  

            logging.debug(f"Formatted phone number: {formatted_phone_number}")  
            return formatted_phone_number
        return None

    def __create_profile(self, lead_id: int, api_key: str):
        lead_data = self.leads_persistence.get_lead_data(lead_id)
        profile = self.__mapped_klaviyo_profile(lead_data)

        json_data = {
            'data': {
                'type': 'profile',
                'attributes': {
                    'email': profile.email if profile.email is not None else None,
                    'phone_number': self.validate_and_format_phone(profile.phone_number) if profile.phone_number is not None else None,
                    'first_name': profile.first_name if profile.first_name is not None else None,
                    'last_name': profile.last_name if profile.last_name is not None else None,
                    'organization': profile.organization if profile.organization is not None else None,
                }
            }
        }

        # Убираем поля со значением None
        json_data['data']['attributes'] = {k: v for k, v in json_data['data']['attributes'].items() if v is not None}

        # Логируем JSON данные
        logging.debug("JSON data to send: %s", json.dumps(json_data, indent=2))

        response = self.__handle_request(
            method='POST',
            url='https://a.klaviyo.com/api/profiles/',
            api_key=api_key,
            json=json_data
        )

        # Обработка ошибки
        if response.status_code != 201:
            logging.error("Error response: %s", response.text)
            return None 

        return response.json().get('data')

    def __add_profile_to_list(self, list_id: str, profile_id: str, api_key: str):
        response = self.__handle_request(method='POST', url=f'https://a.klaviyo.com/api/lists/{list_id}/relationships/profiles/',api_key=api_key, json={
            "data": [
                {
                "type": "profile",
                "id": profile_id
                }
            ]
        }) 



    def __mapped_klaviyo_profile(self, lead: FiveXFiveUser) -> KlaviyoProfile:
        first_email = (
            getattr(lead, 'business_email') or 
            getattr(lead, 'personal_emails') or 
            getattr(lead, 'programmatic_business_emails', None)
        )
        
        first_phone = (
            getattr(lead, 'mobile_phone') or 
            getattr(lead, 'personal_phone') or 
            getattr(lead, 'direct_number') or 
            getattr(lead, 'company_phone', None)
        )

        return KlaviyoProfile(
            email=first_email,
            phone_number=first_phone,
            first_name=getattr(lead, 'first_name', None),
            last_name=getattr(lead, 'last_name', None),
            organization=getattr(lead, 'company_name', None)
        )

    def __mapped_tags(self, tag: dict):
        return KlaviyoTags(id=tag.get('id'), tag_name=tag.get('attributes').get('name'))
    
    def __mapped_tags_json_to_klaviyo(self, tag_name: str):
        return {
            'data': {
                'type': 'tag',
                'attributes': {
                    'name': tag_name
                }
            }
        }

