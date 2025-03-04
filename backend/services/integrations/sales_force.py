import os
from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from persistence.domains import UserDomainsPersistence
from schemas.integrations.integrations import *
from schemas.integrations.klaviyo import *
from fastapi import HTTPException
from datetime import datetime, timedelta
from utils import extract_first_email
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
import httpx
import json
from utils import format_phone_number
from typing import List
from utils import validate_and_format_phone, format_phone_number


class SalesForceIntegrationsService:

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

    def get_credentials(self, domain_id: str):
        credential = self.integrations_persisntece.get_credentials_for_service(domain_id, SourcePlatformEnum.SALES_FORCE.value)
        return credential
        

    def __save_integrations(self, api_key: str, instance_url: str, domain_id: int, user: dict):
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
            'instance_url': instance_url,
            'service_name': SourcePlatformEnum.SALES_FORCE.value
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
        
    
    def edit_sync(self, leads_type: str, list_id: str, list_name: str, integrations_users_sync_id: int, domain_id: int, created_by: str, data_map: List[DataMap] = [], tags_id: str = None):
        credentials = self.get_credentials(domain_id)
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
            
    def get_token(self, refresh_token):
        access_token = None
        client_id = os.getenv("SALES_FORCE_TOKEN")
        client_secret = os.getenv("SALES_FORCE_SECRET")

        data = {
            "grant_type": "refresh_token",
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
        }

        url = "https://login.salesforce.com/services/oauth2/token"
        
        response = httpx.post(url, data=data)

        if response.status_code == 200:
            access_token = response.json().get("access_token")
        else:
            print(f"Failed to get access token: {response.text}")
            
        return access_token
    
    def create_campaign(access_token, instance_url, campaign_name, status="Planned"):
        # URL для создания кампании в Salesforce
        url = f"{instance_url}/services/data/v52.0/sobjects/Campaign/"
        
        # Данные кампании
        campaign_data = {
            "Name": campaign_name,
            "Status": status  # Например, статус "Planned" или другой
        }
        
        # Заголовки запроса
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Отправка POST запроса для создания кампании
        response = requests.post(url, json=campaign_data, headers=headers)
        
        if response.status_code == 201:
            print("Campaign created successfully!")
            campaign_info = response.json()
            return campaign_info["id"]  # Возвращаем ID кампании
        else:
            print(f"Failed to create campaign: {response.status_code}")
            print(response.text)
            return None

    def create_salesforce_contact(access_token, instance_url, first_name, last_name, email):
        # URL для создания нового контакта в Salesforce
        url = f"{instance_url}/services/data/v52.0/sobjects/Contact/"
        
        # Данные контакта
        contact_data = {
            "FirstName": first_name,
            "LastName": last_name,
            "Email": email
        }
        
        # Заголовки запроса, включая авторизацию с использованием access_token
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Отправка POST запроса для создания контакта
        response = requests.post(url, json=contact_data, headers=headers)
        
        if response.status_code == 201:
            print("Contact created successfully!")
            print(response.json())  # Выводим информацию о созданном контакте
            return response.json()  # Возвращаем данные о созданном контакте
        else:
            print(f"Failed to create contact: {response.status_code}")
            print(response.text)  # Выводим сообщение об ошибке
            return None


    def add_contact_to_campaign(access_token, instance_url, contact_id, campaign_id):
        # URL для добавления контакта в кампанию
        url = f"{instance_url}/services/data/v52.0/sobjects/CampaignMember/"
        
        # Данные для добавления контакта в кампанию
        campaign_member_data = {
            "CampaignId": campaign_id,
            "ContactId": contact_id,
            "Status": "Sent"  # Статус можно задать как "Sent", "Responded" и другие
        }
        
        # Заголовки запроса
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Отправка POST запроса для добавления контакта в кампанию
        response = requests.post(url, json=campaign_member_data, headers=headers)
        
        if response.status_code == 201:
            print("Contact added to campaign successfully!")
            return response.json()  # Возвращаем данные о добавленном члене кампании
        else:
            print(f"Failed to add contact to campaign: {response.status_code}")
            print(response.text)
            return None


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
    
    def test_api_key(self, access_token: str):
        json_data = {
            'data': {
                'type': 'profile',
                'attributes': {
                    'email': 'test',
                    'first_name': 'Test',
                    'last_name': 'Test',
                }
            }
        }
        response = self.__handle_request(
            method='POST',
            url='https://a.klaviyo.com/api/profiles/',
            api_key=access_token,
            json=json_data
        )
        if response.status_code == 400:
            return True
        return False

    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        client_id = os.getenv("SALES_FORCE_TOKEN")
        client_secret = os.getenv("SALES_FORCE_SECRET")
        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": credentials.sales_force.code,
            "grant_type": "authorization_code",
            "redirect_uri": f"{os.getenv('SITE_HOST_URL')}/sales-force-landing",
        }
        response = self.__handle_request(method='POST', url="https://login.salesforce.com/services/oauth2/token", data=data, headers = {"Content-Type": "application/x-www-form-urlencoded"})
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access_token')
            refresh_token = token_data.get('refresh_token')
            instance_url = token_data.get('instance_url')
            integrations = self.__save_integrations(refresh_token, instance_url, domain.id, user)
            return {
                'integrations': integrations,
                'status': IntegrationsStatus.SUCCESS.value
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to get access token")
    
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
    
    async def create_sync(self, leads_type: str, list_id: str, list_name: str, domain_id: int, created_by: str, tags_id: str = None, data_map: List[DataMap] = []):
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

    async def process_data_sync(self, five_x_five_user, user_integration, data_sync, lead_user):
        data_map = data_sync.data_map if data_sync.data_map else None
        profile = self.__create_profile(five_x_five_user, user_integration.access_token, data_map)
        if profile in (ProccessDataSyncResult.AUTHENTICATION_FAILED.value, ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
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
        if profile in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return profile
        
        if data_map:
            properties = self.__map_properties(five_x_five_user, data_map)
        else:
            properties = {}
    
        phone_number = validate_and_format_phone(profile.phone_number)
        json_data = {
            'data': {
                'type': 'profile',
                'attributes': {
                    'email': profile.email,
                    'phone_number': phone_number.split(', ')[-1] if phone_number else None,
                    'first_name': profile.first_name or None,
                    'last_name': profile.last_name or None,
                    'organization': profile.organization or None,
                    'location': profile.location or None,
                    'title': profile.title or None,
                    'properties': properties
                }
            }
        }
        json_data['data']['attributes'] = {k: v for k, v in json_data['data']['attributes'].items() if v is not None}
        email = profile.email
        check_response = self.__handle_request(
            method='GET',
            url=f'https://a.klaviyo.com/api/profiles/?filter=equals(email,"{email}")',
            api_key=api_key
        )

        if check_response.status_code == 200 and check_response.json().get("data"):
            profile_id = check_response.json()["data"][0]["id"]
            json_data['data']['id'] = profile_id
            response = self.__handle_request(
                method='PATCH',
                url=f'https://a.klaviyo.com/api/profiles/{profile_id}',
                api_key=api_key,
                json=json_data
            )
        else:
            response = self.__handle_request(
                method='POST',
                url='https://a.klaviyo.com/api/profiles/',
                api_key=api_key,
                json=json_data
            )
        if response.status_code in (200, 201):
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

        location = {
            "address1": getattr(five_x_five_user, 'personal_address') or getattr(five_x_five_user, 'company_address', None),
            "city": getattr(five_x_five_user, 'personal_city') or getattr(five_x_five_user, 'company_city', None),
            "region": getattr(five_x_five_user, 'personal_state') or getattr(five_x_five_user, 'company_state', None),
            "zip": getattr(five_x_five_user, 'personal_zip') or getattr(five_x_five_user, 'company_zip', None),
        }
        return KlaviyoProfile(
            email=first_email,
            phone_number=format_phone_number(first_phone),
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
                properties[new_field] = value_field.isoformat() if isinstance(value_field, datetime) else value_field
            else:
                properties[new_field] = None

        mapped_fields = {mapping.get("value") for mapping in data_map}
        if "Time on site" in mapped_fields or "URL Visited" in mapped_fields:
            time_on_site, url_visited = self.leads_persistence.get_visit_stats(five_x_five_user.id)
        if "Time on site" in mapped_fields:
            properties["Time on site"] = time_on_site
        if "URL Visited" in mapped_fields:
            properties["URL Visited"] = url_visited
            
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

