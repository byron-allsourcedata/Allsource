from datetime import datetime
from utils import format_phone_number
from models.integrations.integrations_users_sync import IntegrationUserSync
from persistence.domains import UserDomainsPersistence
from persistence.leads_persistence import LeadsPersistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from fastapi import HTTPException
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
from httpx import Client
from utils import extract_first_email

class ZapierIntegrationService: 

    def __init__(self, lead_persistence: LeadsPersistence, domain_persistence: UserDomainsPersistence, sync_persistence: IntegrationsUserSyncPersistence,
                 integration_persistence: IntegrationsPresistence, client: Client):
        self.leads_persistence = lead_persistence
        self.domain_persistence = domain_persistence
        self.sync_persistence = sync_persistence
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
    

    async def process_data_sync(self, five_x_five_user, access_token, integration_data_sync):
        profile = self.__create_profile(five_x_five_user, integration_data_sync)
        if profile == ProccessDataSyncResult.AUTHENTICATION_FAILED.value or profile == ProccessDataSyncResult.INCORRECT_FORMAT.value:
            return profile
            
        return ProccessDataSyncResult.SUCCESS.value
    

    def __create_profile(self, five_x_five_user, sync: IntegrationUserSync):
        data = self.__mapped_lead(five_x_five_user)
        if  data == ProccessDataSyncResult.INCORRECT_FORMAT.value:
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
    
    def __mapped_lead(self, lead):
        first_email = (
            getattr(lead, 'business_email') or 
            getattr(lead, 'personal_emails') or
            getattr(lead, 'additional_personal_emails') or
            getattr(lead, 'programmatic_business_emails', None)
        )
        first_email = extract_first_email(first_email) if first_email else None
        if not first_email:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value
        
        lead_dict = {
            "id": lead.id,
            "first_name": lead.first_name,
            "last_name": lead.last_name,
            "mobile_phone": format_phone_number(lead.mobile_phone),
            "direct_number": lead.direct_number,
            "gender": lead.gender.lower() if lead.gender else None,
            "personal_phone": format_phone_number(lead.personal_phone),
            "business_email": lead.business_email,
            "personal_emails": first_email,
            "personal_city": lead.personal_city or "N/A",
            "personal_state": lead.personal_state or "N/A",
            "company_name": lead.company_name or "N/A",
            "company_domain": lead.company_domain or "N/A",
            "job_title": lead.job_title or "N/A",
            "last_updated": lead.last_updated.isoformat() if isinstance(lead.last_updated, datetime) else None,
            "age_min": lead.age_min,
            "age_max": lead.age_max,
            "personal_address": lead.personal_address or "N/A",
            "personal_address_2": lead.personal_address_2 or "N/A",
            "personal_zip": lead.personal_zip or "N/A",
            "personal_zip4": lead.personal_zip4 or "N/A",
            "professional_zip": lead.professional_zip or "N/A",
            "married": lead.married,
            "children": lead.children,
            "income_range": lead.income_range,
            "homeowner": lead.homeowner,
            "dpv_code": lead.dpv_code
        }
        
        return {k: v for k, v in lead_dict.items() if v is not None}

