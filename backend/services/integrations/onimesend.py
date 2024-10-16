import logging
import httpx
from typing import List
from schemas.integrations.omnisend import Identifiers, OmnisendProfile
from schemas.integrations.integrations import DataMap, IntegrationCredentials
from persistence.leads_persistence import LeadsPersistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.domains import UserDomainsPersistence
from models.leads_users import LeadUser
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.five_x_five_users import FiveXFiveUser
from enums import IntegrationsStatus
from datetime import datetime
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

class OmnisendIntegrationService:

    def __init__(self, leads_persistence: LeadsPersistence, sync_persistence: IntegrationsUserSyncPersistence,
                 integration_persistence: IntegrationsPresistence, domain_persistence: UserDomainsPersistence):
        self.client = httpx.Client()
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.integration_persistence = integration_persistence
        self.domain_persistence = domain_persistence
        self.QUEUE_DATA_SYNC = 'data_sync_leads'

    def get_credentials(self, domain_id: int):
        return self.integration_persistence.get_credentials_for_service(domain_id, 'Omnisend')
    
    def __handle_request(self, url: str, headers: dict = None, json: dict = None, data: dict = None, params: dict = None, api_key: str = None,  method: str = 'GET'):
        if not headers:
            headers = {
                'X-API-KEY': f'{api_key}',
                'accept': 'application/json', 
                'content-type': 'application/json'
            }
        url = f'https://api.omnisend.com/v5' + url
        response = self.client.request(method, url, headers=headers, json=json, data=data, params=params)

        if response.is_redirect:
            redirect_url = response.headers.get('Location')
            if redirect_url:
                response = self.client.request(method, redirect_url, headers=headers, json=json, data=data, params=params)
        return response

    def get_list_contact(self, api_key):
        contacts = self.__handle_request('/contacts', api_key=api_key)
        return contacts
    
    def __save_integrations(self, api_key: str, domain_id: int):
        credential = self.get_credentials(domain_id)
        if credential:
            credential.access_token = api_key
            self.integration_persistence.db.commit()
            return credential
        integartions = self.integration_persistence.create_integration({
            'domain_id': domain_id,
            'access_token': api_key,
            'service_name': 'Omnisend'
        })
        if not integartions:
            return IntegrationsStatus.CREATE_IS_FAILED 
        return IntegrationsStatus.SUCCESS


    def add_integration(self, credentials: IntegrationCredentials, domain, user):
        if self.get_credentials(domain.id):
            return IntegrationsStatus.ALREADY_EXIST
        if self.get_list_contact(credentials.omnisend.api_key).status_code != 200:
            return IntegrationsStatus.CREDENTAILS_INVALID
        return self.__save_integrations(api_key=credentials.omnisend.api_key, domain_id=domain.id)
    
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
        message = {
            'sync':  {
                'id': sync.id,
                "domain_id": sync.domain_id, 
                "integration_id": sync.integration_id, 
                "leads_type": sync.leads_type, 
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
    
    def process_data_sync(self, message):
        sync = None
        try:
            sync = IntegrationUserSync(**message.get('sync'))
        except: pass
        leads_type = message.get('leads_type')
        domain_id = message.get('domain_id')
        lead = LeadUser(**message.get('lead')) if message.get('lead') else None
        domains = self.domain_persistence.get_domain_by_filter(**{'id': domain_id} if domain_id else {})
        for domain in domains:
            credentials = self.get_credentials(domain.id)
            if not credentials:
                return
            data_syncs_list = self.sync_persistence.get_data_sync_filter_by(
                domain_id=domain.id,
                integration_id=credentials.id,
                is_active=True
            )
            if lead:
                leads = [lead]
            elif not leads_type or leads_type == 'allContacts':
                leads = self.leads_persistence.get_leads_domain(domain.id) 
            else:
                leads = self.leads_persistence.get_leads_domain(domain.id, behavior_type=leads_type)
            for data_sync_item in data_syncs_list if not sync else [sync]:
                if lead and leads.behavior_type != data_sync_item.leads_type or data_sync_item.leads_type in ('allContacts', None):
                    return
                if data_sync_item.data_map:
                    data_map = data_sync_item.data_map
                else: data_map = None
                for lead in leads:
                    
                    profile = self.__create_profile(lead.five_x_five_user_id, credentials.access_token, data_map)
                    if profile:
                        self.__add_profile_to_list(data_sync_item.list_id, profile.get('id'), credentials.access_token)
                self.sync_persistence.update_sync({
                    'last_sync_date': datetime.now()
                }, id=data_sync_item.id)

    def __create_profile(self, lead_id: int, api_key: str, data_map):
        lead_data = self.leads_persistence.get_lead_data(lead_id)
        try:
            profile = self.__mapped_profile(lead_data)
            identifiers = self.__mapped_identifiers(lead_data)
        except: return
        if data_map:
            properties = self.__map_properties(lead_data, data_map)
        else:
            properties = {}
        json_data = {
            'customProperties': properties,
            'address': profile.address,
            'city': profile.city,
            'state': profile.state,
            'postalCode': profile.postalCode,
            'gender': profile.gender,
            'firstName': profile.firstName,
            'lastName': profile.lastName,
            'identifiers': [
                identifiers.model_dump()
            ]
        }
        json_data = {k: v for k, v in json_data.items() if v is not None}
        try:
            response = self.__handle_request('/contacts', method='POST', api_key=api_key, json=json_data)
            if response.status_code != 200:
                logging.error("Error response: %s", response.text)
                return None 
        except: return None
        return response.json()


    def __mapped_identifiers(self, lead: FiveXFiveUser):
        first_email = (
            getattr(lead, 'business_email') or 
            getattr(lead, 'personal_emails') or 
            getattr(lead, 'programmatic_business_emails', None)
        )
        
        # first_phone = (
        #     getattr(lead, 'mobile_phone') or 
        #     getattr(lead, 'personal_phone') or 
        #     getattr(lead, 'direct_number') or 
        #     getattr(lead, 'company_phone', None)
        # )

        return Identifiers(id=first_email)
    

    def __mapped_profile(self, lead: FiveXFiveUser) -> OmnisendProfile :
        return OmnisendProfile(
            address=getattr(lead, 'personal_address') or getattr(lead, 'company_address', None),
            city=getattr(lead, 'personal_city') or getattr(lead, 'company_city', None),
            state=getattr(lead, 'personal_state') or getattr(lead, 'company_state', None),
            postalCode=getattr(lead, 'personal_zip') or getattr(lead, 'company_zip', None),
            firstName=getattr(lead, 'first_name', None),
            lastName=getattr(lead, 'last_name', None),
            gender=getattr(lead, 'gender', None).lower()
        )
    

    def __map_properties(self, lead: FiveXFiveUser, data_map: List[DataMap]) -> dict:
        properties = {}
        for mapping in data_map:
            five_x_five_field = mapping.get("type")  
            new_field = mapping.get("type")  
            value_field = getattr(lead, five_x_five_field, None)
            if value_field is not None:
                properties[new_field] = value_field
        return properties