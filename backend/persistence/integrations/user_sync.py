from models.integrations.integrations_users_sync import IntegrationUserSync
from sqlalchemy.orm import Session


class IntegrationsUserSyncPersistence:

    def __init__(self, db: Session):
        self.db = db

    def create_sync(self, data: dict) -> IntegrationUserSync:
        sync = IntegrationUserSync(**data)
        self.db.add(sync)
        self.db.commit()
        return sync
    
    def get_all(self):
        return self.db.query(IntegrationUserSync).all()
    
    def get_filter_by(self, **filter_by):
        return self.db.query(IntegrationUserSync).filter_by(**filter_by).all()
    
    def update_sync(self, update_data: dict, **filter_by, ):
        return self.db.query(IntegrationUserSync).filter_by(**filter_by).update(update_data)