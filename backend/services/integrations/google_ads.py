import logging
import os
import hashlib

from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from persistence.domains import UserDomainsPersistence
from schemas.integrations.integrations import *
from google.auth.transport.requests import Request
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from models.leads_users import LeadUser
from schemas.integrations.google_ads import GoogleAdsProfile
from fastapi import HTTPException
from datetime import datetime, timedelta
from utils import extract_first_email
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
import httpx
from utils import format_phone_number
from typing import List
from utils import validate_and_format_phone, format_phone_number

logger = logging.getLogger(__name__)

class GoogleAdsIntegrationsService:

    def __init__(self, domain_persistence: UserDomainsPersistence, integrations_persistence: IntegrationsPresistence,
                 sync_persistence: IntegrationsUserSyncPersistence, client: httpx.Client, million_verifier_integrations: MillionVerifierIntegrationsService):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
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
            "redirect_uri": f"{os.getenv('SITE_HOST_URL')}/google-ads-landing",
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

    async def process_data_sync(self, five_x_five_user, user_integration, data_sync, lead_user: LeadUser):
        profile = self.__mapped_googleads_profile(five_x_five_user, lead_user)
        if profile in (ProccessDataSyncResult.AUTHENTICATION_FAILED.value, ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return profile
        
        list_response = self.__add_profile_to_list(access_token=user_integration.access_token, customer_id=data_sync.customer_id, user_list_id=data_sync.list_id, profile=profile)
        
        if not list_response:
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
            
        return ProccessDataSyncResult.SUCCESS.value
    
    def get_last_offline_user_data_job(self, client, customer_id):
        google_ads_service = client.get_service("GoogleAdsService")
        
        query = """
            SELECT 
                offline_user_data_job.resource_name, 
                offline_user_data_job.id, 
                offline_user_data_job.status
            FROM 
                offline_user_data_job
            WHERE 
                customer.id = '{customer_id}'
            ORDER BY 
                offline_user_data_job.id DESC
            LIMIT 1
        """
        
        query = query.format(customer_id=customer_id)
        
        try:
            response = google_ads_service.search(customer_id=customer_id, query=query)
            for row in response:
                job = row.offline_user_data_job
                return job.id

            return None
        
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            return None
        
    def __add_profile_to_list(self, access_token, customer_id, user_list_id, profile):
        client = self.get_google_ads_client(access_token)
        ad_user_data_consent = client.enums.ConsentStatusEnum.GRANTED
        ad_personalization_consent = client.enums.ConsentStatusEnum.GRANTED
        user_list_resource_name = None
        offline_user_data_job_id = None
        try:
            googleads_service = client.get_service("GoogleAdsService")
            if not offline_user_data_job_id:
                user_list_resource_name = googleads_service.user_list_path(
                    customer_id, user_list_id
                )
            self.add_users_to_customer_match_user_list(
                profile=profile,
                client=client,
                customer_id=customer_id,
                user_list_resource_name=user_list_resource_name,
                offline_user_data_job_id=offline_user_data_job_id,
                ad_user_data_consent=ad_user_data_consent,
                ad_personalization_consent=ad_personalization_consent,
            )
            return True
        except GoogleAdsException as ex:
            logger.error(
                f"Request with ID '{ex.request_id}' failed with status "
                f"'{ex.error.code().name}' and includes the following errors:"
            )
            return False
    
                
    def set_suppression(self, suppression: bool, domain_id: int):
            credential = self.get_credentials(domain_id)
            if not credential:
                raise HTTPException(status_code=403, detail=IntegrationsStatus.CREDENTIALS_NOT_FOUND.value)
            credential.suppression = suppression
            self.integrations_persisntece.db.commit()
            return {'message': 'successfuly'}  
    
    def __mapped_googleads_profile(self, five_x_five_user: FiveXFiveUser, lead_user: LeadUser) -> GoogleAdsProfile:
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

        address_parts = [
            getattr(five_x_five_user, "personal_address") or getattr(five_x_five_user, "company_address", None),
            getattr(five_x_five_user, "personal_city") or getattr(five_x_five_user, "company_city", None),
            getattr(five_x_five_user, "personal_state") or getattr(five_x_five_user, "company_state", None),
            getattr(five_x_five_user, "personal_zip") or getattr(five_x_five_user, "company_zip", None),
        ]
        
        return GoogleAdsProfile(
            email=first_email,
            first_name=getattr(five_x_five_user, 'first_name', None),
            last_name=getattr(five_x_five_user, 'last_name', None),
            phone=validate_and_format_phone(format_phone_number(first_phone)),
            city=address_parts[1],
            state=address_parts[2],
            address=address_parts[0]
            )
        
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
            list_id = channel.split('/')[-1]
            return {'status': IntegrationsStatus.SUCCESS.value, 'channel': {'list_id': list_id, 'list_name': list.name}}
        except GoogleAdsException as ex:
            logger.error(
                f"Request with ID '{ex.request_id}' failed with status "
                f"'{ex.error.code().name}' and includes the following errors:"
            )
            return {'status': IntegrationsStatus.CREDENTAILS_INVALID.value, 'message': str(ex.error.code().name)}
    
    def create_customer_match_user_list(self, client, customer_id, list_name):
        user_list_service_client = client.get_service("UserListService")
        user_list_operation = client.get_type("UserListOperation")
        user_list = user_list_operation.create
        user_list.name = list_name
        user_list.description = (
            "List of customers by Maximiz app"
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
            
    def add_users_to_customer_match_user_list(self, profile, client, customer_id, user_list_resource_name, 
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
                offline_user_data_job.customer_match_user_list_metadata.consent.ad_user_data = ad_user_data_consent
                
            if ad_personalization_consent:
                offline_user_data_job.customer_match_user_list_metadata.consent.ad_personalization = ad_personalization_consent
                
            create_offline_user_data_job_response = (
                offline_user_data_job_service_client.create_offline_user_data_job(
                    customer_id=customer_id, job=offline_user_data_job
                )
            )
            
            offline_user_data_job_resource_name = (
                create_offline_user_data_job_response.resource_name
            )
                        
        request = client.get_type("AddOfflineUserDataJobOperationsRequest")
        request.resource_name = offline_user_data_job_resource_name
        request.operations.extend(self.build_offline_user_data_job_operations(client, profile))
        request.enable_partial_failure = True

        offline_user_data_job_service_client.add_offline_user_data_job_operations(request=request)
        logger.debug("Successfully added offline user data job operations")
        
        offline_user_data_job_service_client.run_offline_user_data_job(
            resource_name=offline_user_data_job_resource_name
        )
    
    def build_offline_user_data_job_operations(self, client, profile: GoogleAdsProfile):
        raw_record = {
            "email": profile.email,
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "country_code": "US",
            "phone": profile.phone,
            "city": profile.city,
            "state": profile.state,
            "address": profile.address
        }
        raw_records = [raw_record]

        operations = []
        for record in raw_records:
            user_data = client.get_type("UserData")

            if "email" in record:
                user_identifier = client.get_type("UserIdentifier")
                user_identifier.hashed_email = self.normalize_and_hash(record["email"], True)
                user_data.user_identifiers.append(user_identifier)

            if "phone" in record:
                hashed_phone_number = self.normalize_and_hash(record["phone"], True)
                if hashed_phone_number:
                    user_identifier = client.get_type("UserIdentifier")
                    user_identifier.hashed_phone_number = hashed_phone_number
                    user_data.user_identifiers.append(user_identifier)
            if "first_name" in record:
                user_identifier = client.get_type("UserIdentifier")
                address_info = user_identifier.address_info
                address_info.hashed_first_name = self.normalize_and_hash(record["first_name"], False)
                address_info.hashed_last_name = self.normalize_and_hash(record["last_name"], False)
                if record["country_code"]:
                    address_info.country_code = record["country_code"]
                if record["city"]:
                    address_info.city = record["city"]
                if record["state"]:
                    address_info.state = record["state"]
                hashed_street_address = self.normalize_and_hash(record["address"], False)
                if hashed_street_address:
                    address_info.hashed_street_address = hashed_street_address
                user_data.user_identifiers.append(user_identifier)

            if user_data.user_identifiers:
                operation = client.get_type("OfflineUserDataJobOperation")
                operation.create.CopyFrom(user_data)
                operations.append(operation)

        return operations
    
    def normalize_and_hash(self, s, remove_all_whitespace):
        if not s:
            return s
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
            logger.error(f"Google Ads API error occurred: {googleads_error}")
            return {'status': IntegrationsStatus.CREDENTAILS_INVALID.value, 'message': str(details)}
    
        except Exception as e:
            logger.error(f"An unexpected error occurred: {e}")
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
            logger.error(f"Google Ads API error occurred: {googleads_error}")
            return {'status': IntegrationsStatus.CREDENTAILS_INVALID.value, 'message': str(details)}
    
        except Exception as e:
            logger.error(f"An unexpected error occurred: {e}")
            return {'status': IntegrationsStatus.CREDENTAILS_INVALID.value, 'message': str(e)}

