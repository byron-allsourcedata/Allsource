from models.integrations.integrations_users_sync import IntegrationUserSync
from sqlalchemy.orm import Session
from models.integrations.users_domains_integrations import UserIntegration

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
            IntegrationUserSync.list_name,
            IntegrationUserSync.integration_id,
            IntegrationUserSync.sync_status,
            IntegrationUserSync.platform_user_id,
            IntegrationUserSync.no_of_contacts,
            IntegrationUserSync.created_by,
            UserIntegration.service_name,
            UserIntegration.is_with_suppression
        ) \
        .join(UserIntegration, UserIntegration.id == IntegrationUserSync.integration_id) \
        .filter(IntegrationUserSync.domain_id == domain_id)
        if service_name:
            query = query.filter(UserIntegration.service_name == service_name)
        syncs = query.all()
        return [{
            'id': sync.id,
            'createdDate': sync.created_at.strftime('%b %d, %Y') if sync.created_at else None,
            'name': sync.list_name,
            'lastSync': sync.last_sync_date.strftime('%b %d, %Y') if sync.last_sync_date else None,
            'type': sync.leads_type,
            'platform': sync.service_name.lower(),
            'integration_id': sync.integration_id,
            'dataSync': sync.is_active,
            'suppression': sync.is_with_suppression,
            'contacts': sync.no_of_contacts,
            'createdBy': sync.created_by,
            'accountId': sync.platform_user_id,
            'syncStatus': sync.sync_status,
        } for sync in syncs]

    def get_data_sync_filter_by(self, **filter_by):
        return self.db.query(IntegrationUserSync).filter_by(**filter_by).all()
    
    def update_sync(self, update_data: dict, **filter_by):
        update_data['no_of_contacts'] = IntegrationUserSync.no_of_contacts + 1
        return self.db.query(IntegrationUserSync).filter_by(**filter_by).update(update_data)
