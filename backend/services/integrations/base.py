from sqlalchemy.orm import Session
from models.users import User
from models.leads import Lead
from persistence.leads_persistence import LeadsPersistence
import httpx
from .shopify import ShopifyIntegrationService
from persistence.users_integrations_persistence import UserIntegrationsPresistence
from schemas.integrations import Customer
from typing import List

class IntegrationService:

    def __init__(self, db: Session, user_integration_persistence: UserIntegrationsPresistence, 
                 lead_persistence: LeadsPersistence, user: User):
        self.user_integration_persistence = user_integration_persistence
        self.db = db
        self.client = httpx.Client()
        self.user = user
        self.lead_persistence = lead_persistence
        

    def get_user_service_creaditionals(self, service_name: str):
        return self.user_integration_persistence.get_integration_by_user_with_service(self.user.id, service_name)
    
    def save_customers(self, customers: List[Customer]):
        for customer in customers:
            self.lead_persistence.update_leads_by_cutomer(customer, self.user.id)

    def delete_integration(self, serivce_name: str):
        self.user_integration_persistence.delete_integration(self.user.id, serivce_name)

    def __enter__(self):
        self.shopify = ShopifyIntegrationService(self.db, self.user_integration_persistence, self.client, self.user)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()