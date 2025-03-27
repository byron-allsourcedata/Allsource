from models.integrations.integrations_users_sync import IntegrationUserSync
from sqlalchemy.orm import Session
from models.users import Users
from enums import SourcePlatformEnum
from models.users_domains import UserDomains
from models.subscriptions import UserSubscriptions
from sqlalchemy import func
from models.integrations.users_domains_integrations import UserIntegration

class IntegrationsUserSyncPersistence:

    def __init__(self, db: Session):
        self.db = db

    def create_sync(self, data: dict) -> IntegrationUserSync:
        sync = IntegrationUserSync(**data)
        self.db.add(sync)
        self.db.commit()
        return sync
    
    def edit_sync(self, data: dict, integrations_users_sync_id: int) -> IntegrationUserSync:
        self.try_reset_error(integrations_users_sync_id)
        sync = self.db.query(IntegrationUserSync).filter_by(id=integrations_users_sync_id).first()
        if sync:
            for key, value in data.items():
                setattr(sync, key, value)
            self.db.commit()
        return sync
    
    def delete_sync(self, domain_id, list_id):
        sync = self.db.query(IntegrationUserSync).filter(IntegrationUserSync.id == list_id, IntegrationUserSync.domain_id == domain_id).first()
        if sync:
            self.db.delete(sync)
            self.db.commit()
            return True
        return False


    def switch_sync_toggle(self, domain_id, list_id):
        active = False
        sync = self.db.query(IntegrationUserSync).filter(IntegrationUserSync.id == list_id, IntegrationUserSync.domain_id == domain_id).first()
        if sync:
            if sync.is_active == False:
                active = True
                sync.is_active = active
            else:
                sync.is_active = active
            self.db.commit()
            return active
    
    def get_all(self):
        return self.db.query(IntegrationUserSync).all()
    
    def get_limits_integrations(self, user_id, domain_id):
        user_subscription = self.db.query(UserSubscriptions.integrations_limit) \
            .join(Users, Users.current_subscription_id == UserSubscriptions.id) \
            .filter(Users.id == user_id) \
            .first()

        if user_subscription:
            integration_limit = user_subscription.integrations_limit
        else:
            return None, None

        domain_integrations_count = self.db.query(func.count(UserIntegration.id)) \
            .filter(UserIntegration.domain_id == domain_id, UserIntegration.service_name != SourcePlatformEnum.SHOPIFY.value, UserIntegration.service_name != SourcePlatformEnum.BIG_COMMERCE.value) \
            .scalar()

        return integration_limit, domain_integrations_count

    def get_filter_by(self, domain_id, service_name: str = None, integrations_users_sync_id: str = None):
        query = self.db.query(
            IntegrationUserSync.id, 
            IntegrationUserSync.created_at, 
            IntegrationUserSync.is_active, 
            IntegrationUserSync.last_sync_date,
            IntegrationUserSync.leads_type,
            IntegrationUserSync.integration_id,
            IntegrationUserSync.sync_status,
            IntegrationUserSync.no_of_contacts,
            IntegrationUserSync.created_by,
            IntegrationUserSync.data_map,
            IntegrationUserSync.customer_id,
            IntegrationUserSync.list_name,
            IntegrationUserSync.list_id,
            IntegrationUserSync.campaign_id,
            IntegrationUserSync.campaign_name,
            IntegrationUserSync.hook_url,
            IntegrationUserSync.method,
            UserIntegration.service_name,
            UserIntegration.is_with_suppression,
            UserIntegration.platform_user_id,
            UserIntegration.error_message,
            UserIntegration.is_failed
        ).join(UserIntegration, UserIntegration.id == IntegrationUserSync.integration_id) \
        .filter(IntegrationUserSync.domain_id == domain_id)

        if service_name:
            query = query.filter(UserIntegration.service_name == service_name)
        if integrations_users_sync_id:
            sync = query.filter(IntegrationUserSync.id == integrations_users_sync_id).first()
            if sync:
                return {
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
                    'data_map': sync.data_map,
                    'syncStatus': False if sync.is_failed == True else sync.sync_status,
                    'integration_is_failed': sync.is_failed,
                    'type_error': sync.error_message,
                    'list_id': sync.list_id,
                    'campaign_id': sync.campaign_id,
                    'campaign_name': sync.campaign_name,
                    'customer_id': sync.customer_id,
                    'hook_url': sync.hook_url,
                    'method': sync.method
                }
        syncs = query.order_by(IntegrationUserSync.id).all()
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
            'campaign_id': sync.campaign_id,
            'campaign_name': sync.campaign_name,
            'data_map': sync.data_map,
            'syncStatus': False if sync.is_failed == True else sync.sync_status,
            'integration_is_failed': sync.is_failed,
            'type_error': sync.error_message,
            'customer_id': sync.customer_id,
            'list_id': sync.list_id,
            'hook_url': sync.hook_url,
            'method': sync.method
        } for sync in syncs]

    def get_data_sync_filter_by(self, **filter_by):
        return self.db.query(IntegrationUserSync).filter_by(**filter_by).all()
    
    def get_user_by_shop_domain(self, shop_domain):
        user = (
            self.db.query(Users)
            .join(UserDomains, UserDomains.user_id == Users.id)
            .join(UserIntegration, UserIntegration.domain_id == UserDomains.id)
            .filter(UserIntegration.shop_domain == shop_domain)
            .first()
        )
        return user

    
    def update_sync(self, update_data: dict, counter, **filter_by):
        update_data['no_of_contacts'] = IntegrationUserSync.no_of_contacts + counter
        update = self.db.query(IntegrationUserSync).filter_by(**filter_by).update(update_data) 
        self.db.commit()
        return update

    def try_reset_error(self, integrations_users_sync_id: int):
        sync_record = self.db.query(IntegrationUserSync).filter_by(id=integrations_users_sync_id).first()

        if not sync_record:
            return False

        if not sync_record.sync_status:
            integration_record = (
                self.db.query(UserIntegration).filter(UserIntegration.id == sync_record.integration_id).first()
            )

            if integration_record and not integration_record.is_failed:
                sync_record.sync_status = True
                self.db.commit()
                return True

        return False

    def get_integration_by_sync_id(self, sync_id: int):
        return self.db.query(UserIntegration).join(IntegrationUserSync, IntegrationUserSync.integration_id == UserIntegration.id).filter(IntegrationUserSync.id == sync_id).first()