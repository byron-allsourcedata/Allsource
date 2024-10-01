from models.integrations.users_domains_integrations import UserIntegration, Integration
from sqlalchemy.orm import Session
from .klaviyo import KlaviyoPersistence
from .bigcommerce import BigcommercePersistence
from .shopify import ShopifyPersistence
from .mailchimp import MailchimpPersistence
from .facebook import FacebookPersistence
from .sendlane import SendlanePersistence

class IntegrationsPresistence:

    def __init__(self, db: Session) -> None:
        self.db = db


    def create_integration(self, data: dict) -> UserIntegration:
        integration = UserIntegration(**data)
        self.db.add(integration)
        self.db.commit()
        return integration

    def get_integration_by_user(self, domain_id: int) -> UserIntegration:
        return self.db.query(UserIntegration).filter(UserIntegration.domain_id == domain_id).all()
    

    def get_credentials_for_service(self, domain_id: int, service_name: str) -> UserIntegration:
        return self.db.query(UserIntegration) \
            .filter(UserIntegration.domain_id == domain_id, UserIntegration.service_name == service_name).first()

    def delete_integration(self, domain_id: int, service_name: str):
        self.db.query(UserIntegration) \
            .filter(UserIntegration.domain_id == domain_id, UserIntegration.service_name == service_name).delete()

    def edit_integrations(self, id: int, data: dict) -> UserIntegration:
        result = self.db.query(UserIntegration) \
            .filter(UserIntegration.id == id).update(data, synchronize_session='fetch')
        self.db.commit()

    def get_integrations_service(self, **filter_by):
        return self.db.query(Integration).filter_by(**filter_by).all()
    
    def get_all_integrations_filter_by(self, **filter_by):
        return self.db.query(UserIntegration).filter_by(**filter_by).all()

    def get_users_integrations(self, service_name):
        return self.db.query(UserIntegration).filter_by(service_name=service_name).first()
    
    def __enter__(self):
        self.klaviyo = KlaviyoPersistence(self.db)
        self.bigcommerce = BigcommercePersistence(self.db)
        self.shopify = ShopifyPersistence(self.db)
        self.mailchimp = MailchimpPersistence(self.db)
        self.facebook = FacebookPersistence(self.db)
        self.sendlane = SendlanePersistence(self.db)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db.close()