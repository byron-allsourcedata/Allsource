from utils import validate_and_format_phone
from typing import List
from fastapi import HTTPException
import httpx
import os
from datetime import datetime, timedelta
from utils import format_phone_number
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
from models.five_x_five_users import FiveXFiveUser
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
        credential = self.get_credentials(domain_id)
        if credential:
            credential.access_token = json.dumps({"secret_id": secret_id, "secret_key": secret_key})
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persisntece.db.commit()
            return credential
        
        common_integration = bool(os.getenv('COMMON_INTEGRATION'))
        integration_data = {
            'access_token': json.dumps({"secret_id": secret_id, "secret_key": secret_key}),
            'full_name': user.get('full_name'),
            'service_name': SourcePlatformEnum.S3.value
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

    async def process_data_sync(self, five_x_five_user, user_integration, integration_data_sync, lead_user):
        profile = self.__create_contact(five_x_five_user, user_integration.access_token, integration_data_sync.list_name)
        if profile in (ProccessDataSyncResult.AUTHENTICATION_FAILED.value, ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return profile
            
        return ProccessDataSyncResult.SUCCESS.value
    
    def upload_file_to_bucket(self, secret_id: str, secret_key: str, file_path: str, object_key: str, bucket_name: str):
        client_params = {
            'aws_access_key_id': secret_id,
            'aws_secret_access_key': secret_key
        }
        s3_client = boto3.client('s3', **client_params)
                    
        try:
            s3_client.upload_file(file_path, bucket_name, object_key)
            print(f"Файл {file_path} успешно загружен в бакет {bucket_name} под именем {object_key}.")
        except ClientError as e:
            print("Ошибка при загрузке файла:", e)
            raise HTTPException(status_code=400, detail="Ошибка загрузки файла в S3")
        
    

    def __create_contact(self, five_x_five_user, access_token, bucket_name: str):
        profile = self.__mapped_sendlane_contact(five_x_five_user)
        if profile in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return profile
        
        json = {
            'contacts': [{
                **profile.model_dump()
            }]
        }
        parsed_data = json.loads(access_token)
        secret_id = parsed_data["secret_id"]
        secret_key = parsed_data["secret_key"]
        
        # with tempfile.NamedTemporaryFile(mode="w", newline="", suffix=".csv", delete=False, encoding="utf-8") as temp_csv:
        #     writer = csv.DictWriter(temp_csv, fieldnames=headers)
        #     writer.writeheader()
        #     for row in data:
        #         writer.writerow(row)
        #     temp_file_path = temp_csv.name
            
        # self.upload_file_to_bucket(secret_id=secret_id, secret_key=secret_key, file_path, object_key='data/2025/report.csv', bucket_name=bucket_name)
            
        # if response.status_code == 401:
        #     return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        # if response.status_code == 202:
        #     return response
    
    def __mapped_sendlane_contact(self, five_x_five_user: FiveXFiveUser):
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

        if first_email:
            first_email = first_email.split(',')[-1].strip()
        first_phone = format_phone_number(first_phone)
        phone_number = validate_and_format_phone(first_phone)
        return SendlaneContact(
            email=first_email,
            first_name=five_x_five_user.first_name or None,
            last_name=five_x_five_user.last_name or None,
            phone=phone_number.split(', ')[-1] if phone_number else None
        )
