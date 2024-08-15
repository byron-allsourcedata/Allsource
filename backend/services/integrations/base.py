from sqlalchemy.orm import Session
from models.users import User
import httpx
from .shopify import ShopifyIntegrationService
from persistence.users_integrations_persistence import UserIntegrationsPresistence


class IntegrationService:


    def __init__(self, db: Session, user_integration_persistence: UserIntegrationsPresistence, user: User):
        self.user_integration_persistence = user_integration_persistence
        self.db = db
        self.client = httpx.Client()
        self.user = user
        

    def get_user_service_creaditionals(self, service_name: str):
        return self.user_integration_persistence.get_integration_by_user_with_service(self.user.id, service_name)
    
    def save_customers(self, customers):
        ...
        


    def __enter__(self):
        self.shopify = ShopifyIntegrationService(self.db, self.user_integration_persistence, self.client, self.user)
        return self


    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()