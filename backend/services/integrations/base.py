from sqlalchemy.orm import Session
from models.users import User
from persistence.leads_persistence import LeadsPersistence
import httpx
from .shopify import ShopifyIntegrationService
from .woocommerce import WoocommerceIntegrationService
from .bigcommerce import BigcommerceIntegrationsService
from .klaviyo import KlaviyoIntegrationsService
from .mailchimp import MailchimpIntegrationsService
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.audience_persistence import AudiencePersistence
from persistence.leads_persistence import LeadsPersistence


class IntegrationService:

    def __init__(self, db: Session, integration_persistence: IntegrationsPresistence, 
                 lead_persistence: LeadsPersistence, audience_persistence: AudiencePersistence):
        self.integration_persistence = integration_persistence
        self.db = db
        self.client = httpx.Client()
        self.lead_persistence = lead_persistence
        self.audience_persistence = audience_persistence

    def get_user_service_credentials(self, user):
        return self.integration_persistence.get_integration_by_user(user['id'])

    def delete_integration(self, serivce_name: str, user):
        self.integration_persistence.delete_integration(user['id'], serivce_name)

    def __enter__(self):
        self.shopify = ShopifyIntegrationService(self.integration_persistence, self.client)
        # self.woocommerce = WoocommerceIntegrationService(self.integration_persistence, self.user)
        self.bigcommerce = BigcommerceIntegrationsService(self.integration_persistence, self.lead_persistence, self.client)
        self.klaviyo = KlaviyoIntegrationsService(self.integration_persistence, 
                                           self.client, 
                                           self.audience_persistence,
                                           self.lead_persistence)
        self.mailchimp = MailchimpIntegrationsService(self.integration_persistence)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()