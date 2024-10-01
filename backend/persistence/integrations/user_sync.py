from models.integrations.integrations_users_sync import IntegrationUserSync
from sqlalchemy.orm import Session
from models.integrations.users_domains_integrations import UserIntegration, Integration

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
    
    def get_filter_by(self, domain_id, service_name: str = None):
        query = self.db.query(
            IntegrationUserSync.id, 
            IntegrationUserSync.created_at, 
            IntegrationUserSync.is_active, 
            IntegrationUserSync.last_sync_date,
            IntegrationUserSync.leads_type, 
            Integration.service_name
        ) \
        .join(UserIntegration, UserIntegration.id == IntegrationUserSync.integration_id) \
        .join(Integration, Integration.service_name == UserIntegration.service_name) \
        .filter(IntegrationUserSync.domain_id == domain_id)
        if service_name:
            query = query.filter(UserIntegration.service_name == service_name)
        syncs = query.all()
        return [{
            'id': sync.id,
            'created_at': sync.created_at,
            'is_active': sync.is_active,
            'last_sync_date': sync.last_sync_date,
            'leads_type': sync.leads_type,
            'service_name': sync.service_name
        } for sync in syncs]

    
    
    def update_sync(self, update_data: dict, **filter_by, ):
        return self.db.query(IntegrationUserSync).filter_by(**filter_by).update(update_data)