import asyncio
from datetime import timedelta
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
import mailchimp_marketing as MailchimpMarketing
from mailchimp_marketing.api_client import ApiClientError

class MailchimpIntegrationsService:

    def __init__(self, domain_persistence: UserDomainsPersistence, integrations_persistence: IntegrationsPresistence, leads_persistence: LeadsPersistence,
                 sync_persistence: IntegrationsUserSyncPersistence):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.QUEUE_DATA_SYNC = 'data_sync_leads'
        self.client = MailchimpMarketing.Client()

    def get_credentials(self, domain_id: int):
        return self.integrations_persisntece.get_credentials_for_service(domain_id, 'Mailchimp')
    

    def get_list(self, domain_id: int = None, api_key: str = None, server: str = None):
        if domain_id:
            credentials = self.get_credentials(domain_id)
            if not credentials: return
            self.client.set_config({
                'api_key': credentials.access_token,
                'server': credentials.data_center
            })
        else:
            self.client.set_config({
                'api_key': api_key,
                'server': server
            })
        try:
            response = self.client.lists.get_all_lists()
            return [self.__mapped_list(list) for list in response.get('lists')]
        except ApiClientError as error:
            if credentials:
                credentials.error_message = json.loads(error.text).get('detail')
                credentials.is_failed = True
                self.integrations_persisntece.db.commit()
                return


    def __save_integation(self, domain_id: int, api_key: str, server: str):
        credential = self.get_credentials(domain_id)
        if credential:
            credential.access_token = api_key
            credential.data_center = server
            credential.is_failed = False
            self.integrations_persisntece.db.commit()
            return credential
        integartions = self.integrations_persisntece.create_integration({
            'domain_id': domain_id,
            'access_token': api_key,
            'data_center': server,
            'service_name': 'Mailchimp'
        })
        if not integartions:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return integartions


    def add_integration(self, credential: IntegrationCredentials, domain, user):
        data_center = credential.mailchimp.api_key.split('-')[-1]
        try:
            lists = self.get_list(api_key=credential.mailchimp.api_key, server=data_center)
            if not lists:
                raise HTTPException(status_code=400, detail={"status": IntegrationsStatus.CREDENTAILS_INVALID.value})
        except:
            raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREDENTAILS_INVALID.value})
        integration = self.__save_integation(domain_id=domain.id, api_key=credential.mailchimp.api_key, server=data_center)
        return integration

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
        
    async def process_lead_sync(self, rabbitmq_connection, user_domain_id, behavior_type, lead_user, stage, next_try):
        await publish_rabbitmq_message(rabbitmq_connection, self.QUEUE_DATA_SYNC,
                                    {'domain_id': user_domain_id, 'leads_type': behavior_type, 'lead': {
                                        'id': lead_user.id,
                                        'five_x_five_user_id': lead_user.five_x_five_user_id
                                    }, 'stage': stage, 'next_try': next_try})


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
                    
                    profile = self.__create_profile(lead.five_x_five_user_id, credentials, data_sync_item.list_id)

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

    def __create_profile(self, lead_id: int, credentials, list_id):
        lead_data = self.leads_persistence.get_lead_data(lead_id)
        try:
            lead = self.__mapped_member_into_list(lead_data)
        except: return
        self.client.set_config({
            'api_key': credentials.access_token,
            'server': credentials.data_center
        })
        try:
            response = self.client.lists.add_list_member(list_id, lead)
        except ApiClientError as error:
            logging.error(f'{error.text}')
            if error.status_code == 400:
                return "Already exist"
            if credentials:
                credentials.error_message = json.loads(error.text).get('detail')
                credentials.is_failed = True
                self.integrations_persisntece.db.commit()
                return
        return response

    def __mapped_list(self, list):
        return ListFromIntegration(id=list['id'], list_name=list['name'])
    
    def __mapped_member_into_list(self, lead: FiveXFiveUser):
        first_email = (
            getattr(lead, 'business_email') or 
            getattr(lead, 'personal_emails') or 
            getattr(lead, 'programmatic_business_emails', None)
        )
        return {
            'email_address': first_email,
            'status': 'subscribed',
            'email_type': 'text'
        }



        

