from datetime import datetime
import logging
from models.integrations.integrations_users_sync import IntegrationUserSync
from persistence.domains import UserDomainsPersistence
from persistence.leads_persistence import LeadsPersistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from fastapi import HTTPException
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
from httpx import Client

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

    async def create_data_sync(self, domain_id, leads_type, hook_url):
        credentials = self.get_credentials(domain_id)
        leads_type = self.__mapped_leads_type(leads_type)
        data_syncs = self.sync_persistence.get_filter_by(domain_id=domain_id)
        for sync in data_syncs:
            if sync.get('integration_id') == credentials.id and sync.get('leads_type') == leads_type:
                return sync
        sync = self.sync_persistence.create_sync({
            'domain_id': domain_id,
            'leads_type': leads_type,
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
        response = self.client.post(url=sync.hook_url, json=self.__mapped_lead(five_x_five_user))
        if response.status_code != 200:
            logging.error("Error response: %s", response.text)
            if response.status_code in (403, 401):
                sync.sync_status = False
                self.integration_persistence.db.commit()
                return
            return response
        return response.json()
    
    def __mapped_leads_type(self, lead_type):
        if (lead_type == 'Visitors'):
            return 'visitor'
        if (lead_type == 'Added to cart'):
            return 'added_to_cart'
        if (lead_type == 'Viewed Product'):
            return 'viewed_product'
        if (lead_type == 'Converted Sales'):
            return 'converted_sales'
        if (lead_type == 'All contacts'):
            return 'allContact'
        return 'allContact'
    
    def __mapped_lead(self, lead):
        try: 
            work_history = ','.join(lead.work_history)
        except: 
            work_history = lead.work_history
        try:
            education_history = ','.join(lead.education_history)
        except:
            education_history = lead.education_history
        lead_dict = {
            "id": lead.id,
            "up_id": lead.up_id,
            "cc_id": lead.cc_id,
            "first_name": lead.first_name,
            "programmatic_business_emails": lead.programmatic_business_emails,
            "mobile_phone": lead.mobile_phone,
            "direct_number": lead.direct_number,
            "gender": lead.gender,
            "personal_phone": lead.personal_phone,
            "business_email": lead.business_email,
            "personal_emails": lead.personal_emails,
            "last_name": lead.last_name,
            "personal_city": lead.personal_city,
            "personal_state": lead.personal_state,
            "company_name": lead.company_name,
            "company_domain": lead.company_domain,
            "company_phone": lead.company_phone,
            "company_sic": lead.company_sic,
            "company_address": lead.company_address,
            "company_city": lead.company_city,
            "company_state": lead.company_state,
            "company_zip": lead.company_zip,
            "company_linkedin_url": lead.company_linkedin_url,
            "company_revenue": lead.company_revenue,
            "company_employee_count": lead.company_employee_count,
            "net_worth": lead.net_worth,
            "job_title": lead.job_title,
            "last_updated": lead.last_updated.isoformat() if isinstance(lead.last_updated, datetime) else lead.last_updated,
            "personal_emails_last_seen": lead.personal_emails_last_seen.isoformat() if isinstance(lead.personal_emails_last_seen, datetime) else lead.personal_emails_last_seen,
            "company_last_updated": lead.company_last_updated.isoformat() if isinstance(lead.company_last_updated, datetime) else lead.company_last_updated,
            "job_title_last_updated": lead.job_title_last_updated.isoformat() if isinstance(lead.job_title_last_updated, datetime) else lead.job_title_last_updated,
            "first_name_id": lead.first_name_id,
            "last_name_id": lead.last_name_id,
            "age_min": lead.age_min,
            "age_max": lead.age_max,
            "additional_personal_emails": lead.additional_personal_emails,
            "linkedin_url": lead.linkedin_url,
            "personal_address": lead.personal_address,
            "personal_address_2": lead.personal_address_2,
            "personal_zip": lead.personal_zip,
            "personal_zip4": lead.personal_zip4,
            "professional_zip": lead.professional_zip,
            "married": lead.married,
            "children": lead.children,
            "income_range": lead.income_range,
            "homeowner": lead.homeowner,
            "seniority_level": lead.seniority_level,
            "department": lead.department,
            "professional_address": lead.professional_address,
            "professional_address_2": lead.professional_address_2,
            "professional_city": lead.professional_city,
            "professional_state": lead.professional_state,
            "professional_zip4": lead.professional_zip4,
            "primary_industry": lead.primary_industry,
            "business_email_validation_status": lead.business_email_validation_status,
            "business_email_last_seen": lead.business_email_last_seen.isoformat() if isinstance(lead.business_email_last_seen, datetime) else lead.business_email_last_seen,
            "personal_emails_validation_status": lead.personal_emails_validation_status,
            "work_history": work_history,
            "education_history": education_history,
            "company_description": lead.company_description,
            "related_domains": lead.related_domains,
            "social_connections": lead.social_connections,
            "dpv_code": lead.dpv_code
        }
        return lead_dict
