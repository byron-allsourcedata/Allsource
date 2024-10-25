


import asyncio
from datetime import datetime, timedelta
import logging
import re
from typing import List
from fastapi import HTTPException
import httpx
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.five_x_five_users import FiveXFiveUser
from schemas.integrations.sendlane import SendlaneContact, SendlaneSender
from schemas.integrations.integrations import DataMap, IntegrationCredentials, ListFromIntegration
from enums import IntegrationsStatus
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
from models.integrations.users_domains_integrations import UserIntegration

class SendlaneIntegrationService:

    def __init__(self, domain_persistence: UserDomainsPersistence, integrations_persistence: IntegrationsPresistence, leads_persistence: LeadsPersistence,
                 sync_persistence: IntegrationsUserSyncPersistence):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.QUEUE_DATA_SYNC = 'data_sync_leads'
        self.client = httpx.Client()

    def get_credentials(self, domain_id: int):
        return self.integrations_persisntece.get_credentials_for_service(domain_id=domain_id, service_name='Sendlane')
    
    
    def __handle_request(self, url: str, headers: dict = None, json: dict = None, data: dict = None, params: dict = None, api_key: str = None,  method: str = 'GET'):
        if not headers:
            headers = {
                'Authorization': f'Bearer {api_key}',
                'accept': 'application/json', 
                'content-type': 'application/json'
            }
        url = f'https://api.sendlane.com/v2/' + url
        response = self.client.request(method, url, headers=headers, json=json, data=data, params=params)

        if response.is_redirect:
            redirect_url = response.headers.get('Location')
            if redirect_url:
                response = self.client.request(method, redirect_url, headers=headers, json=json, data=data, params=params)
        return response


    def __save_integrations(self, api_key: str, domain_id: int):
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
            'service_name': 'Sendlane'
        })
        if not integartions:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return IntegrationsStatus.SUCCESS
    

    def __get_list(self, api_key):
        response = self.__handle_request(url='/lists', api_key=api_key)
        return response

    def get_lits(self, domain_id):
        credential = self.get_credentials(domain_id)
        if not credential:
            return
        lists = self.__get_list(credential.access_token)
        if list.status_code == 401:
            credential.is_failed = True
            credential.error_message = 'Invalid API Key'
            self.integrations_persisntece.db.commit()
            return
        return [self.__mapped_list(list) for list in lists.json().get('data')]

    def add_integration(self, credentials: IntegrationCredentials, domain, user):
        lists = self.__get_list(credentials.sendlane.api_key)
        if lists.status_code == 401:
            raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREDENTAILS_INVALID.value})
        return self.__save_integrations(credentials.sendlane.api_key, domain_id=domain.id)

    
    def __get_sender(self, api_key):
        response = self.__handle_request('/senders', api_key=api_key)
        return response


    def get_sender(self, domain_id):
        credential = self.get_credentials(domain_id)
        if not credential:
            return
        senders = self.__get_sender(credential.access_token)
        if senders.status_code == 401:
            credential.is_failed = True
            credential.error_message = 'Invalid API Key'
            self.integrations_persisntece.db.commit()
            return
        return [self.__mapped_sender(sender) for sender in senders.json().get('data')]


    def create_list(self, list_name: str, seder_id, domain_id: int):
        credential = self.get_credentials(domain_id)
        if not credential:
            raise HTTPException(status_code=403, detail={'status': IntegrationsStatus.CREDENTIALS_NOT_FOUND})
        json = {
            'name': list_name,
            'sender_id': seder_id
        }
        response = self.__handle_request('/sender', method='POST', api_key=credential.access_token, json=json)
        if response == 401:
            credential.is_failed = True
            credential.error_message = 'Invalid API Key'
            self.integrations_persisntece.db.commit()
            return
        return response.json().get('data')
 
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

    async def process_data_sync(self, message):
        sync = None
        try:
            sync = IntegrationUserSync(**message.get('sync'))
            logging.info("IntegrationUserSync created successfully.")
        except Exception as e:
            logging.error("Error creating IntegrationUserSync: %s", e)

        leads_type = message.get('leads_type')
        domain_id = message.get('domain_id')
        lead = message.get('lead', None)
        if domain_id and lead:
            lead = self.leads_persistence.get_leads_domain(domain_id=domain_id, id=lead.get('id'))
        stage = message.get('stage') if message.get('stage') else 1
        next_try = message.get('next_try') if message.get('next_try') else None

        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.declare_queue(
            name=self.QUEUE_DATA_SYNC,
            durable=True
        )
        logging.info("RabbitMQ queue declared.")

        domains = self.domain_persistence.get_domain_by_filter(**{'id': domain_id} if domain_id else {})
        logging.info(f"Retrieved domains: {[domain.id for domain in domains]}",)

        for domain in domains:
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

                for lead in leads:
                    if stage > 3:
                        logging.info("Stage limit reached. Exiting.")
                        return
                    
                    if next_try and datetime.now() < datetime.fromisoformat(next_try):
                        await asyncio.sleep(1)
                        logging.info("Processing lead sync with next try: %s", next_try)
                        await self.process_lead_sync(
                            lead_user=lead,
                            rabbitmq_connection=connection, 
                            user_domain_id=domain.id, 
                            behavior_type=lead.behavior_type, 
                            stage=stage, 
                            next_try=next_try  
                        )
                        continue
                    
                    profile = self.__create_contact(lead.five_x_five_user_id, credentials, data_sync_item.list_id)
                    if not profile:
                        data_sync_item.sync_status = False
                        self.sync_persistence.db.commit()
                        logging.error("Profile creation failed for lead: %s", lead.five_x_five_user_id)
                        if stage != 3:
                            next_try_str = (datetime.now() + timedelta(hours=3)).isoformat()
                            await self.process_lead_sync(
                                lead_user=lead,
                                rabbitmq_connection=connection, 
                                user_domain_id=domain.id, 
                                behavior_type=lead.behavior_type, 
                                stage=stage + 1, 
                                next_try=next_try_str
                            )
                        continue
                    data_sync_item.sync_status = True
                    self.sync_persistence.db.commit()
                    logging.info("Profile added successfully for lead: %s", lead.five_x_five_user_id)
                self.sync_persistence.update_sync({
                    'last_sync_date': datetime.now()
                }, id=data_sync_item.id)
                logging.info("Sync updated for item id: %s", data_sync_item.id)

    def __create_contact(self, lead_id: int, credential: UserIntegration, list_id: int):
        lead_data = self.leads_persistence.get_lead_data(lead_id)
        try:
            profile = self.__mapped_sendlane_contact(lead_data)
        except: return
        repsonse = self.__handle_request(f'/{list_id}/contact', api_key=credential.access_token, json=profile.model_dump())
        if repsonse.status_code == 401:
            credential.is_failed = True
            credential.error_message = 'Invalid API Key'
            self.integrations_persisntece.db.commit()
            return
        if repsonse.status_code == 202:
            return repsonse.json()

    def __mapped_list(self, list):
        return ListFromIntegration(
            id=list.get('id'),
            list_name=list.get('name')
        )
    
    def __mapped_sender(self, sender):
        return SendlaneSender(
            id=sender.get('id'),
            sender_name=sender.get('from_name')
        )
    

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


    def __mapped_sendlane_contact(self, lead: FiveXFiveUser):
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


        return SendlaneContact(
            email=first_email,
            first_email=lead.first_name,
            last_name=lead.last_name,
            phone=self.validate_and_format_phone(first_phone)
        )