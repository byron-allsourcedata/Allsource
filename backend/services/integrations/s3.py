import httpx
import os
import logging
from typing import List
from fastapi import HTTPException
import httpx
import os
import re
import csv
import logging
import tempfile
import uuid
from services.integrations.commonIntegration import *
from models.integrations.users_domains_integrations import UserIntegration
from models.integrations.integrations_users_sync import IntegrationUserSync
from datetime import datetime, timezone
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult, IntegrationLimit, DataSyncType
from models.enrichment.enrichment_users import EnrichmentUser
from uuid import UUID
from faker import Faker
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from schemas.integrations.integrations import DataMap, IntegrationCredentials
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
import json
import boto3
from botocore.exceptions import ClientError, NoCredentialsError, PartialCredentialsError

logger = logging.getLogger(__name__)

class S3IntegrationService:

    def __init__(self, domain_persistence: UserDomainsPersistence, integrations_persistence: IntegrationsPresistence, leads_persistence: LeadsPersistence,
                 sync_persistence: IntegrationsUserSyncPersistence, client: httpx.Client, million_verifier_integrations: MillionVerifierIntegrationsService):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.sync_persistence = sync_persistence
        self.client = client

    def get_credentials(self, domain_id: int, user_id: int):
        return self.integrations_persisntece.get_credentials_for_service(domain_id=domain_id, user_id=user_id, service_name=SourcePlatformEnum.S3.value)
    
    
    def __handle_request(self, url: str, headers: dict = None, json: dict = None, data: dict = None, params: dict = None, api_key: str = None,  method: str = 'GET'):
        if not headers:
            headers = {
                'Authorization': f'Bearer {api_key}',
                'accept': 'application/json', 
                'content-type': 'application/json'
            }
        url = f'https://api.sendlane.com/v2' + url
        response = self.client.request(method, url, headers=headers, json=json, data=data, params=params)

        if response.is_redirect:
            redirect_url = response.headers.get('Location')
            if redirect_url:
                response = self.client.request(method, redirect_url, headers=headers, json=json, data=data, params=params)
        return response


    def __save_integrations(self, *, secret_id: str, secret_key, domain_id: int, user: dict):
        credential = self.get_credentials(domain_id, user.get('id'))
        if credential:
            credential.access_token = json.dumps({"secret_id": secret_id, "secret_key": secret_key})
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persisntece.db.commit()
            return credential
        
        common_integration = os.getenv('COMMON_INTEGRATION') == 'True'
        integration_data = {
            'access_token': json.dumps({"secret_id": secret_id, "secret_key": secret_key}),
            'full_name': user.get('full_name'),
            'service_name': SourcePlatformEnum.S3.value,
            'limit': IntegrationLimit.S3.value
        }

        if common_integration:
            integration_data['user_id'] = user.get('id')
        else:
            integration_data['domain_id'] = domain_id
            
        integartion = self.integrations_persisntece.create_integration(integration_data)
        
        if not integartion:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        
        return IntegrationsStatus.SUCCESS
    
    def edit_sync(self, leads_type: str, list_name: str, data_map: List[DataMap], integrations_users_sync_id: int, domain_id: int, created_by: str, user_id: int):
        credentials = self.get_credentials(domain_id, user_id)
        sync = self.sync_persistence.edit_sync({
            'integration_id': credentials.id,
            'list_name': list_name,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        }, integrations_users_sync_id)

        return sync

    def __get_list(self, secret_id: str, secret_key: str):
        client_params = {
            'aws_access_key_id': secret_id,
            'aws_secret_access_key': secret_key
        }
        s3_client = boto3.client('s3', **client_params)
        response = s3_client.list_buckets()
        return response

    def get_list(self, domain_id: int, user_id: int):
        credential = self.get_credentials(domain_id, user_id)
        if not credential:
            return
        
        parsed_data = json.loads(credential.access_token)
        secret_id = parsed_data["secret_id"]
        secret_key = parsed_data["secret_key"]
        try:
            lists = self.__get_list(secret_id=secret_id, secret_key=secret_key)
        except NoCredentialsError:
            credential.is_failed = True
            credential.error_message = 'Invalid API Key'
            self.integrations_persisntece.db.commit()
            raise HTTPException(status_code=400, detail={'status': 'CREDENTIALS_MISSING', 'message': 'Missing AWS credentials'})
        except PartialCredentialsError:
            credential.is_failed = True
            credential.error_message = 'Invalid API Key'
            self.integrations_persisntece.db.commit()
            raise HTTPException(status_code=400, detail={'status': 'CREDENTIALS_INCOMPLETE', 'message': 'Incomplete AWS credentials'})
        except ClientError as e:
            error_code = e.response['Error']['Code']
            credential.is_failed = True
            credential.error_message = 'Invalid API Key'
            self.integrations_persisntece.db.commit()
            raise HTTPException(status_code=400, detail={'status': 'CREDENTIALS_INVALID', 'message': f'AWS error: {error_code}'})
        
        return [bucket["Name"] for bucket in lists.get("Buckets", [])]

    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        try:
            self.__get_list(secret_id=credentials.s3.secret_id, secret_key=credentials.s3.secret_key)
        except NoCredentialsError:
            raise HTTPException(status_code=400, detail={'status': 'CREDENTIALS_MISSING', 'message': 'Missing AWS credentials'})
        except PartialCredentialsError:
            raise HTTPException(status_code=400, detail={'status': 'CREDENTIALS_INCOMPLETE', 'message': 'Incomplete AWS credentials'})
        except ClientError as e:
            error_code = e.response['Error']['Code']
            raise HTTPException(status_code=400, detail={'status': 'CREDENTIALS_INVALID', 'message': f'AWS error: {error_code}'})
        
        return self.__save_integrations(secret_id=credentials.s3.secret_id, secret_key=credentials.s3.secret_key,domain_id=domain.id, user=user)
 
    async def create_sync(self, leads_type: str, list_name: str, data_map: List[DataMap], domain_id: int, created_by: str, user: dict):
        credentials = self.get_credentials(domain_id=domain_id, user_id=user.get('id'))
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'list_name': list_name,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        })
        return sync
    
    def get_smart_credentials(self, user_id: int):
        credential = self.integrations_persisntece.get_smart_credentials_for_service(user_id=user_id, service_name=SourcePlatformEnum.S3.value)
        return credential
    
    def create_smart_audience_sync(self, smart_audience_id: UUID, sent_contacts: int, created_by: str, user: dict, list_name: str = None, data_map: List[DataMap] = []):
        credentials = self.get_smart_credentials(user_id=user.get('id'))
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'sent_contacts': sent_contacts,
            'sync_type': DataSyncType.AUDIENCE.value,
            'smart_audience_id': smart_audience_id,
            'list_name': list_name,
            'data_map': data_map,
            'created_by': created_by,
        })
        return sync

    async def process_data_sync(self, user_integration: UserIntegration, integration_data_sync: IntegrationUserSync, enrichment_users: EnrichmentUser, target_schema: str, validations: dict):
        profiles = []
        for enrichment_user in enrichment_users:
            profile = self.__mapped_s3_contact(enrichment_user, target_schema, validations, integration_data_sync.data_map)
            profiles.append(profile)
        
        list_response = self.__send_contacts(access_token=user_integration.access_token, bucket_name=integration_data_sync.list_name, profiles=profiles)
        
        if list_response == ProccessDataSyncResult.AUTHENTICATION_FAILED.value:
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
            
        return ProccessDataSyncResult.SUCCESS.value
    
    def upload_file_to_bucket(self, secret_id: str, secret_key: str, file_path: str, object_key: str, bucket_name: str):
        client_params = {
            'aws_access_key_id': secret_id,
            'aws_secret_access_key': secret_key
        }
        s3_client = boto3.client('s3', **client_params)
                    
        try:
            s3_client.upload_file(file_path, bucket_name, object_key)
            return ProccessDataSyncResult.SUCCESS.value
        except Exception as e:
            logger.error("Error when uploading a file:", e)
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        
    def generate_object_key(self, prefix="data", extension="csv"):
        date_str = datetime.now(timezone.utc).strftime("%Y/%m/%d")
        unique_id = uuid.uuid4().hex[:8]
        return f"{prefix}/{date_str}/upload_{unique_id}.{extension}"

    def __send_contacts(self, access_token: str, bucket_name: str, profiles: list[dict]):
        parsed_data = json.loads(access_token)
        secret_id = parsed_data["secret_id"]
        secret_key = parsed_data["secret_key"]

        headers = sorted({key for profile in profiles for key in profile}) if profiles else []
        
        with tempfile.NamedTemporaryFile(mode="w", newline="", suffix=".csv", delete=False, encoding="utf-8") as temp_csv:
            writer = csv.DictWriter(temp_csv, fieldnames=headers)
            writer.writeheader()
            for row in profiles:
                writer.writerow({key: row.get(key, "") for key in headers})
            temp_file_path = temp_csv.name

        result = self.upload_file_to_bucket(
            secret_id=secret_id,
            secret_key=secret_key,
            file_path=temp_file_path,
            object_key=self.generate_object_key(),
            bucket_name=bucket_name
        )

        return result
    
    def __mapped_s3_contact(self, enrichment_user: EnrichmentUser, target_schema: str, validations: dict, data_map: list):
        enrichment_contacts = enrichment_user.contacts
        if not enrichment_contacts:
            return None
        
        business_email, personal_email, phone = self.sync_persistence.get_verified_email_and_phone(enrichment_user.id)
        main_email, main_phone = resolve_main_email_and_phone(enrichment_contacts=enrichment_contacts, validations=validations, target_schema=target_schema, 
                                                              business_email=business_email, personal_email=personal_email, phone=phone)
        first_name = enrichment_contacts.first_name
        last_name = enrichment_contacts.last_name
        
        if not main_email or not first_name or not last_name:
            return None

        result = {
            'email': main_email,
            'firstname': first_name,
            'lastname': last_name
        }
        
        required_types = {m['type'] for m in data_map}
        context = {
            'main_phone': main_phone,
            'professional_profiles': enrichment_user.professional_profiles,
            'postal': enrichment_user.postal,
            'personal_profiles': enrichment_user.personal_profiles,
            'business_email': business_email,
            'personal_email': personal_email,
            'country_code': enrichment_user.postal,
            'gender': enrichment_user.personal_profiles,
            'zip_code': enrichment_user.personal_profiles,
            'state': enrichment_user.postal,
            'city': enrichment_user.postal,
            'company': enrichment_user.professional_profiles,
            'business_email_last_seen_date': enrichment_contacts,
            'personal_email_last_seen': enrichment_contacts,
            'linkedin_url': enrichment_contacts
        }

        for field_type in required_types:
            filler = FIELD_FILLERS.get(field_type)
            if filler:
                filler(result, context)
                
        return result
    
