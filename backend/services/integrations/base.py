import httpx
from sqlalchemy.orm import Session
from services.aws import AWSService
from persistence.leads_persistence import LeadsPersistence
from persistence.leads_persistence import LeadsPersistence
from persistence.leads_order_persistence import LeadOrdersPersistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.audience_persistence import AudiencePersistence
from persistence.integrations.suppression import IntegrationsSuppressionPersistence
from .woocommerce import WoocommerceIntegrationService
from .shopify import ShopifyIntegrationService
from .mailchimp import MailchimpIntegrationsService
from .klaviyo import KlaviyoIntegrationsService
from .bigcommerce import BigcommerceIntegrationsService
from .meta import MetaIntegrationsService

class IntegrationService:

    def __init__(self, db: Session, integration_persistence: IntegrationsPresistence, 
                 lead_persistence: LeadsPersistence, audience_persistence: AudiencePersistence, 
                 lead_orders_persistence: LeadOrdersPersistence, 
                 integrations_user_sync_persistence: IntegrationsUserSyncPersistence,
                 aws_service: AWSService, domain_persistence, suppression_persistence: IntegrationsSuppressionPersistence):
        self.db = db
        self.client = httpx.Client()
        self.integration_persistence = integration_persistence
        self.lead_persistence = lead_persistence
        self.audience_persistence = audience_persistence
        self.lead_orders_persistence = lead_orders_persistence
        self.integrations_user_sync_persistence = integrations_user_sync_persistence
        self.aws_service = aws_service
        self.domain_persistence = domain_persistence
        self.suppression_persistence = suppression_persistence

    def get_user_service_credentials(self, domain_id):
        return self.integration_persistence.get_integration_by_user(domain_id)

    def delete_integration(self, serivce_name: str, user):
        self.integration_persistence.delete_integration(user['id'], serivce_name)

    def get_sync_domain(self, domain_id: int, service_name: str = None):
        return self.integrations_user_sync_persistence.get_filter_by(domain_id=domain_id, service_name=service_name)
    
    def delete_sync_domain(self, domain_id: int, list_id, service_name: str = None):
        result = self.integrations_user_sync_persistence.delete_sync(domain_id=domain_id, list_id=list_id)
        if result:
            return {'status': 'SUCCESS'}
        else:
            return {'status': 'FAILED'}
        
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
        # self.bigcommerce = BigcommerceIntegrationsService(self.integration_persistence, 
        #                                                   self.lead_persistence, 
        #                                                   self.client)
        self.klaviyo = KlaviyoIntegrationsService(self.domain_persistence, 
                                                self.integration_persistence,  
                                                self.lead_persistence,
                                                self.integrations_user_sync_persistence,)
        self.meta = MetaIntegrationsService(self.domain_persistence, 
                                                self.integration_persistence,  
                                                self.lead_persistence,
                                                self.integrations_user_sync_persistence,)
        # self.mailchimp = MailchimpIntegrationsService(self.integration_persistence)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()