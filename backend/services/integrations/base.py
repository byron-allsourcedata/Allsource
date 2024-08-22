from sqlalchemy.orm import Session
from models.users import User
from persistence.leads_persistence import LeadsPersistence
import httpx
from .shopify import ShopifyIntegrationService
from .woocommerce import WoocommerceIntegrationService
from .bigcommerce import BigcommerceIntegrationService
from .klaviyo import KlaviyoIntegrations
from .mailchimp import MailchimpIntegrations
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from schemas.integrations.integrations import Lead
from typing import List
from persistence.integrations.klaviyo_persistence import KlaviyoPersistence
class IntegrationService:

    def __init__(self, db: Session, integration_persistence: IntegrationsPresistence, 
                 lead_persistence: LeadsPersistence, user: User):
        self.integration_persistence = integration_persistence
        self.db = db
        self.client = httpx.Client()
        self.user = user
        self.lead_persistence = lead_persistence
        self.klaviyo_persistence = KlaviyoPersistence(db)

    def get_user_service_credentials(self):
        return self.integration_persistence.get_integration_by_user(self.user['id'])
    
    def save_customers(self, customers: List[Lead]):
        for customer in customers:
            self.lead_persistence.update_leads_by_cutomer(customer, self.user['id'])

    def delete_integration(self, serivce_name: str):
        self.integration_persistence.delete_integration(self.user['id'], serivce_name)

    def __enter__(self):
        self.shopify = ShopifyIntegrationService(self.integration_persistence, self.client, self.user)
        self.woocommerce = WoocommerceIntegrationService(self.integration_persistence, self.user)
        self.bigcommerce = BigcommerceIntegrationService(self.integration_persistence, self.client, self.user)
        self.klaviyo = KlaviyoIntegrations(self.integration_persistence, self.client, self.klaviyo_persistence, self.lead_persistence, self.user)
        self.mailchimo = MailchimpIntegrations(self.integration_persistence, self.user)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()