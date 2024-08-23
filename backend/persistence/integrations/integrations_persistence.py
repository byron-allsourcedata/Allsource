from models.integrations.users_integrations import UserIntegration, Integration
from sqlalchemy.orm import Session
from .klaviyo import KlaviyoPersistence
from .bigcommerce import BigcommercePersistence
from .shopify import ShopifyPersistence
from .mailchimp import MailchimpPersistence

class IntegrationsPresistence:

    def __init__(self, db: Session) -> None:
        self.db = db

    def __enter__(self):
        self.klaviyo = KlaviyoPersistence(self.db)
        self.bigcommerce = BigcommercePersistence(self.db)
        self.shopify = ShopifyPersistence(self.db)
        self.mailchimp = MailchimpPersistence(self.db)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db.close()

    def create_integration(self, data: dict) -> UserIntegration:
        integration = UserIntegration(**data)
        self.db.add(integration)
        self.db.commit()
        return integration

    def get_integration_by_user(self, user_id: int) -> UserIntegration:
        return self.db.query(UserIntegration).filter(UserIntegration.user_id == user_id).all()
    

    def get_user_integrations_by_service(self, user_id: int, service_name: str) -> UserIntegration:
        return self.db.query(UserIntegration) \
            .filter(UserIntegration.user_id == user_id, UserIntegration.service_name == service_name).first()

    def delete_integration(self, user_id: int, service_name: str):
        self.db.query(UserIntegration) \
            .filter(UserIntegration.user_id == user_id, UserIntegration.service_name == service_name).delete()

    def edit_integrations(self, id: int, data: dict) -> UserIntegration:
        result = self.db.query(UserIntegration) \
            .filter(UserIntegration.id == id).update(data, synchronize_session='fetch')
        self.db.commit()
    
    def get_integrations_service(self):
        return self.db.query(Integration).all()