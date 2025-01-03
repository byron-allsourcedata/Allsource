import re
from datetime import datetime
from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.domains import UserDomainsPersistence
from schemas.integrations.integrations import *
from schemas.integrations.klaviyo import *
from fastapi import HTTPException
from utils import extract_first_email
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
import httpx
import json
from typing import List
from utils import validate_and_format_phone
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection


class KlaviyoIntegrationsService:

    def __init__(self, domain_persistence: UserDomainsPersistence, integrations_persistence: IntegrationsPresistence, leads_persistence: LeadsPersistence,
                 sync_persistence: IntegrationsUserSyncPersistence, client: httpx.Client):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.QUEUE_DATA_SYNC = 'data_sync_leads'
        self.client = client

    def __handle_request(self, method: str, url: str, headers: dict = None, json: dict = None, data: dict = None, params: dict = None, api_key: str = None):
         
        if not headers:
            headers = {
                'Authorization': f'Klaviyo-API-Key {api_key}',
                'revision': '2024-10-15',
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
        credential = self.integrations_persisntece.get_credentials_for_service(domain_id, SourcePlatformEnum.KLAVIYO.value)
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
            'service_name': SourcePlatformEnum.KLAVIYO.value
        })
        if not integartions:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return integartions


    def __mapped_list(self, list) -> KlaviyoList:
        return KlaviyoList(id=list['id'], list_name=list['attributes']['name'])
    
    def get_list(self, domain_id: int):
        credentials = self.get_credentials(domain_id)
        if not credentials:
            return
        return self.__get_list(credentials.access_token, credentials)

    def __get_list(self, access_token: str, credential = None):
        response = self.client.get('https://a.klaviyo.com/api/lists/', headers={
             'Authorization': f'Klaviyo-API-Key {access_token}',
             'revision': '2023-08-15'
             })
        if response.status_code == 401 and credential:
            credential.error_message = 'Invalid API KEY'
            credential.is_failed = True
            self.integrations_persisntece.db.commit()
            return
        return [self.__mapped_list(list) for list in response.json().get('data')]


    def __get_tags(self, access_token: str, credential):
        response = self.__handle_request(method='GET', url="https://a.klaviyo.com/api/tags/", api_key=access_token)
        if response.status_code == 401 and credential:
            credential.error_message = 'Invalid API KEY'
            credential.is_failed = True
            self.integrations_persisntece.db.commit()
            return
        return [self.__mapped_tags(tag) for tag in response.json().get('data')]

    def get_tags(self, domain_id: int):
        credentials = self.get_credentials(domain_id)
        return self.__get_tags(credentials.access_token, credentials)


    def create_tags(self, tag_name: str, domain_id: int):
        credential = self.get_credentials(domain_id)
        response = self.__handle_request(method='POST', url='https://a.klaviyo.com/api/tags/', api_key=credential.access_token, json=self.__mapped_tags_json_to_klaviyo(tag_name))
        if response.status_code == 201 or response.status_code == 200:
            return self.__mapped_tags(response.json().get('data'))
        elif response.status_code == 401:
            credential.error_message = 'Invalid API Key'
            credential.is_failed = True
            self.integrations_persisntece.db.commit()
            raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        
    
    async def edit_sync(self, leads_type: str, list_id: str, list_name: str, integrations_users_sync_id: int,  data_map: List[DataMap], domain_id: int, created_by: str,tags_id: str = None):
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
        if tags_id: 
            self.update_tag_relationships_lists(tags_id=tags_id, list_id=list_id, api_key=credentials.access_token)
        message = {
            'sync':  {
                'id': sync.id,
                "domain_id": sync.domain_id, 
                "integration_id": sync.integration_id, 
                "leads_type": sync.leads_type, 
                "list_id": sync.list_id, 
                'data_map': sync.data_map
                },
            'leads_type': leads_type,
            'domain_id': domain_id
        }
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.declare_queue(
            name=self.QUEUE_DATA_SYNC,
            durable=True
        )
        await publish_rabbitmq_message(
            connection=connection,
            queue_name=self.QUEUE_DATA_SYNC, 
            message_body=message)


    def create_list(self, list, domain_id: int):
        credential = self.get_credentials(domain_id)
        response = self.client.post('https://a.klaviyo.com/api/lists', headers={
            'Authorization': f'Klaviyo-API-Key {credential.access_token}',
            'revision': '2024-07-15',
            'accept': 'application/json', 
            'content-type': 'application/json'
            }, data=json.dumps( { "data": { "type": "list", "attributes": { "name": list.name } } } ) )
        if response.status_code == 401:
            credential.error_message = 'Invalid API Key'
            credential.is_failed = True
            self.integrations_persisntece.db.commit()
            raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return self.__mapped_list(response.json().get('data'))


    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        try:
            self.__get_list(credentials.klaviyo.api_key)
        except:
            raise HTTPException(status_code=400, detail=IntegrationsStatus.CREDENTAILS_INVALID.value)
        self.__save_integrations(credentials.klaviyo.api_key, domain.id, user)
        return {
            'status': IntegrationsStatus.SUCCESS.value
        }
    
    def create_tag_relationships_lists(self, tags_id: str, list_id: str, api_key: str):
        self.__handle_request(method='POST', url=f'https://a.klaviyo.com/api/tags/{tags_id}/relationships/lists/', json={
             "data": [
                {
                    "type": "list",
                    "id": list_id
                }
            ] 
        }, api_key=api_key)
        
    def update_tag_relationships_lists(self, tags_id: str, list_id: str, api_key: str):
        self.__handle_request(method='PUT', url=f'https://a.klaviyo.com/api/tags/{tags_id}/relationships/lists/', json={
             "data": [
                {
                    "type": "list",
                    "id": list_id
                }
            ] 
        }, api_key=api_key)
    
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
        if tags_id: 
            self.create_tag_relationships_lists(tags_id=tags_id, list_id=list_id, api_key=credentials.access_token)
        message = {
            'sync':  {
                'id': sync.id,
                "domain_id": sync.domain_id, 
                "integration_id": sync.integration_id, 
                "leads_type": sync.leads_type, 
                "list_id": sync.list_id, 
                'data_map': sync.data_map,
                'created_by': created_by,
                },
            'leads_type': leads_type,
            'domain_id': domain_id
        }
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.declare_queue(
            name=self.QUEUE_DATA_SYNC,
            durable=True
        )
        await publish_rabbitmq_message(
            connection=connection,
            queue_name=self.QUEUE_DATA_SYNC, 
            message_body=message)      
        await rabbitmq_connection.close()  

    async def process_lead_sync(self, user_domain_id, behavior_type, lead_user, stage, next_try):
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        await publish_rabbitmq_message(connection, self.QUEUE_DATA_SYNC,
                                    {'domain_id': user_domain_id, 'leads_type': behavior_type, 'lead': {
                                        'id': lead_user.id,
                                        'five_x_five_user_id': lead_user.five_x_five_user_id
                                    }, 'stage': stage, 'next_try': next_try})
        await rabbitmq_connection.close()


    async def process_data_sync(self, five_x_five_user, user_integration, data_sync):
        data_map = data_sync.data_map if data_sync.data_map else None
        profile = self.__create_profile(five_x_five_user, user_integration.access_token, data_map)
        
        if profile == ProccessDataSyncResult.AUTHENTICATION_FAILED.value or profile == ProccessDataSyncResult.INCORRECT_FORMAT.value:
            return profile
        
        list_response = self.__add_profile_to_list(data_sync.list_id, profile.get('id'), user_integration.access_token)
        if list_response.status_code == 404:
            return ProccessDataSyncResult.LIST_NOT_EXISTS.value
            
        return ProccessDataSyncResult.SUCCESS.value

    
    def get_count_profiles(self, list_id: str, api_key: str):
        url = f'https://a.klaviyo.com/api/lists/{list_id}?additional-fields[list]=profile_count'
        response = self.__handle_request(
            method='GET',
            url=url,
            api_key=api_key,
        )
        if response.status_code == 200:
            data = response.json()
            return data.get('data', {}).get('attributes', {}).get('profile_count', 0)
        
        if response.status_code == 404:
            return ProccessDataSyncResult.LIST_NOT_EXISTS.value

        if response.status_code == 401:
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        
        if response.status_code == 429:
            return ProccessDataSyncResult.TOO_MANY_REQUESTS.value


    def __create_profile(self, five_x_five_user, api_key: str, data_map):
        profile = self.__mapped_klaviyo_profile(five_x_five_user)
        if profile == ProccessDataSyncResult.INCORRECT_FORMAT.value:
            return profile
        
        if data_map:
            properties = self.__map_properties(five_x_five_user, data_map)
        else:
            properties = {}
        json_data = {
            'data': {
                'type': 'profile',
                'attributes': {
                    'email': profile.email if profile.email is not None else None,
                    'phone_number': validate_and_format_phone(profile.phone_number) if profile.phone_number is not None else None,
                    'first_name': profile.first_name if profile.first_name is not None else None,
                    'last_name': profile.last_name if profile.last_name is not None else None,
                    'organization': profile.organization if profile.organization is not None else None,
                    'location': profile.location if profile.location is not None else None,
                    'title': profile.title if profile.title is not None else None,
                    'properties': properties
                }
            }
        }
        json_data['data']['attributes'] = {k: v for k, v in json_data['data']['attributes'].items() if v is not None}
        response = self.__handle_request(
            method='POST',
            url='https://a.klaviyo.com/api/profiles/',
            api_key=api_key,
            json=json_data
        )
        if response.status_code == 201:
                return response.json().get('data')
        if response.status_code == 400:
                return ProccessDataSyncResult.INCORRECT_FORMAT.value
        if response.status_code == 401:
                return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        if response.status_code == 409:
            return {'id': response.json().get('errors')[0].get('meta').get('duplicate_profile_id')}
        
        

    def __add_profile_to_list(self, list_id: str, profile_id: str, api_key: str):
        response = self.__handle_request(method='POST', url=f'https://a.klaviyo.com/api/lists/{list_id}/relationships/profiles/',api_key=api_key, json={
            "data": [
                {
                "type": "profile",
                "id": profile_id
                }
            ]
            })
        return response
        
    def set_suppression(self, suppression: bool, domain_id: int):
            credential = self.get_credentials(domain_id)
            if not credential:
                raise HTTPException(status_code=403, detail=IntegrationsStatus.CREDENTIALS_NOT_FOUND.value)
            credential.suppression = suppression
            self.integrations_persisntece.db.commit()
            return {'message': 'successfuly'}  

    def get_profile(self, domain_id: int, fields: List[ContactFiled], date_last_sync: str = None) -> List[ContactSuppression]:
        credentials = self.get_credentials(domain_id)
        if not credentials:
            raise HTTPException(status_code=403, detail=IntegrationsStatus.CREDENTIALS_NOT_FOUND.value)
        params = {
            'fields[profile]': ','.join(fields),
        }
        if date_last_sync:
            params['filter'] = f'greater-than(created,{date_last_sync})'
        response = self.__handle_request(method='GET', url='https://a.klaviyo.com/api/profiles/', api_key=credentials.access_token, params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail={'status': "Profiles from Klaviyo could not be retrieved"})
        return [self.__mapped_profile_from_klaviyo(profile) for profile in response.json().get('data')]

    def __mapped_klaviyo_profile(self, five_x_five_user: FiveXFiveUser) -> KlaviyoProfile:
        first_email = (
            getattr(five_x_five_user, 'business_email') or 
            getattr(five_x_five_user, 'personal_emails') or 
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
            "address1": getattr(five_x_five_user, 'personal_address') or getattr(five_x_five_user, 'company_address', None),
            "city": getattr(five_x_five_user, 'personal_city') or getattr(five_x_five_user, 'company_city', None),
            "region": getattr(five_x_five_user, 'personal_state') or getattr(five_x_five_user, 'company_state', None),
            "zip": getattr(five_x_five_user, 'personal_zip') or getattr(five_x_five_user, 'company_zip', None),
        }
        return KlaviyoProfile(
            email=first_email,
            phone_number=first_phone,
            first_name=getattr(five_x_five_user, 'first_name', None),
            last_name=getattr(five_x_five_user, 'last_name', None),
            organization=getattr(five_x_five_user, 'company_name', None),
            location=location,
            title=getattr(five_x_five_user, 'job_title', None))

    def __map_properties(self, five_x_five_user: FiveXFiveUser, data_map: List[DataMap]) -> dict:
        properties = {}
        for mapping in data_map:
            five_x_five_field = mapping.get("type")  
            new_field = mapping.get("value")  
            value_field = getattr(five_x_five_user, five_x_five_field, None)
            if value_field is not None: 
                if isinstance(value_field, datetime):
                    properties[new_field] = value_field.isoformat() 
                else:
                    properties[new_field] = value_field 
        return properties



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
    
    def __mapped_profile_from_klaviyo(self, profile):
        return ContactSuppression(
            id=profile.get('id'),
            email=profile.get('attributes').get('email'),
            phone_number=profile.get('attributes').get('phone_number')
        )

