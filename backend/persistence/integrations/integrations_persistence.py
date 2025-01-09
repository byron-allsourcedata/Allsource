from models.integrations.users_domains_integrations import UserIntegration, Integration
from models.integrations.external_apps_installations import ExternalAppsInstall
from sqlalchemy.orm import Session
from sqlalchemy import func

class IntegrationsPresistence:

    def __init__(self, db: Session) -> None:
        self.db = db


    def create_integration(self, data: dict) -> UserIntegration:
        integration = UserIntegration(**data)
        self.db.add(integration)
        self.db.commit()
        return integration
        
    def get_integration_by_shop_id(self, shop_id: str) -> UserIntegration:
        user_integration = (
            self.db.query(UserIntegration)
            .filter(
                UserIntegration.shop_id == str(shop_id)
            )
            .first()
        )
        return user_integration
    
    def get_integration_by_shop_url(self, shop_url):
        user_integration = (
            self.db.query(UserIntegration)
            .filter(
                UserIntegration.shop_domain.like(f"%{shop_url}")
            )
            .first()
        )
        return user_integration
    
    def get_external_apps_installations_by_shop_hash(self, shop_hash):
        external_apps_install = self.db.query(ExternalAppsInstall).filter(ExternalAppsInstall.store_hash==shop_hash).first()
        return external_apps_install
    
    def delete_external_apps_installations(self, shop_hash):
        self.db.query(ExternalAppsInstall).filter(ExternalAppsInstall.store_hash == shop_hash).delete()
        self.db.commit()
        
    def get_integration_by_user(self, domain_id: int, filters) -> list[UserIntegration]:
        query = self.db.query(UserIntegration).filter(
            UserIntegration.domain_id == domain_id,
            UserIntegration.service_name.notin_(filters)
        )
        return query.all()


    

    def get_credentials_for_service(self, domain_id: int, service_name: str, **filter_by) -> UserIntegration:
        return self.db.query(UserIntegration) \
            .filter(UserIntegration.domain_id == domain_id, UserIntegration.service_name == service_name).filter_by(**filter_by).first()

    def delete_integration(self, domain_id: int, service_name: str):
        self.db.query(UserIntegration) \
            .filter(UserIntegration.domain_id == domain_id, UserIntegration.service_name == service_name).delete()
        self.db.commit()

    def edit_integrations(self, id: int, data: dict) -> UserIntegration:
        result = self.db.query(UserIntegration) \
            .filter(UserIntegration.id == id).update(data, synchronize_session='fetch')
        self.db.commit()

    def get_integrations_service(self, **filter_by):
        query = self.db.query(Integration)
        for key, value in filter_by.items():
            if key == 'service_name':
                query = query.filter(Integration.service_name.in_(value))
            else:
                query = query.filter_by(**{key: value})
        return query.order_by(Integration.service_name.asc()).all()
    
    def get_all_integrations_filter_by(self, **filter_by):
        return self.db.query(UserIntegration).filter_by(**filter_by).all()

    def get_users_integrations(self, service_name):
        return self.db.query(UserIntegration).filter_by(service_name=service_name).first()
