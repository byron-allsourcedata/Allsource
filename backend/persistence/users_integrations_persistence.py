from models.users_integrations import UserIntegration
from sqlalchemy.orm import Session


class UserIntegrationsPresistence:

    def __init__(self, db: Session) -> None:
        self.db = db

    def create_integration(self, data: dict) -> UserIntegration:
        integration = UserIntegration(**data)
        self.db.add(integration)
        self.db.commit()
        return integration

    def get_integration_by_user_with_service(self, user_id: int, service_name: str) -> UserIntegration:
        return self.db.query(UserIntegration).filter(UserIntegration.user_id == user_id).all()
    
    def delete_integration(self, user_id: int, service_name: str):
        self.db.query(UserIntegration).filter(UserIntegration.user_id == user_id, UserIntegration.service_name == service_name).delete()