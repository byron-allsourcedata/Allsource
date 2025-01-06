

import hashlib
from schemas.integrations.meta import AdAccountScheme
from models.five_x_five_users import FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
from persistence.domains import UserDomainsPersistence
import httpx
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.api import FacebookAdsApi
from fastapi import HTTPException
from datetime import datetime
from utils import extract_first_email
from schemas.integrations.integrations import IntegrationCredentials, DataMap, ListFromIntegration
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from typing import List
from config.meta import MetaConfig

APP_SERCRET = MetaConfig.app_secret
APP_ID = MetaConfig.app_piblic


class MetaIntegrationsService:

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
                'accept': 'application/json', 
                'content-type': 'application/json'
            }
        response = self.client.request(method, url, headers=headers, json=json, data=data, params=params)

        if response.is_redirect:
            redirect_url = response.headers.get('Location')
            if redirect_url:
                response = self.client.request(method, redirect_url, headers=headers, json=json, data=data, params=params)
        return response


    def get_credentials(self, domain_id: int):
        return self.integrations_persisntece.get_credentials_for_service(domain_id, SourcePlatformEnum.META.value)

    def get_info_by_access_token(self, access_token: str):
        url = 'https://graph.facebook.com/v20.0/me'
        params = {
            'access_token': access_token
        }
        response = self.__handle_request('GET', url=url, params=params)
        if response.status_code != 200:
            return
        return response.json()

    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        credential = self.get_credentials(domain.id)
        access_token = self.get_long_lived_token(credentials.meta.access_token)
        if not access_token:
            raise HTTPException(status_code=400, detail={'status': 'Long-lived token unavailable'})
        if credential:
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persisntece.db.commit()
            return
        ad_account_info = self.get_info_by_access_token(access_token.get('access_token'))
        new_integration = self.integrations_persisntece.create_integration({
            'domain_id': domain.id,
            'ad_account_id': ad_account_info.get('id'),
            'access_token': access_token.get('access_token'),
            'expire_access_token': access_token.get('expires_in'),
            'last_access_token_update': datetime.now(),
            'service_name': SourcePlatformEnum.META.value,
        })
        integrations = self.integrations_persisntece.get_all_integrations_filter_by(ad_account_id=ad_account_info.get('id'), domain_id=domain.id)
        for integration in integrations:
            integration.access_token == access_token.get('access_token')
            integration.expire_access_token = access_token.get('expires_in')
            integration.last_access_token_update = datetime.now()
            self.integrations_persisntece.db.commit()
        if not new_integration:
            raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return new_integration
    

    def get_long_lived_token(self, fb_exchange_token):
        url = 'https://graph.facebook.com/v20.0/oauth/access_token'
        params = {
            'client_id': APP_ID,
            'client_secret': APP_SERCRET,
            'code': fb_exchange_token
        }
        response = self.__handle_request('GET', url=url, params=params)
        if response.status_code != 200:
            return
        data = response.json()
        return {
            "access_token": data.get('access_token'),
            "token_type": data.get('token_type'),
            "expires_in": data.get('expires_in'),
        }

    def __get_ad_accounts(self, access_token: str):
        url = 'https://graph.facebook.com/v20.0/me/adaccounts'
        params = {
            'fields': 'name',
            'access_token': access_token
        }
        response = self.__handle_request(url=url, params=params, method="GET")
        return response
        
    def get_ad_accounts(self, domain_id: int):
        credentials = self.get_credentials(domain_id)
        if not credentials:
            return
        response = self.__get_ad_accounts(credentials.access_token)
        if not response:
            credentials.is_failed = True
            credentials.error_message = 'Connection Error'
            self.integrations_persisntece.db.commit()
            return
        return [self.__mapped_ad_account(ad_account) for ad_account in response.json().get('data')]
    
    def __get_list(self, ad_account_id, access_token: str):
        url = f'https://graph.facebook.com/v20.0/{ad_account_id}/customaudiences?fields=name'
        params = {
            'fields': 'name',
            'access_token': access_token
        }
        response = self.__handle_request(url=url, params=params, method="GET")
        return response

    def get_list(self, ad_account_id: str, domain_id: str):
        credentials = self.get_credentials(domain_id)
        if not credentials:
            return
        response = self.__get_list(ad_account_id, credentials.access_token)
        if not response:
            credentials.is_failed = True
            credentials.error_message = 'Connection Error'
            self.integrations_persisntece.db.commit()
            return
        return [self.__mapped_meta_list(ad_account) for ad_account in response.json().get('data')]
    


    def create_list(self, list, domain_id: int, description: str = None):
        credential = self.get_credentials(domain_id)
        if not credential:
            raise HTTPException(status_code=403, detail={'status': IntegrationsStatus.CREDENTIALS_NOT_FOUND.value})
        FacebookAdsApi.init(access_token=credential.access_token)
        fields = [
        ]
        params = {
            'name': list.name,
            'subtype': 'CUSTOM',
            'description': description if description else None,
            'customer_file_source': 'USER_PROVIDED_ONLY',
        }
        return {
            'id': AdAccount(f'{list.ad_account_id}').create_custom_audience(
                fields=fields,
                params=params,
            ).get('id'),
            'list_name': list.name
        }
       

    async def create_sync(self, domain_id: int, created_by: str, data_map: List[DataMap] = None, leads_type: str = None, list_id: str = None, list_name: str = None,):
        credentials = self.get_credentials(domain_id)
        data_syncs = self.sync_persistence.get_data_sync_filter_by(domain_id=domain_id)
        for sync in data_syncs:
            if sync.id == credentials.id and sync.leads_type == leads_type:
                return
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'list_id': list_id,
            'list_name': list_name,
            'leads_type': leads_type,
            'domain_id': domain_id,
            'data_map': [data.model_dump_json() for data in data_map] if data_map else None,
            'created_by': created_by
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
        rabbitmq_connection.close()
        
    async def process_data_sync(self, five_x_five_user, access_token, integration_data_sync):
        profile = self.__create_user(five_x_five_user, integration_data_sync.list_id, access_token)
        if profile.get('error'):
            if profile.get('error').get('type') == 'OAuthException':
                return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        
        return ProccessDataSyncResult.SUCCESS.value
    
    def __create_user(self, five_x_five_user, custom_audience_id: str, access_token: str):
        profile = self.__mapped_meta_user(five_x_five_user)
        if profile == ProccessDataSyncResult.INCORRECT_FORMAT.value:
            return profile
        
        payload = {
            "schema": [
                "EMAIL",
                "PHONE",
                "GEN",
                "LN",
                "FN",
                "ST",
                "CT",
                "ZIP",
            ],
            "data": [profile]
        }
        url = f'https://graph.facebook.com/v20.0/{custom_audience_id}/users'
        response = self.__handle_request('POST', url=url, data={
            'access_token': access_token,
            'payload': payload,
            'app_id': APP_ID
            })
        
        return response.json()

    def __mapped_meta_user(self, lead: FiveXFiveUser):
        first_email = (
            getattr(lead, 'business_email') or 
            getattr(lead, 'personal_emails') or 
            getattr(lead, 'additional_personal_emails') or
            getattr(lead, 'programmatic_business_emails', None)
        )
        first_email = extract_first_email(first_email) if first_email else None
        if not first_email:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value
        
        first_phone = (
            getattr(lead, 'mobile_phone') or 
            getattr(lead, 'personal_phone') or 
            getattr(lead, 'direct_number') or 
            getattr(lead, 'company_phone', None)
        )

        def hash_value(value):
            return hashlib.sha256(value.encode('utf-8')).hexdigest() if value else ""
        return [
                hash_value(first_email),                                               # EMAIL
                hash_value(first_phone),                                              # PHONE
                hash_value(lead.gender),                                               # GEN
                hash_value(lead.last_name),                                            # LN
                hash_value(lead.first_name),                                           # FN
                hash_value(lead.personal_state),                                       # ST
                hash_value(lead.personal_city),                                        # CT
                hash_value(lead.personal_zip),                                         # ZIP
            ]
            
    def __mapped_meta_list(self, list):
        return ListFromIntegration(
            id=list.get('id'),
            list_name=list.get('name')
        )


    def __mapped_ad_account(self, ad_account):
        return AdAccountScheme(
            id=ad_account.get('id'),
            name=ad_account.get('name')
        )