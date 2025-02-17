from datetime import datetime
from utils import format_phone_number
from models.integrations.integrations_users_sync import IntegrationUserSync
from persistence.domains import UserDomainsPersistence
from persistence.leads_persistence import LeadsPersistence
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from datetime import datetime, timedelta
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from fastapi import HTTPException
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
from httpx import Client
from utils import extract_first_email

class ZapierIntegrationService: 

    def __init__(self, lead_persistence: LeadsPersistence, domain_persistence: UserDomainsPersistence, sync_persistence: IntegrationsUserSyncPersistence,
                 integration_persistence: IntegrationsPresistence, client: Client, million_verifier_integrations: MillionVerifierIntegrationsService):
        self.leads_persistence = lead_persistence
        self.domain_persistence = domain_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.integration_persistence = integration_persistence
        self.client = client
    
    def get_credentials(self, domain_id):
        return self.integration_persistence.get_credentials_for_service(domain_id=domain_id, service_name=SourcePlatformEnum.ZAPIER.value)

    def __create_integrations(self, domain):
        integration = {
            'domain_id': domain.id,
            'service_name': SourcePlatformEnum.ZAPIER.value
        }
        self.integration_persistence.create_integration(integration)
        return integration

    def add_integrations(self, domain):
        credentials = self.get_credentials(domain.id)
        if credentials:
            return
        new_integrations = self.__create_integrations(domain=domain)
        if not new_integrations:
            raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return new_integrations

    async def create_data_sync(self, domain_id, leads_type, hook_url, list_name, created_by):
        credentials = self.get_credentials(domain_id)
        leads_type = self.__mapped_leads_type(leads_type)
        data_syncs = self.sync_persistence.get_filter_by(domain_id=domain_id)
        for sync in data_syncs:
            if sync.get('integration_id') == credentials.id and sync.get('leads_type') == leads_type:
                return sync
        sync = self.sync_persistence.create_sync({
            'domain_id': domain_id,
            'list_name': list_name,
            'leads_type': leads_type,
            'created_by': created_by,
            'integration_id': credentials.id,
            'hook_url': hook_url
        })
         
        return sync
        
    
    def delete_data_sync(self, domain_id):
        sync = self.sync_persistence.get_data_sync_filter_by(domain_id=domain_id)
        if not sync:
            return
        self.sync_persistence.delete_sync(domain_id=domain_id, list_id=sync[0].id)
        return
    

    async def process_data_sync(self, five_x_five_user, access_token, integration_data_sync, lead_user):
        profile = self.__create_profile(five_x_five_user, integration_data_sync)
        if profile in (ProccessDataSyncResult.AUTHENTICATION_FAILED.value, ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return profile
            
        return ProccessDataSyncResult.SUCCESS.value
    

    def __create_profile(self, five_x_five_user, sync: IntegrationUserSync):
        data = self.__mapped_lead(five_x_five_user)
        if data in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return data
        response = self.client.post(url=sync.hook_url, json=data)
        if response.status_code == 400:
                return ProccessDataSyncResult.INCORRECT_FORMAT.value
        if response.status_code == 401:
                return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        
    def __mapped_leads_type(self, lead_type):
        if lead_type:
            lead_type = lead_type.lower()
        if (lead_type == 'visitors'):
            return 'visitor'
        if (lead_type == 'added to cart'):
            return 'added_to_cart'
        if (lead_type == 'viewed product'):
            return 'viewed_product'
        if (lead_type == 'converted sales'):
            return 'converted_sales'
        if (lead_type == 'all contacts'):
            return 'allContacts'
        return 'allContacts'
    
    def __mapped_lead(self, five_x_five_user):
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
        
        lead_dict = {
            "id": five_x_five_user.id,
            "first_name": five_x_five_user.first_name,
            "last_name": five_x_five_user.last_name,
            "mobile_phone": format_phone_number(five_x_five_user.mobile_phone),
            "direct_number": five_x_five_user.direct_number,
            "gender": five_x_five_user.gender.lower() if five_x_five_user.gender else None,
            "personal_zip": five_x_five_user.personal_zip or "N/A",
            "personal_phone": format_phone_number(five_x_five_user.personal_phone),
            "personal_emails": first_email,
            "personal_city": five_x_five_user.personal_city or "N/A",
            "personal_state": five_x_five_user.personal_state or "N/A",
            "company_name": five_x_five_user.company_name or "N/A",
            "company_domain": five_x_five_user.company_domain or "N/A",
            "job_title": five_x_five_user.job_title or "N/A",
            "last_updated": five_x_five_user.last_updated.isoformat() if isinstance(five_x_five_user.last_updated, datetime) else None,
            "age_min": five_x_five_user.age_min,
            "age_max": five_x_five_user.age_max,
            "personal_address": five_x_five_user.personal_address or "N/A",
            "married": five_x_five_user.married,
            "homeowner": five_x_five_user.homeowner,
            "dpv_code": five_x_five_user.dpv_code
        }
        
        return {k: v for k, v in lead_dict.items() if v is not None}

