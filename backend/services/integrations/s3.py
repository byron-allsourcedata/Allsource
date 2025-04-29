from utils import validate_and_format_phone
from typing import List
from fastapi import HTTPException
import httpx
import os
import re
import csv
import logging
import tempfile
from datetime import datetime, timezone
from utils import format_phone_number
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult, IntegrationLimit, DataSyncType
from models.five_x_five_users import FiveXFiveUser
from models.enrichment.enrichment_users import EnrichmentUser
from uuid import UUID
import uuid
from faker import Faker
from services.integrations.commonIntegration import get_states_dataframe
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from schemas.integrations.sendlane import SendlaneContact, SendlaneSender
from schemas.integrations.integrations import DataMap, IntegrationCredentials, ListFromIntegration
from persistence.domains import UserDomainsPersistence
from utils import extract_first_email
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
import json
import boto3
from botocore.exceptions import ClientError, NoCredentialsError, PartialCredentialsError

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

    async def process_data_sync(self, user_integration, integration_data_sync, enrichment_users: EnrichmentUser):
        profiles = []
        for enrichment_user in enrichment_users:
            profile = self.__mapped_s3_contact(enrichment_user, integration_data_sync.data_map)
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
            logging.error(e)
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        
    def generate_object_key(self, prefix="data", extension="csv"):
        date_str = datetime.now(timezone.utc).strftime("%Y/%m/%d")
        unique_id = uuid.uuid4().hex[:8]
        return f"{prefix}/{date_str}/upload_{unique_id}.{extension}"

    def __send_contacts(self, access_token: str, bucket_name: str, profiles: list[dict]):
        parsed_data = json.loads(access_token)
        secret_id = parsed_data["secret_id"]
        secret_key = parsed_data["secret_key"]

        headers = profiles[0].keys() if profiles else []
        
        with tempfile.NamedTemporaryFile(mode="w", newline="", suffix=".csv", delete=False, encoding="utf-8") as temp_csv:
            writer = csv.DictWriter(temp_csv, fieldnames=headers)
            writer.writeheader()
            for row in profiles:
                writer.writerow(row)
            temp_file_path = temp_csv.name

        result = self.upload_file_to_bucket(
            secret_id=secret_id,
            secret_key=secret_key,
            file_path=temp_file_path,
            object_key=self.generate_object_key(),
            bucket_name=bucket_name
        )

        return result
    
    def __map_properties(self, enrichment_user: EnrichmentUser, data_map: List[DataMap]) -> dict:
        properties = {}
        for mapping in data_map:
            five_x_five_field = mapping.get("type")
            new_field = mapping.get("value")
            value_field = getattr(enrichment_user, five_x_five_field, None)

            if value_field is not None:
                properties[new_field] = value_field.isoformat() if isinstance(value_field, datetime) else value_field

        return properties
    
    def __mapped_s3_contact(self, enrichment_user: EnrichmentUser, data_map):
        verified_email, verified_phone = self.sync_persistence.get_verified_email_and_phone(enrichment_user.id)
        enrichment_contacts = enrichment_user.contacts
        if not enrichment_contacts:
            return None
        first_name = enrichment_contacts.first_name
        last_name = enrichment_contacts.last_name
        
        fake = Faker()
        verified_email = fake.email()
        verified_phone = fake.phone_number()
        if not verified_email or not first_name or not last_name:
            return None
        
        enrichment_personal_profiles = enrichment_user.personal_profiles
        enrichment_professional_profiles = enrichment_user.professional_profiles
        city = None
        state = None
        zip_code = None
        gender = None
        birth_day = None
        birth_month = None
        birth_year = None
        company_name = None
        address_parts = None
        
        if enrichment_professional_profiles:
            company_name = enrichment_professional_profiles.current_company_name
        
        if enrichment_personal_profiles:
            zip_code = str(enrichment_personal_profiles.zip_code5)
            df_geo = get_states_dataframe()
            if df_geo['zip'].dtype == object:
                df_geo['zip'] = df_geo['zip'].astype(int)
            row = df_geo.loc[df_geo['zip'] == zip_code]
            if not row.empty:
                city = row['city'].iat[0]
                state = row['state_name'].iat[0]
            
            if enrichment_personal_profiles.gender == 1:
                gender = 'm'
            elif enrichment_personal_profiles.gender == 2:
                gender = 'f'
            birth_day = str(enrichment_personal_profiles.birth_day)
            birth_month = str(enrichment_personal_profiles.birth_month)
            birth_year = str(enrichment_personal_profiles.birth_year) 
            
        
        
        #properties = self.__map_properties(enrichment_user, data_map) if data_map else {}
        
        return {
            'email': verified_email,
            'first_name': first_name,
            'last_name': last_name,
            'phone': verified_phone,
            'gender': gender,
            'city': city,
            'state': state,
            'zip_code': zip_code,
            # **properties
        }
