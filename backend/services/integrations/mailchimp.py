from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.domains import UserDomainsPersistence
from schemas.integrations.integrations import *
from schemas.integrations.klaviyo import *
from fastapi import HTTPException
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
import json
from utils import extract_first_email
from typing import List
import logging 
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
import mailchimp_marketing as MailchimpMarketing
from mailchimp_marketing.api_client import ApiClientError

class MailchimpIntegrationsService:

    def __init__(self, domain_persistence: UserDomainsPersistence, 
                 integrations_persistence: IntegrationsPresistence, leads_persistence: LeadsPersistence,
                 sync_persistence: IntegrationsUserSyncPersistence):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.QUEUE_DATA_SYNC = 'data_sync_leads'
        self.client = MailchimpMarketing.Client()

    def get_credentials(self, domain_id: int):
        return self.integrations_persisntece.get_credentials_for_service(domain_id, SourcePlatformEnum.MAILCHIMP.value)
    

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
            'service_name': SourcePlatformEnum.MAILCHIMP.value
        })
        if not integartions:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return integartions


    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        data_center = credentials.mailchimp.api_key.split('-')[-1]
        try:
            lists = self.get_list(api_key=credentials.mailchimp.api_key, server=data_center)
            if not lists:
                raise HTTPException(status_code=400, detail={"status": IntegrationsStatus.CREDENTAILS_INVALID.value})
        except:
            raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREDENTAILS_INVALID.value})
        integration = self.__save_integation(domain_id=domain.id, api_key=credentials.mailchimp.api_key, server=data_center)
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
        await rabbitmq_connection.close()
        
    async def process_lead_sync(self, user_domain_id, behavior_type, lead_user, stage, next_try):
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.declare_queue(
            name=self.QUEUE_DATA_SYNC,
            durable=True
        )
        await publish_rabbitmq_message(connection, self.QUEUE_DATA_SYNC,
                                    {'domain_id': user_domain_id, 'leads_type': behavior_type, 'lead': {
                                        'id': lead_user.id,
                                        'five_x_five_user_id': lead_user.five_x_five_user_id
                                    }, 'stage': stage, 'next_try': next_try})
        await rabbitmq_connection.close()


    async def process_data_sync(self, five_x_five_user, access_token, integration_data_sync):
        profile = self.__create_profile(five_x_five_user, access_token, integration_data_sync)
        if profile == ProccessDataSyncResult.AUTHENTICATION_FAILED.value or profile == ProccessDataSyncResult.INCORRECT_FORMAT.value:
            return profile
            
        return ProccessDataSyncResult.SUCCESS.value

    def __create_profile(self, five_x_five_user, access_token, integration_data_sync):
        lead = self.__mapped_member_into_list(five_x_five_user)
        if lead == ProccessDataSyncResult.INCORRECT_FORMAT.value:
            return lead
        self.client.set_config({
            'api_key': access_token,
            'server': integration_data_sync.data_center
        })
        try:
            response = self.client.lists.add_list_member(integration_data_sync.list_id, lead)
        except ApiClientError as error:
            if error.status_code == 400:
                return "Already exist"
        return response

    def __mapped_list(self, list):
        return ListFromIntegration(id=list['id'], list_name=list['name'])
    
    def __mapped_member_into_list(self, lead: FiveXFiveUser):
        first_email = (
            getattr(lead, 'business_email') or 
            getattr(lead, 'personal_emails') or 
            getattr(lead, 'programmatic_business_emails', None)
        )
        first_email = extract_first_email(first_email) if first_email else None
        if not first_email:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value
        return {
            'email_address': first_email,
            'status': 'subscribed',
            'email_type': 'text'
        }



        

