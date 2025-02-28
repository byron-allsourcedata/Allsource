from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from persistence.domains import UserDomainsPersistence
from schemas.integrations.integrations import *
import os
import hashlib
import uuid
from google.auth.transport.requests import Request
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from schemas.integrations.klaviyo import *
from fastapi import HTTPException
from datetime import datetime, timedelta
from utils import extract_first_email
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
import httpx
from utils import format_phone_number
from typing import List
from utils import validate_and_format_phone, format_phone_number


class GoogleAdsIntegrationsService:

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
        credential = self.integrations_persisntece.get_credentials_for_service(domain_id, SourcePlatformEnum.GOOGLE_ADS.value)
        return credential
        

    def __save_integrations(self, access_token: str, domain_id: int, user: dict):
        credential = self.get_credentials(domain_id)
        if credential:
            credential.access_token = access_token
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persisntece.db.commit()
            return credential
        integartions = self.integrations_persisntece.create_integration({
            'domain_id': domain_id,
            'access_token': access_token,
            'full_name': user.get('full_name'),
            'service_name': SourcePlatformEnum.GOOGLE_ADS.value
        })
        if not integartions:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return integartions

    def edit_sync(self, leads_type: str, list_id: str, list_name: str, integrations_users_sync_id: int, domain_id: int, created_by: str, data_map: List[DataMap] = None ,tags_id: str = None):
        credentials = self.get_credentials(domain_id)
        data_syncs = self.sync_persistence.get_filter_by(domain_id=domain_id)
        for sync in data_syncs:
            if sync.get('integration_id') == credentials.id and sync.get('leads_type') == leads_type:
                return
        sync = self.sync_persistence.edit_sync({
            'integration_id': credentials.id,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'created_by': created_by,
        }, integrations_users_sync_id)
        if tags_id: 
            self.update_tag_relationships_lists(tags_id=tags_id, list_id=list_id, api_key=credentials.access_token)


    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        client_id = os.getenv("CLIENT_GOOGLE_ID")
        client_secret = os.getenv("CLIENT_GOOGLE_SECRET")
        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": credentials.google_ads.code,
            "grant_type": "authorization_code",
            "redirect_uri": f"{os.getenv("SITE_HOST_URL")}/google-ads-landing",
        }
        response = self.__handle_request(method='POST', url="https://oauth2.googleapis.com/token", json=data)
        token_info = response.json()
        access_token = token_info.get("refresh_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to get access token")

        integrations = self.__save_integrations(access_token, domain.id, user)
        return {
            'integrations': integrations,
            'status': IntegrationsStatus.SUCCESS.value
        }
    
    
    async def create_sync(self, customer_id: str, leads_type: str, list_id: str, list_name: str, domain_id: int, created_by: str, tags_id: str = None, data_map: List[DataMap] = []):
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
            'customer_id': customer_id
        })
        if tags_id: 
            self.create_tag_relationships_lists(tags_id=tags_id, list_id=list_id, api_key=credentials.access_token)

    async def process_data_sync(self, five_x_five_user, user_integration, data_sync, lead_user):
        profile = self.__create_profile(five_x_five_user, user_integration.access_token)
        if profile in (ProccessDataSyncResult.AUTHENTICATION_FAILED.value, ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return profile

        list_response = self.__add_profile_to_list(data_sync.list_id, profile.get('id'), user_integration.access_token)
        if list_response.status_code == 404:
            return ProccessDataSyncResult.LIST_NOT_EXISTS.value
            
        return ProccessDataSyncResult.SUCCESS.value
    
    def __create_profile(self, five_x_five_user, api_key: str, data_map):
        profile = self.__mapped_googleads_profile(five_x_five_user)
        if profile in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return profile

        phone_number = validate_and_format_phone(profile.phone_number)
        build_offline_user_data_job_operations()

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
    
    def __add_profile_to_list(self,domain_id, customer_id, user_list_id=None):
        credential = self.get_credentials(domain_id)
        client = self.get_google_ads_client(credential.access_token)
        run_job = True
        offline_user_data_job_id = None
        ad_user_data_consent = None
        ad_personalization_consent = None
        user_list_resource_name = self.create_customer_match_user_list(client, customer_id)
        try:
            googleads_service = client.get_service("GoogleAdsService")

            if not offline_user_data_job_id:
                user_list_resource_name = googleads_service.user_list_path(
                    customer_id, user_list_id
                )

            self.add_users_to_customer_match_user_list(
                client,
                customer_id,
                user_list_resource_name,
                run_job,
                offline_user_data_job_id,
                ad_user_data_consent,
                ad_personalization_consent,
            )
        except GoogleAdsException as ex:
            print(
                f"Request with ID '{ex.request_id}' failed with status "
                f"'{ex.error.code().name}' and includes the following errors:"
            )
            for error in ex.failure.errors:
                print(f"\tError with message '{error.message}'.")
                if error.location:
                    for field_path_element in error.location.field_path_elements:
                        print(f"\t\tOn field: {field_path_element.field_name}")
    
                
    def set_suppression(self, suppression: bool, domain_id: int):
            credential = self.get_credentials(domain_id)
            if not credential:
                raise HTTPException(status_code=403, detail=IntegrationsStatus.CREDENTIALS_NOT_FOUND.value)
            credential.suppression = suppression
            self.integrations_persisntece.db.commit()
            return {'message': 'successfuly'}  
    
    def __mapped_googleads_profile(self, five_x_five_user: FiveXFiveUser) -> GoogleAdsProfile:
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
        return GoogleAdsProfile(
            email=first_email,
            phone_number=format_phone_number(first_phone),
            first_name=getattr(five_x_five_user, 'first_name', None),
            last_name=getattr(five_x_five_user, 'last_name', None),
            organization=getattr(five_x_five_user, 'company_name', None),
            location=location,
            title=getattr(five_x_five_user, 'job_title', None))
        
    def get_google_ads_client(self, refresh_token):
        credentials = Credentials(
            None,
            refresh_token=refresh_token,
            client_id=os.getenv("CLIENT_GOOGLE_ID"),
            client_secret=os.getenv("CLIENT_GOOGLE_SECRET"),
            token_uri="https://oauth2.googleapis.com/token"
        )
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
            
        client = GoogleAdsClient(credentials=credentials, developer_token=os.getenv("GOOGLE_ADS_TOKEN"))
        return client
    
    def create_list(self, list, domain_id):
        try:
            credential = self.get_credentials(domain_id)
            client = self.get_google_ads_client(credential.access_token)
            channel = self.create_customer_match_user_list(client, list.customer_id, list.name)
            if not channel:
                return {'status': IntegrationsStatus.CREATE_IS_FAILED.value, 'message': 'Create is failed'}
            
            return {'status': IntegrationsStatus.SUCCESS.value, 'channel': {'list_id': list.customer_id, 'list_name': list.name}}
        except GoogleAdsException as ex:
            print(
                f"Request with ID '{ex.request_id}' failed with status "
                f"'{ex.error.code().name}' and includes the following errors:"
            )
            # details = googleads_error.failure.errors[0].message
            # print(f"Google Ads API error occurred: {googleads_error}")
            return {'status': IntegrationsStatus.CREDENTAILS_INVALID.value, 'message': str(ex.error.code().name)}
    
    def create_customer_match_user_list(self, client, customer_id, list_name):
        user_list_service_client = client.get_service("UserListService")
        user_list_operation = client.get_type("UserListOperation")
        user_list = user_list_operation.create
        user_list.name = list_name
        user_list.description = (
            "A list of customers that originated from email and physical addresses"
        )
        user_list.crm_based_user_list.upload_key_type = (
            client.enums.CustomerMatchUploadKeyTypeEnum.CONTACT_INFO
        )
        user_list.membership_life_span = 300
        
        response = user_list_service_client.mutate_user_lists(
            customer_id=customer_id, operations=[user_list_operation]
        )
        user_list_resource_name = response.results[0].resource_name
        
        return user_list_resource_name
    
    def add_users_to_customer_match_user_list(self, client, customer_id, user_list_resource_name, run_job, 
                                              offline_user_data_job_id, 
                                              ad_user_data_consent,
                                              ad_personalization_consent):
        offline_user_data_job_service_client = client.get_service(
            "OfflineUserDataJobService"
        )

        if offline_user_data_job_id:
            offline_user_data_job_resource_name = (
                offline_user_data_job_service_client.offline_user_data_job_path(
                    customer_id, offline_user_data_job_id
                )
            )
        else:
            offline_user_data_job = client.get_type("OfflineUserDataJob")
            offline_user_data_job.type_ = (
                client.enums.OfflineUserDataJobTypeEnum.CUSTOMER_MATCH_USER_LIST
            )
            offline_user_data_job.customer_match_user_list_metadata.user_list = (
                user_list_resource_name
            )

            if ad_user_data_consent:
                offline_user_data_job.customer_match_user_list_metadata.consent.ad_user_data = client.enums.ConsentStatusEnum[
                    ad_user_data_consent
                ]
            if ad_personalization_consent:
                offline_user_data_job.customer_match_user_list_metadata.consent.ad_personalization = client.enums.ConsentStatusEnum[
                    ad_personalization_consent
                ]

            create_offline_user_data_job_response = (
                offline_user_data_job_service_client.create_offline_user_data_job(
                    customer_id=customer_id, job=offline_user_data_job
                )
            )
            offline_user_data_job_resource_name = (
                create_offline_user_data_job_response.resource_name
            )
            print(
                "Created an offline user data job with resource name: "
                f"'{offline_user_data_job_resource_name}'."
            )
            
        request = client.get_type("AddOfflineUserDataJobOperationsRequest")
        request.resource_name = offline_user_data_job_resource_name
        request.operations.extend(self.build_offline_user_data_job_operations(client))
        request.enable_partial_failure = True

        response = offline_user_data_job_service_client.add_offline_user_data_job_operations(
            request=request
        )

        partial_failure = getattr(response, "partial_failure_error", None)
        if getattr(partial_failure, "code", None) != 0:
            error_details = getattr(partial_failure, "details", [])
            for error_detail in error_details:
                failure_message = client.get_type("GoogleAdsFailure")
                failure_object = type(failure_message).deserialize(
                    error_detail.value
                )

                for error in failure_object.errors:
                    print(
                        "A partial failure at index "
                        f"{error.location.field_path_elements[0].index} occurred.\n"
                        f"Error message: {error.message}\n"
                        f"Error code: {error.error_code}"
                    )

        print("The operations are added to the offline user data job.")

        if not run_job:
            print(
                "Not running offline user data job "
                f"'{offline_user_data_job_resource_name}', as requested."
            )
            return

        # Issues a request to run the offline user data job for executing all
        # added operations.
        offline_user_data_job_service_client.run_offline_user_data_job(
            resource_name=offline_user_data_job_resource_name
        )
    
    def build_offline_user_data_job_operations(self, client):
        raw_record = {
            "email": "alex.2@example.com",
            "first_name": "Alex",
            "last_name": "Quinn",
            "country_code": "US",
            "postal_code": "94045",
            "phone": "+1 800 5550102",
            "birth_date": "1990-01-01",  # Пример добавления даты рождения
            "signup_date": "2023-02-01",  # Дата регистрации
            "custom_id": "12345abc",      # Уникальный идентификатор клиента
            "ip_address": "192.168.1.1",  # Пример IP-адреса
            "gender": "M",                # Пример пола
            "source": "facebook_ads",     # Источник канала
            "user_segment": "paid",       # Сегмент пользователей
            "transaction_id": "txn_67890",# Идентификатор транзакции
            "interaction_type": "view",   # Тип взаимодействия
            "interests": "electronics",   # Интересы пользователя
            "url_visited": "https://example.com/product/123", # URL-страница
            "device_type": "mobile",      # Тип устройства
        }
        raw_records = [raw_record]

        operations = []
        for record in raw_records:
            user_data = client.get_type("UserData")

            # Обработка email
            if "email" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.hashed_email = self.normalize_and_hash(record["email"], True)
                user_data.user_identifiers.append(user_identifier)

            # Обработка номера телефона
            if "phone" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.hashed_phone_number = self.normalize_and_hash(record["phone"], True)
                user_data.user_identifiers.append(user_identifier)

            # Обработка имени и фамилии с адресом
            if "first_name" in record:
                required_keys = ("last_name", "country_code", "postal_code")
                if not all(key in record for key in required_keys):
                    missing_keys = record.keys() - required_keys
                    print(
                        "Skipping addition of mailing address information "
                        "because the following required keys are missing: "
                        f"{missing_keys}"
                    )
                else:
                    user_identifier = client.get_type("UserIdentifier")
                    address_info = user_identifier.address_info
                    address_info.hashed_first_name = self.normalize_and_hash(record["first_name"], False)
                    address_info.hashed_last_name = self.normalize_and_hash(record["last_name"], False)
                    address_info.country_code = record["country_code"]
                    address_info.postal_code = record["postal_code"]
                    user_data.user_identifiers.append(user_identifier)

            # Обработка даты рождения
            if "birth_date" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.hashed_birth_date = self.normalize_and_hash(record["birth_date"], False)
                user_data.user_identifiers.append(user_identifier)

            # Обработка даты регистрации
            if "signup_date" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.hashed_signup_date = self.normalize_and_hash(record["signup_date"], False)
                user_data.user_identifiers.append(user_identifier)

            # Обработка уникального идентификатора клиента
            if "custom_id" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.custom_id = self.normalize_and_hash(record["custom_id"], False)
                user_data.user_identifiers.append(user_identifier)

            # Обработка IP-адреса
            if "ip_address" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.hashed_ip_address = self.normalize_and_hash(record["ip_address"], True)
                user_data.user_identifiers.append(user_identifier)

            # Обработка пола
            if "gender" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.hashed_gender = self.normalize_and_hash(record["gender"], False)
                user_data.user_identifiers.append(user_identifier)

            # Обработка источника канала
            if "source" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.hashed_source = self.normalize_and_hash(record["source"], False)
                user_data.user_identifiers.append(user_identifier)

            # Обработка сегмента пользователей
            if "user_segment" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.hashed_user_segment = self.normalize_and_hash(record["user_segment"], False)
                user_data.user_identifiers.append(user_identifier)

            # Обработка идентификатора транзакции
            if "transaction_id" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.transaction_id = self.normalize_and_hash(record["transaction_id"], False)
                user_data.user_identifiers.append(user_identifier)

            # Обработка типа взаимодействия
            if "interaction_type" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.hashed_interaction_type = self.normalize_and_hash(record["interaction_type"], False)
                user_data.user_identifiers.append(user_identifier)

            # Обработка интересов пользователя
            if "interests" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.hashed_interests = self.normalize_and_hash(record["interests"], False)
                user_data.user_identifiers.append(user_identifier)

            # Обработка URL-страницы
            if "url_visited" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.hashed_url_visited = self.normalize_and_hash(record["url_visited"], False)
                user_data.user_identifiers.append(user_identifier)

            # Обработка типа устройства
            if "device_type" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.device_type = self.normalize_and_hash(record["device_type"], False)
                user_data.user_identifiers.append(user_identifier)

            # Если у нас есть идентификаторы пользователей, добавляем операцию
            if user_data.user_identifiers:
                operation = client.get_type("OfflineUserDataJobOperation")
                operation.create.CopyFrom(user_data)
                operations.append(operation)

        return operations
    
    def normalize_and_hash(self, s, remove_all_whitespace):
        if remove_all_whitespace:
            s = "".join(s.split())
        else:
            s = s.strip().lower()

        return hashlib.sha256(s.encode()).hexdigest()
    
    def get_user_lists(self, domain_id, customer_id):
        try:
            credential = self.get_credentials(domain_id)
            client = self.get_google_ads_client(credential.access_token)
            googleads_service = client.get_service("GoogleAdsService")
            query = """
                SELECT
                    user_list.id,
                    user_list.name,
                    user_list.description
                FROM
                    user_list
            """

            response = googleads_service.search(customer_id=str(customer_id), query=query)
            user_lists = []
            for row in response:
                user_list = row.user_list
                user_lists.append({
                    'list_id': user_list.id,
                    'list_name': user_list.name
                })
            return {'status': IntegrationsStatus.SUCCESS.value, 'user_lists': user_lists}
        
        except GoogleAdsException as googleads_error:
            details = googleads_error.failure.errors[0].message
            print(f"Google Ads API error occurred: {googleads_error}")
            return {'status': IntegrationsStatus.CREDENTAILS_INVALID.value, 'message': str(details)}
    
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return {'status': IntegrationsStatus.CREDENTAILS_INVALID.value, 'message': str(e)}
        
    def get_customer_info_and_resource_name(self, domain_id):
        try:
            credential = self.get_credentials(domain_id)
            client = self.get_google_ads_client(credential.access_token)
            googleads_service = client.get_service("GoogleAdsService")
            customer_service = client.get_service("CustomerService")
            
            accessible_customers = customer_service.list_accessible_customers()
            resource_names = accessible_customers.resource_names
            
            customer_data = []

            for resource_name in resource_names:
                customer_id = resource_name.split('/')[-1]
                if customer_id != '9087286246':
                    continue
                
                query = """
                    SELECT
                        customer.id,
                        customer.descriptive_name
                    FROM
                        customer
                """
                response = googleads_service.search(customer_id=customer_id, query=query)
                
                for row in response:
                    customer_id = row.customer.id
                    customer_name = row.customer.descriptive_name
                    customer_data.append({
                        'customer_id': customer_id,
                        'customer_name': customer_name,
                    })
            
            return {'status': IntegrationsStatus.SUCCESS.value, 'customers': customer_data}
        except GoogleAdsException as googleads_error:
            details = googleads_error.failure.errors[0].message
            print(f"Google Ads API error occurred: {googleads_error}")
            return {'status': IntegrationsStatus.CREDENTAILS_INVALID.value, 'message': str(details)}
    
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return {'status': IntegrationsStatus.CREDENTAILS_INVALID.value, 'message': str(e)}

