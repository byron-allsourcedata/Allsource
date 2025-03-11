import httpx
from sqlalchemy.orm import Session
from services.aws import AWSService
from persistence.leads_persistence import LeadsPersistence
from persistence.leads_persistence import LeadsPersistence
from persistence.leads_order_persistence import LeadOrdersPersistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.integrations.suppression import IntegrationsSuppressionPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.audience_persistence import AudiencePersistence
from persistence.integrations.external_apps_installations  import ExternalAppsInstallationsPersistence
from .attentive import AttentiveIntegrationsService
from .hubspot import HubspotIntegrationsService
from .shopify import ShopifyIntegrationService
from enums import ProccessDataSyncResult
from datetime import datetime, timedelta
from utils import extract_first_email, format_phone_number
from .sendlane import SendlaneIntegrationService
from persistence.user_persistence import UserPersistence
from .slack import SlackService
from .million_verifier import MillionVerifierIntegrationsService
from .onimesend import OmnisendIntegrationService
from .meta import MetaIntegrationsService
from .mailchimp import MailchimpIntegrationsService
from .klaviyo import KlaviyoIntegrationsService
from .sales_force import SalesForceIntegrationsService
from .google_ads import GoogleAdsIntegrationsService
from .bigcommerce import BigcommerceIntegrationsService
from .webhook import WebhookIntegrationService
from .zapier import ZapierIntegrationService

class IntegrationService:

    def __init__(self, db: Session, integration_persistence: IntegrationsPresistence, 
                 lead_persistence: LeadsPersistence, audience_persistence: AudiencePersistence, 
                 lead_orders_persistence: LeadOrdersPersistence, user_persistence: UserPersistence,
                 integrations_user_sync_persistence: IntegrationsUserSyncPersistence, million_verifier_integrations: MillionVerifierIntegrationsService,
                 aws_service: AWSService, domain_persistence, suppression_persistence: IntegrationsSuppressionPersistence, epi_persistence: ExternalAppsInstallationsPersistence):
        self.db = db
        self.client = httpx.Client()
        self.integration_persistence = integration_persistence
        self.user_persistence = user_persistence
        self.lead_persistence = lead_persistence
        self.audience_persistence = audience_persistence
        self.lead_orders_persistence = lead_orders_persistence
        self.integrations_user_sync_persistence = integrations_user_sync_persistence
        self.aws_service = aws_service
        self.million_verifier_integrations = million_verifier_integrations
        self.domain_persistence = domain_persistence
        self.suppression_persistence = suppression_persistence
        self.eai_persistence = epi_persistence
        self.UNLIMITED = -1

    def get_user_service_credentials(self, domain_id, filters):
        return self.integration_persistence.get_integration_by_user(domain_id, filters)

    def delete_integration(self, service_name: str, domain):
        self.integration_persistence.delete_integration(domain.id, service_name)

    def get_sync_domain(self, domain_id: int, service_name: str = None, integrations_users_sync_id: int = None):
        return self.integrations_user_sync_persistence.get_filter_by(domain_id=domain_id, service_name=service_name, integrations_users_sync_id=integrations_users_sync_id)
    
    def get_sync_by_hook_url(self, hook_url):
        return self.integrations_user_sync_persistence.get_data_sync_filter_by(hook_url=hook_url)
    
    def is_integration_limit_reached(self, user_id: int, domain_id: int):
        integration_limit, domain_integrations_count = self.integrations_user_sync_persistence.get_limits_integrations(user_id, domain_id)
        if integration_limit != self.UNLIMITED and domain_integrations_count >= integration_limit:
            return True
        return False
    
    def get_leads_for_zapier(self, domain):
        five_x_five_users = self.lead_persistence.get_last_leads_for_zapier(domain.id)
        valid_users = []
        for five_x_five_user in five_x_five_users:
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
                    next

                location = {
                    "address": getattr(five_x_five_user, 'personal_address') or getattr(five_x_five_user, 'company_address', None),
                    "city": getattr(five_x_five_user, 'personal_city') or getattr(five_x_five_user, 'company_city', None),
                    "region": getattr(five_x_five_user, 'personal_state') or getattr(five_x_five_user, 'company_state', None),
                    "zip": getattr(five_x_five_user, 'personal_zip') or getattr(five_x_five_user, 'company_zip', None),
                }
                valid_users.append({
                    "id": five_x_five_user.id,
                    "first_name": five_x_five_user.first_name,
                    "mobile_phone": format_phone_number(five_x_five_user.mobile_phone),
                    "direct_number": format_phone_number(five_x_five_user.mobile_phone),
                    "gender": five_x_five_user.gender,
                    "personal_phone": format_phone_number(five_x_five_user.personal_phone),
                    "personal_emails": first_email,
                    "last_name": five_x_five_user.last_name,
                    "personal_city": location.get('city'),
                    "personal_state": location.get('region'),
                    "company_name": five_x_five_user.company_name,
                    "company_domain": five_x_five_user.company_domain,
                    "job_title": five_x_five_user.job_title,
                    "last_updated": five_x_five_user.last_updated,
                    "age_min": five_x_five_user.age_min,
                    "age_max": five_x_five_user.age_max,
                    "personal_address": location.get('address'),
                    "personal_zip": location.get('zip'),
                    "married": five_x_five_user.married,
                    "children": five_x_five_user.children,
                    "income_range": five_x_five_user.income_range,
                    "homeowner": five_x_five_user.homeowner,
                    "dpv_code": five_x_five_user.dpv_code,
                    "time_on_site": five_x_five_user.time_on_site,
                    "url_visited": five_x_five_user.url_visited
                })
                if len(valid_users) >= 3:
                    return valid_users
    
    def get_user_by_shop_domain(self, shop_domain):
        return self.integrations_user_sync_persistence.get_user_by_shop_domain(shop_domain)
    
    def delete_sync_domain(self, domain_id: int, list_id, service_name: str = None):
        result = self.integrations_user_sync_persistence.delete_sync(domain_id=domain_id, list_id=list_id)
        if result:
            return {'status': 'SUCCESS'}
        else:
            return {'status': 'FAILED'}

    def get_external(self, platform):
        eais =  self.eai_persistence.get_epi_by_filter_all(platform=platform)
        return [{'store_hash': eai.store_hash} for eai in eais]
        
    def switch_sync_toggle(self, domain_id, list_id):
        result = self.integrations_user_sync_persistence.switch_sync_toggle(domain_id=domain_id, list_id=list_id)
        if result is not None:
            return {'status': 'SUCCESS', 'data_sync': result}
        return {'status': 'FAILED'}

    def get_sync_users(self):
        return self.integrations_user_sync_persistence.get_filter_by()
    
    def __enter__(self):
        self.shopify = ShopifyIntegrationService(self.integration_persistence, 
                                                 self.lead_persistence,
                                                 self.lead_orders_persistence,
                                                 self.integrations_user_sync_persistence,
                                                 self.client, self.aws_service, self.db)
        self.bigcommerce = BigcommerceIntegrationsService(integrations_persistence=self.integration_persistence, 
                                                          leads_persistence=self.lead_persistence, 
                                                          leads_order_persistence=self.lead_orders_persistence,
                                                          aws_service=self.aws_service, client=self.client,
                                                          epi_persistence=self.eai_persistence, domain_persistence=self.domain_persistence
                                                          )
        self.klaviyo = KlaviyoIntegrationsService(self.domain_persistence, 
                                                self.integration_persistence,  
                                                self.lead_persistence,
                                                self.integrations_user_sync_persistence, self.client, self.million_verifier_integrations)
        self.sales_force = SalesForceIntegrationsService(self.domain_persistence, 
                                                self.integration_persistence,  
                                                self.lead_persistence,
                                                self.integrations_user_sync_persistence, self.client, self.million_verifier_integrations)
        self.google_ads = GoogleAdsIntegrationsService(self.domain_persistence, 
                                                self.integration_persistence,
                                                self.integrations_user_sync_persistence, self.client, self.million_verifier_integrations)
        self.meta = MetaIntegrationsService(self.domain_persistence, 
                                                self.integration_persistence,  
                                                self.lead_persistence,
                                                self.integrations_user_sync_persistence, self.client, self.million_verifier_integrations)
        self.omnisend = OmnisendIntegrationService(leads_persistence=self.lead_persistence,
                                                   sync_persistence=self.integrations_user_sync_persistence,
                                                   integration_persistence=self.integration_persistence,
                                                   domain_persistence=self.domain_persistence, 
                                                   client=self.client, million_verifier_integrations=self.million_verifier_integrations
                                                   )
        self.mailchimp = MailchimpIntegrationsService(domain_persistence=self.domain_persistence, 
                                                integrations_persistence=self.integration_persistence,  
                                                leads_persistence=self.lead_persistence,
                                                sync_persistence=self.integrations_user_sync_persistence, million_verifier_integrations=self.million_verifier_integrations
                                                )
        self.sendlane = SendlaneIntegrationService(self.domain_persistence, 
                                                self.integration_persistence,  
                                                self.lead_persistence,
                                                self.integrations_user_sync_persistence,
                                                self.client, self.million_verifier_integrations)
        self.attentive = AttentiveIntegrationsService(self.domain_persistence,
                                                      self.integrations_user_sync_persistence,
                                                      self.client)
        self.slack = SlackService(user_persistence=self.user_persistence,
                                user_integrations_persistence=self.integration_persistence,
                                sync_persistence=self.integrations_user_sync_persistence,
                                lead_persistence=self.lead_persistence, million_verifier_integrations=self.million_verifier_integrations
                                )
        self.zapier = ZapierIntegrationService(self.lead_persistence, self.domain_persistence, self.integrations_user_sync_persistence, self.integration_persistence, self.client,
                                               self.million_verifier_integrations)
        self.webhook = WebhookIntegrationService(self.lead_persistence, self.domain_persistence, self.integrations_user_sync_persistence, self.integration_persistence, self.client,
                                               self.million_verifier_integrations)

        self.hubspot = HubspotIntegrationsService(self.domain_persistence,
                                                self.integration_persistence,
                                                self.lead_persistence,
                                                self.integrations_user_sync_persistence, self.client, self.million_verifier_integrations)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()
