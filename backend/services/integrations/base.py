import httpx
from sqlalchemy.orm import Session
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
from persistence.leads_persistence import LeadsPersistence
from persistence.leads_order_persistence import LeadOrdersPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.audience_persistence import AudiencePersistence
from .woocommerce import WoocommerceIntegrationService
from .shopify import ShopifyIntegrationService
from .mailchimp import MailchimpIntegrationsService
from .klaviyo import KlaviyoIntegrationsService
from .bigcommerce import BigcommerceIntegrationsService
from services.aws import AWSService

class IntegrationService:

    def __init__(self, db: Session, integration_persistence: IntegrationsPresistence, 
                 lead_persistence: LeadsPersistence, audience_persistence: AudiencePersistence, 
                 lead_orders_persistence: LeadOrdersPersistence, 
                 integrations_user_sync_persistence: IntegrationsUserSyncPersistence,
                 aws_service: AWSService):
        self.db = db
        self.client = httpx.Client()
        self.integration_persistence = integration_persistence
        self.lead_persistence = lead_persistence
        self.audience_persistence = audience_persistence
        self.lead_orders_persistence = lead_orders_persistence
        self.integrations_user_sync_persistence = integrations_user_sync_persistence
        self.aws_service = aws_service

    def get_user_service_credentials(self, user):
        return self.integration_persistence.get_integration_by_user(user['id'])

    def delete_integration(self, serivce_name: str, user):
        self.integration_persistence.delete_integration(user['id'], serivce_name)

    def get_sync_user(self, user_id: int):
        return self.integrations_user_sync_persistence.get_filter_by(user_id=user_id)

    def get_sync_users(self):
        return self.integrations_user_sync_persistence.get_filter_by()

    def __enter__(self):
        self.shopify = ShopifyIntegrationService(self.integration_persistence, 
                                                 self.lead_persistence,
                                                 self.lead_orders_persistence,
                                                 self.integrations_user_sync_persistence,
                                                 self.client, self.aws_service)
        self.bigcommerce = BigcommerceIntegrationsService(self.integration_persistence, 
                                                          self.lead_persistence, 
                                                          self.client)
        self.klaviyo = KlaviyoIntegrationsService(self.integration_persistence, 
                                           self.client, 
                                           self.audience_persistence,
                                           self.integrations_user_sync_persistence,
                                           self.lead_persistence)
        self.mailchimp = MailchimpIntegrationsService(self.integration_persistence)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()