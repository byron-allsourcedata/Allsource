import asyncio
from datetime import timedelta
import re
import time
from persistence.leads_persistence import LeadsPersistence, LeadUser, FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence, IntegrationUserSync
from persistence.domains import UserDomainsPersistence
from schemas.integrations.integrations import *
from schemas.integrations.klaviyo import *
from fastapi import HTTPException
from enums import IntegrationsStatus, SourcePlatformEnum
import httpx
import json
from typing import List
import logging 
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
        

    def __save_integrations(self, api_key: str, domain_id: int, user_id):
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
            'service_name': SourcePlatformEnum.KLAVIYO.value,
            'user_id': user_id
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


    def add_integration(self, credentials: IntegrationCredentials, domain, user):
        try:
            self.__get_list(credentials.klaviyo.api_key)
        except:
            raise HTTPException(status_code=400, detail=IntegrationsStatus.CREDENTAILS_INVALID.value)
        self.__save_integrations(credentials.klaviyo.api_key, domain.id, user_id=user.get('id'))
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


    async def process_data_sync(self, message):
        counter = 0
        last_leads_sync = None
        sync = None
        if message.get('sync'):
            sync = IntegrationUserSync(**message.get('sync'))
            if sync:
                serarch_sync = self.sync_persistence.get_integration_by_sync_id(sync_id=sync.id)
                if not serarch_sync or serarch_sync.service_name != 'Klaviyo':
                    logging.info(f'Sync {sync.id} Klaviyo not matched')
                    return
        leads_type = message.get('leads_type')
        domain_id = message.get('domain_id', None)
        lead = message.get('lead', None)
        if domain_id and lead:
            lead_user =  self.leads_persistence.get_leads_domain(domain_id=domain_id, five_x_five_user_id=lead.get('five_x_five_user_id'))
            lead = lead_user[0] if lead_user else None
            if message.get('lead') and not lead:
                logging.info(f'Contact {message.get("lead").get("five_x_five_user_id") if message.get("lead") else None} in domain id {domain_id} not found')
                return
        stage = message.get('stage') if message.get('stage') else 1
        next_try = message.get('next_try') if message.get('next_try') else None

        
        logging.info("RabbitMQ queue declared.")

        domains = self.domain_persistence.get_domain_by_filter(**{'id': domain_id} if domain_id else {})
        logging.info(f"Retrieved domains: {[domain.id for domain in domains]}",)

        for domain in domains:
            logging.info('start')
            credentials = self.get_credentials(domain.id)
            if not credentials:
                logging.warning("No credentials found for domain id %s.", domain.id)
                return
            
            data_syncs_list = self.sync_persistence.get_data_sync_filter_by(
                domain_id=domain.id,
                integration_id=credentials.id,
                is_active=True
            )

            leads = [lead] if lead else (
                self.leads_persistence.get_leads_domain(domain.id, behavior_type=leads_type)
                if leads_type and leads_type != 'allContacts' else
                self.leads_persistence.get_leads_domain(domain.id)
            )

            for data_sync_item in data_syncs_list if not sync else [sync]:
                if lead and lead.behavior_type != data_sync_item.leads_type and data_sync_item.leads_type not in ('allContacts', None):
                    logging.warning("Lead behavior type mismatch: %s vs %s", lead.behavior_type, data_sync_item.leads_type)
                    continue
                data_map = data_sync_item.data_map if data_sync_item.data_map else None
                last_lead_sync_id = data_sync_item.last_lead_sync_id
                if last_lead_sync_id:
                    last_leads_sync = self.leads_persistence.get_lead_user_by_up_id(domain_id=domain.id, up_id=last_lead_sync_id)
                for lead in leads:
                    if not sync and last_leads_sync and lead.five_x_five_user_id < last_leads_sync.five_x_five_user_id:
                        logging.info(f'lead {lead.five_x_five_user_id} already sync')
                        continue
                    if stage > 3:
                        logging.info("Stage limit reached. Exiting.")
                        return
                    
                    if next_try and datetime.now() < datetime.fromisoformat(next_try):
                        await asyncio.sleep(1)
                        logging.info("Processing lead sync with next try: %s", next_try)
                        await self.process_lead_sync(
                            lead_user=lead,
                            user_domain_id=domain.id, 
                            behavior_type=lead.behavior_type, 
                            stage=stage, 
                            next_try=next_try  
                        )
                        continue
                    
                    profile = self.__create_profile(lead.five_x_five_user_id, credentials.access_token, data_map)

                    if not profile:
                        self.sync_persistence.db.query(IntegrationUserSync).filter(IntegrationUserSync.id == data_sync_item.id).update({
                        'sync_status': False
                        })
                        self.sync_persistence.db.commit()
                        logging.error("Profile creation failed for lead: %s", lead.five_x_five_user_id)
                        if stage != 3:
                            next_try_str = (datetime.now() + timedelta(hours=3)).isoformat()
                            await self.process_lead_sync(
                                lead_user=lead,
                                user_domain_id=domain.id, 
                                behavior_type=lead.behavior_type, 
                                stage=stage + 1, 
                                next_try=next_try_str
                            )
                        continue
                    list_response = self.__add_profile_to_list(data_sync_item.list_id, profile.get('id'), credentials.access_token)
                    if list_response.status_code == 404:
                        data_sync_item.sync_status = False
                        self.integrations_persisntece.db.commit()
                        continue
                    data_sync_item.sync_status = True
                    self.integrations_persisntece.db.commit()
                    logging.info("Profile added successfully for lead: %s", lead.five_x_five_user_id)
                    self.sync_persistence.db.query(IntegrationUserSync).filter(IntegrationUserSync.id == data_sync_item.id).update({
                        'sync_status': True
                    })
                    self.sync_persistence.db.commit()
                    counter += 1
                    last_leads_sync = lead
                self.sync_persistence.update_sync({
                    'last_sync_date': datetime.now(),
                    'last_lead_sync_id': self.leads_persistence.get_lead_data(last_leads_sync.five_x_five_user_id).up_id if counter > 0 else last_lead_sync_id
                },counter=counter, id=data_sync_item.id)
                logging.info("Sync updated for item id: %s", data_sync_item.id)


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

    def __create_profile(self, lead_id: int, api_key: str, data_map):
        lead_data = self.leads_persistence.get_lead_data(lead_id)
        try:
            profile = self.__mapped_klaviyo_profile(lead_data)
        except: return
        if data_map:
            properties = self.__map_properties(lead_data, data_map)
        else:
            properties = {}
        json_data = {
            'data': {
                'type': 'profile',
                'attributes': {
                    'email': profile.email if profile.email is not None else None,
                    'phone_number': self.validate_and_format_phone(profile.phone_number) if profile.phone_number is not None else None,
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

        location = {
            "address1": getattr(lead, 'personal_address') or getattr(lead, 'company_address', None),
            "city": getattr(lead, 'personal_city') or getattr(lead, 'company_city', None),
            "region": getattr(lead, 'personal_state') or getattr(lead, 'company_state', None),
            "zip": getattr(lead, 'personal_zip') or getattr(lead, 'company_zip', None),
        }
        return KlaviyoProfile(
            email=first_email,
            phone_number=first_phone,
            first_name=getattr(lead, 'first_name', None),
            last_name=getattr(lead, 'last_name', None),
            organization=getattr(lead, 'company_name', None),
            location=location,
            title=getattr(lead, 'job_title', None))

    def __map_properties(self, lead: FiveXFiveUser, data_map: List[DataMap]) -> dict:
        properties = {}
        
        for mapping in data_map:
            five_x_five_field = mapping.get("type")  
            new_field = mapping.get("value")  
            value_field = getattr(lead, five_x_five_field, None)
            
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

