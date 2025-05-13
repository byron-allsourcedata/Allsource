import json
import re
import hashlib
from schemas.integrations.meta import AdAccountScheme
from models.five_x_five_users import FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
from persistence.domains import UserDomainsPersistence
import httpx
import os
from faker import Faker
from services.integrations.commonIntegration import resolve_main_email_and_phone
from datetime import datetime, timedelta
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult, DataSyncType, IntegrationLimit
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.api import FacebookAdsApi
from fastapi import HTTPException
from models.enrichment.enrichment_users import EnrichmentUser
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from datetime import datetime
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from utils import extract_first_email
from schemas.integrations.integrations import IntegrationCredentials, DataMap, ListFromIntegration
from utils import format_phone_number
from typing import List
from config.meta import MetaConfig
from uuid import UUID

APP_SECRET = MetaConfig.app_secret
APP_ID = MetaConfig.app_piblic


class MetaIntegrationsService:

    def __init__(self, domain_persistence: UserDomainsPersistence, integrations_persistence: IntegrationsPresistence, leads_persistence: LeadsPersistence,
                sync_persistence: IntegrationsUserSyncPersistence, client: httpx.Client, million_verifier_integrations: MillionVerifierIntegrationsService):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
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


    def get_credentials(self, domain_id: int, user_id: int):
        return self.integrations_persisntece.get_credentials_for_service(domain_id=domain_id, user_id=user_id, service_name=SourcePlatformEnum.META.value)

    def get_smart_credentials(self, user_id: int):
        credential = self.integrations_persisntece.get_smart_credentials_for_service(user_id=user_id, service_name=SourcePlatformEnum.META.value)
        return credential

    def get_info_by_access_token(self, access_token: str):
        url = 'https://graph.facebook.com/v22.0/me'
        params = {
            'access_token': access_token
        }
        response = self.__handle_request('GET', url=url, params=params)
        if response.status_code != 200:
            return
        return response.json()

    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        credential = self.get_credentials(domain.id, user.get('id'))
        access_token = self.get_long_lived_token(credentials.meta.access_token)
        if not access_token:
            raise HTTPException(status_code=400, detail={'status': 'Long-lived token unavailable'})
        if credential:
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persisntece.db.commit()
            return
        ad_account_info = self.get_info_by_access_token(access_token.get('access_token'))
        
        common_integration = os.getenv('COMMON_INTEGRATION') == 'True'
        integration_data = {
            'ad_account_id': ad_account_info.get('id'),
            'access_token': access_token.get('access_token'),
            'full_name': user.get('full_name'),
            'expire_access_token': access_token.get('expires_in'),
            'last_access_token_update': datetime.now(),
            'service_name': SourcePlatformEnum.META.value,
            'limit': IntegrationLimit.META.value
        }

        if common_integration:
            integration_data['user_id'] = user.get('id')
        else:
            integration_data['domain_id'] = domain.id
            
        integartion = self.integrations_persisntece.create_integration(integration_data)
        
        integrations = self.integrations_persisntece.get_all_integrations_filter_by(ad_account_id=ad_account_info.get('id'), domain_id=domain.id)
        for integration in integrations:
            integration.access_token == access_token.get('access_token')
            integration.expire_access_token = access_token.get('expires_in')
            integration.last_access_token_update = datetime.now()
            self.integrations_persisntece.db.commit()
        if not integartion:
            raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        
        return integartion
    
    def check_custom_audience_terms(self, ad_account_id, access_token):
        url = f"https://graph.facebook.com/v22.0/{ad_account_id}/customaudiences"
        
        params = {
            "access_token": access_token,
            "name": "Custom Audience test",
            "subtype": "CUSTOM",
            "customer_file_source": "USER_PROVIDED_ONLY"
        }

        response = self.__handle_request("POST", url=url, params=params)

        if response.status_code == 200:
            return {"terms_accepted": True}
        
        error_data = response.json()
        if error_data.get('error', {}).get('error_subcode') == 1870090:
            ad_account_id = ad_account_id.replace("act_", "")
            terms_link = f"https://business.facebook.com/ads/manage/customaudiences/tos/?act={ad_account_id}"
            return {"terms_accepted": False, "terms_link": terms_link}
        
        return {"terms_accepted": False, "error": error_data}

    def get_long_lived_token(self, fb_exchange_token):
        url = 'https://graph.facebook.com/v22.0/oauth/access_token'
        params = {
            'client_id': APP_ID,
            'client_secret': APP_SECRET,
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
        url = 'https://graph.facebook.com/v22.0/me/adaccounts'
        params = {
            'fields': 'name',
            'access_token': access_token
        }
        response = self.__handle_request(url=url, params=params, method="GET")
        return response
        
    def get_ad_accounts(self, domain_id: int, user_id: int):
        credentials = self.get_credentials(domain_id, user_id)
        if not credentials:
            return
        response = self.__get_ad_accounts(credentials.access_token)
        if not response:
            credentials.is_failed = True
            credentials.error_message = 'Connection Error'
            self.integrations_persisntece.db.commit()
            return
        return [self.__mapped_ad_account(ad_account) for ad_account in response.json().get('data')]
    
    def __get_audience_list(self, ad_account_id, access_token: str):
        url = f'https://graph.facebook.com/v22.0/{ad_account_id}/customaudiences?fields=name'
        params = {
            'fields': 'name',
            'access_token': access_token
        }
        response = self.__handle_request(url=url, params=params, method="GET")
        return response
    
    def __get_campaigns_list(self, ad_account_id, access_token: str):
        url = f'https://graph.facebook.com/v22.0/{ad_account_id}/campaigns?fields=name'
        params = {
            'fields': 'name',
            'access_token': access_token
        }
        response = self.__handle_request(url=url, params=params, method="GET")
        return response

    def get_list(self, ad_account_id: str, domain_id: int, user_id: int):
        credentials = self.get_credentials(domain_id, user_id)
        if not credentials:
            return
        response_audience = self.__get_audience_list(ad_account_id, credentials.access_token)
        response_campaign = self.__get_campaigns_list(ad_account_id, credentials.access_token)
        if not response_audience or not response_campaign:
            credentials.is_failed = True
            credentials.error_message = 'Connection Error'
            self.integrations_persisntece.db.commit()
            return
        audience_lists = [self.__mapped_meta_list(audience) for audience in response_audience.json().get('data')] if response_audience else []
        campaign_lists = [self.__mapped_meta_list(campaign) for campaign in response_campaign.json().get('data')] if response_campaign else []
        return {
            'audience_lists': audience_lists,
            'campaign_lists': campaign_lists
        }

    def create_list(self, list, domain_id: int, user_id: int, description: str = None):
        credential = self.get_credentials(domain_id, user_id)
        if not credential:
            raise HTTPException(status_code=403, detail={'status': IntegrationsStatus.CREDENTIALS_NOT_FOUND.value})
        FacebookAdsApi.init(access_token=credential.access_token)
        fields = []
        id_account = None
        params = {
            'name': list.name,
            'subtype': 'CUSTOM',
            'description': description if description else None,
            'customer_file_source': 'USER_PROVIDED_ONLY',
        }
        try:
            id_account = AdAccount(f'{list.ad_account_id}').create_custom_audience(
                    fields=fields,
                    params=params,
                ).get('id')
        except:
            return self.check_custom_audience_terms(list.ad_account_id, credential.access_token)
        
        return {
            'id': id_account,
            'list_name': list.name
        }
    
    def edit_sync(self, leads_type: str, integrations_users_sync_id: int, domain_id: int, created_by: str, user_id: int, campaign = {}, customer_id = None, list_id = None):
        credentials = self.get_credentials(domain_id, user_id)
        campaign_id = campaign.get('campaign_id')
        if campaign_id == -1 and campaign.get('campaign_name'):
            campaign_id = self.create_campaign(campaign['campaign_name'], campaign['daily_budget'], credentials.access_token, customer_id)
        if campaign_id and campaign_id != -1:
            self.create_adset(customer_id, campaign['campaign_name'], campaign_id, credentials.access_token, list_id, campaign['campaign_objective'], campaign['bid_amount'])
        
        sync = self.sync_persistence.edit_sync({
            'integration_id': credentials.id,
            'leads_type': leads_type,
            'created_by': created_by,
        }, integrations_users_sync_id)
        return sync
    
    def create_adset(self, ad_account_id, campaign_name, campaign_id, access_token, list_id, campaign_objective, bid_amount):
        url = f'https://graph.facebook.com/v22.0/{ad_account_id}/adsets'
        ad_set_data = {
            'name': f"{campaign_name}_ad",
            'optimization_goal': campaign_objective,
            'billing_event': 'IMPRESSIONS',
            'bid_amount': bid_amount,
            'targeting': {
                'custom_audiences': [{'id': list_id}],
                'geo_locations': {'countries': ['US']}
            },
            'campaign_id': campaign_id,
            'access_token': access_token,
            'status': 'PAUSED',
        }
        response = self.__handle_request(method='POST', url=url, json=ad_set_data)
    
    def create_campaign(self, campaign_name, daily_budget, access_token, ad_account_id):
        url = f'https://graph.facebook.com/v22.0/{ad_account_id}/campaigns'
        campaign_data = {
            'name': campaign_name,
            'objective': 'OUTCOME_TRAFFIC',
            'status': 'ACTIVE',
            'buying_type': 'AUCTION',
            'daily_budget': daily_budget,
            'start_time': '2025-03-20T00:00:00',
            'end_time': '2026-03-20T00:00:00',
            'access_token': access_token,
            'special_ad_categories': []
        }
        response = self.__handle_request(method='POST', url=url, json=campaign_data)
        response = response.json()
        campaign_id = response['id']
        return campaign_id

    async def create_sync(self, customer_id: int, domain_id: int, created_by: str, user: dict, campaign = {}, data_map: List[DataMap] = None, leads_type: str = None, list_id: str = None, list_name: str = None,):
        credentials = self.get_credentials(domain_id=domain_id, user_id=user.get('id'))
        campaign_id = campaign.get('campaign_id')
        if campaign_id == -1 and campaign.get('campaign_name'):
            campaign_id = self.create_campaign(campaign['campaign_name'], campaign['daily_budget'], credentials.access_token, customer_id)
        if campaign_id and campaign_id != -1:
            self.create_adset(customer_id, campaign['campaign_name'], campaign_id, credentials.access_token, list_id, campaign['campaign_objective'], campaign['bid_amount'])
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'list_id': list_id,
            'list_name': list_name,
            'leads_type': leads_type,
            'domain_id': domain_id,
            'customer_id': customer_id,
            'campaign_id': campaign_id,
            'campaign_name': campaign.get('campaign_name'),
            'data_map': [data.model_dump_json() for data in data_map] if data_map else None,
            'created_by': created_by
        })
        return sync
    
    def create_smart_audience_sync(self, customer_id: int, created_by: str, user: dict, smart_audience_id: UUID, sent_contacts: int, campaign = {}, data_map: List[DataMap] = None, list_id: str = None, list_name: str = None,):
        credentials = self.get_smart_credentials(user_id=user.get('id'))
        campaign_id = campaign.get('campaign_id')        
        if campaign_id == -1 and campaign.get('campaign_name'):
            campaign_id = self.create_campaign(campaign['campaign_name'], campaign['daily_budget'], credentials.access_token, customer_id)
        if campaign_id and campaign_id != -1:
            self.create_adset(customer_id, campaign['campaign_name'], campaign_id, credentials.access_token, list_id, campaign['campaign_objective'], campaign['bid_amount'])
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'list_id': list_id,
            'list_name': list_name,
            'customer_id': customer_id,
            'sent_contacts': sent_contacts,
            'campaign_id': campaign_id,
            'campaign_name': campaign.get('campaign_name'),
            'sync_type': DataSyncType.AUDIENCE.value,
            'smart_audience_id': smart_audience_id,
            'data_map': data_map if data_map else None,
            'created_by': created_by
        })
        return sync
        
    async def process_data_sync(self, user_integration: UserIntegration, integration_data_sync: IntegrationUserSync, enrichment_users: EnrichmentUser, target_schema: str, validations: dict):
        profiles = []
        for enrichment_user in enrichment_users:
            profile = self.__hash_mapped_meta_user(enrichment_user, target_schema, validations)
            if profile:
                profiles.append(profile)
            
        if not profiles:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value
            
        return self.__create_user(custom_audience_id=integration_data_sync.list_id, access_token=user_integration.access_token, profiles=profiles)

    def __create_user(self, custom_audience_id: str, access_token: str, profiles: List[dict]):
        payload = {
            "schema": [
                "EMAIL", "PHONE", "GEN", "DOBY", "DOBM", "DOBD",
                "FN", "LN", "FI", "ST", "CT", "ZIP",
                "COUNTRY"
            ],
            "data":   profiles
        }
        session = {
            "session_id": 1,
            "batch_seq": 1,
            "last_batch_flag": True,
            "estimated_num_total": len(profiles)
        }
        url = f'https://graph.facebook.com/v22.0/{custom_audience_id}/users'
        response = self.__handle_request(method='POST', url=url, params={'access_token': access_token}, data={
            "session": json.dumps(session),
            'payload': json.dumps(payload),
            'app_id': APP_ID
            })
        
        result = response.json()
        
        if result.get('error',{}).get('type') == 'OAuthException':
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        
        return ProccessDataSyncResult.SUCCESS.value
    
    def __hash_mapped_meta_user(self, enrichment_user: EnrichmentUser, target_schema: str, validations: dict):
        enrichment_contacts = enrichment_user.contacts
        if not enrichment_contacts:
            return None
        
        business_email, personal_email, phone = self.sync_persistence.get_verified_email_and_phone(enrichment_user.id)
        main_email, main_phone = resolve_main_email_and_phone(enrichment_contacts, validations, target_schema, business_email, personal_email, phone)
        first_name = enrichment_contacts.first_name
        last_name = enrichment_contacts.last_name
        
        if not main_email or not first_name or not last_name:
            return None
        
        enrichment_personal_profiles = enrichment_user.personal_profiles
        enrichment_user_postal = enrichment_user.postal
        city = None
        state = None
        zip_code = None
        gender = None
        birth_day = None
        birth_month = None
        birth_year = None
        country = None
        
        if enrichment_user_postal:
            city = enrichment_user_postal.home_city
            if not city:
                city = enrichment_user_postal.business_city
            state = enrichment_user_postal.home_state
            if not state:
                state = enrichment_user_postal.business_state
            country = enrichment_user_postal.home_country
            if not country:
                country = enrichment_user_postal.business_country
        
        if enrichment_personal_profiles:
            zip_code = str(enrichment_personal_profiles.zip_code5)
            
            if enrichment_personal_profiles.gender == 1:
                gender = 'm'
            elif enrichment_personal_profiles.gender == 2:
                gender = 'f'
            birth_day = str(enrichment_personal_profiles.birth_day)
            birth_month = str(enrichment_personal_profiles.birth_month)
            birth_year = str(enrichment_personal_profiles.birth_year)
        
        def hash_value(value):
            return hashlib.sha256(value.encode('utf-8')).hexdigest() if value else ""
        
        return [
                hash_value(main_email),                                                            # EMAIL
                hash_value(main_phone),                                                            # PHONE
                hash_value(gender),                                                                # GEN
                hash_value(birth_year),                                                            # DOBY
                hash_value(birth_month),                                                           # DOBM
                hash_value(birth_day),                                                             # DOBD
                hash_value(first_name),                                                            # FN
                hash_value(last_name),                                                             # LN
                hash_value(first_name[0].lower()),                                                 # FI
                hash_value(state),                                                                 # ST
                hash_value(city),                                                                  # CT
                hash_value(zip_code),                                                              # ZIP
                hash_value(country),                                                               # COUNTRY
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