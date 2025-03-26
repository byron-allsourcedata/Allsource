

import hashlib
from schemas.integrations.meta import AdAccountScheme
from models.five_x_five_users import FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
from persistence.domains import UserDomainsPersistence
import httpx
import os
from datetime import datetime, timedelta
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.api import FacebookAdsApi
from fastapi import HTTPException
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from datetime import datetime
from utils import extract_first_email
from schemas.integrations.integrations import IntegrationCredentials, DataMap, ListFromIntegration
from utils import format_phone_number
from typing import List
from config.meta import MetaConfig

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
        
        common_integration = bool(os.getenv('COMMON_INTEGRATION'))
        integration_data = {
            'ad_account_id': ad_account_info.get('id'),
            'access_token': access_token.get('access_token'),
            'full_name': user.get('full_name'),
            'expire_access_token': access_token.get('expires_in'),
            'last_access_token_update': datetime.now(),
            'service_name': SourcePlatformEnum.META.value
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
        url = f"https://graph.facebook.com/v20.0/{ad_account_id}/customaudiences"
        
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
        url = 'https://graph.facebook.com/v20.0/oauth/access_token'
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
        url = 'https://graph.facebook.com/v20.0/me/adaccounts'
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
        url = f'https://graph.facebook.com/v20.0/{ad_account_id}/customaudiences?fields=name'
        params = {
            'fields': 'name',
            'access_token': access_token
        }
        response = self.__handle_request(url=url, params=params, method="GET")
        return response
    
    def __get_campaigns_list(self, ad_account_id, access_token: str):
        url = f'https://graph.facebook.com/v20.0/{ad_account_id}/campaigns?fields=name'
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
        audience_lists = [self.__mapped_meta_list(audience) for audience in response_audience.json().get('data')]
        campaign_lists = [self.__mapped_meta_list(campaign) for campaign in response_campaign.json().get('data')]
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
            'domain_id': domain_id,
            'leads_type': leads_type,
            'created_by': created_by,
        }, integrations_users_sync_id)
        return sync
    
    def create_adset(self, ad_account_id, campaign_name, campaign_id, access_token, list_id, campaign_objective, bid_amount):
        url = f'https://graph.facebook.com/v20.0/{ad_account_id}/adsets'
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
        url = f'https://graph.facebook.com/v20.0/{ad_account_id}/campaigns'
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
            'data_map': [data.model_dump_json() for data in data_map] if data_map else None,
            'created_by': created_by
        })
        return sync
        
    async def process_data_sync(self, five_x_five_user, user_integration, integration_data_sync, lead_user):
        profile = self.__create_user(five_x_five_user=five_x_five_user, custom_audience_id=integration_data_sync.list_id, access_token=user_integration.access_token)
        
        if profile in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return profile
        
        if profile.get('error'):
            if profile.get('error').get('type') == 'OAuthException':
                return ProccessDataSyncResult.AUTHENTICATION_FAILED.value

        return ProccessDataSyncResult.SUCCESS.value

    def __create_user(self, five_x_five_user, custom_audience_id: str, access_token: str):
        profile = self.__hash_mapped_meta_user(five_x_five_user)
        if profile in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
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
                "ZIP"
            ],
            "data": [profile]
        }
        url = f'https://graph.facebook.com/v20.0/{custom_audience_id}/users'
        response = self.__handle_request(method='POST', url=url, params={'access_token': access_token}, data={
            'payload': payload,
            'app_id': APP_ID
            })
        return response.json()

    def __hash_mapped_meta_user(self, five_x_five_user: FiveXFiveUser):
        email_fields = [
            'business_email', 
            'personal_emails', 
            'additional_personal_emails',
        ]
        
        def get_valid_email(user) -> str:
            thirty_days_ago = datetime.now() - timedelta(days=30)
            thirty_days_ago_str = thirty_days_ago.strftime('%Y-%m-%d %H:%M:%S')
            verity = 0
            for field in email_fields:
                email = getattr(user, field, None)
                if email:
                    emails = extract_first_email(email)
                    for e in emails:
                        if e and field == 'business_email' and five_x_five_user.business_email_last_seen:
                            if five_x_five_user.business_email_last_seen.strftime('%Y-%m-%d %H:%M:%S') > thirty_days_ago_str:
                                return e.strip()
                        if e and field == 'personal_emails' and five_x_five_user.personal_emails_last_seen:
                            personal_emails_last_seen_str = five_x_five_user.personal_emails_last_seen.strftime('%Y-%m-%d %H:%M:%S')
                            if personal_emails_last_seen_str > thirty_days_ago_str:
                                return e.strip()
                        if e and self.million_verifier_integrations.is_email_verify(email=e.strip()):
                            return e.strip()
                        verity += 1
            if verity > 0:
                return ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        first_email = get_valid_email(five_x_five_user)
        
        if first_email in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return first_email
        
        first_phone = (
            getattr(five_x_five_user, 'mobile_phone') or 
            getattr(five_x_five_user, 'personal_phone') or 
            getattr(five_x_five_user, 'direct_number') or 
            getattr(five_x_five_user, 'company_phone', None)
        )
        first_phone = format_phone_number(first_phone)

        def hash_value(value):
            return hashlib.sha256(value.encode('utf-8')).hexdigest() if value else ""
        return [
                hash_value(first_email),                                                           # EMAIL
                hash_value(first_phone),                                                           # PHONE
                hash_value(five_x_five_user.gender),                                               # GEN
                hash_value(five_x_five_user.last_name),                                            # LN
                hash_value(five_x_five_user.first_name),                                           # FN
                hash_value(five_x_five_user.personal_state),                                       # ST
                hash_value(five_x_five_user.personal_city),                                        # CT
                hash_value(five_x_five_user.personal_zip),                                         # ZIP
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