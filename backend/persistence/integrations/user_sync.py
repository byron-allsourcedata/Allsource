from typing import Optional

from sqlalchemy import func, desc, select
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql.functions import count, coalesce

from db_dependencies import Db
from enums import (
    SourcePlatformEnum,
    DataSyncType,
    DataSyncImportedStatus,
)
from models import DataSyncImportedLead, LeadUser
from models.audience_data_sync_imported_persons import (
    AudienceDataSyncImportedPersons,
)
from models.audience_smarts import AudienceSmart
from models.audience_smarts_persons import AudienceSmartPerson
from models.audience_smarts_validations import AudienceSmartValidation
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import Integration
from models.integrations.users_domains_integrations import UserIntegration
from models.subscriptions import UserSubscriptions
from models.users import Users
from models.users_domains import UserDomains
from resolver import injectable


@injectable
class IntegrationsUserSyncPersistence:
    def __init__(self, db: Db):
        self.db = db
        self.UNLIMITED = -1

    def create_sync(self, data: dict) -> IntegrationUserSync:
        sync = IntegrationUserSync(**data)
        self.db.add(sync)
        self.db.commit()
        return sync

    def edit_sync(
        self, data: dict, integrations_users_sync_id: int
    ) -> IntegrationUserSync:
        self.try_reset_error(integrations_users_sync_id)
        sync = (
            self.db.query(IntegrationUserSync)
            .filter_by(id=integrations_users_sync_id)
            .first()
        )
        if sync:
            for key, value in data.items():
                setattr(sync, key, value)
            self.db.commit()
        return sync

    def delete_sync(self, domain_id, list_id):
        sync = (
            self.db.query(IntegrationUserSync)
            .filter(
                IntegrationUserSync.id == list_id,
                IntegrationUserSync.domain_id == domain_id,
            )
            .first()
        )
        if sync:
            self.db.delete(sync)
            self.db.commit()
            return True
        return False

    def switch_sync_toggle(self, domain_id, list_id):
        active = False
        sync = (
            self.db.query(IntegrationUserSync)
            .filter(
                IntegrationUserSync.id == list_id,
                IntegrationUserSync.domain_id == domain_id,
            )
            .first()
        )
        if sync:
            if sync.is_active == False:
                active = True
                sync.is_active = active
            else:
                sync.is_active = active
            self.db.commit()
            return active

    def switch_toggle_smart_sync(self, user_id, list_id):
        active = False
        sync = (
            self.db.query(IntegrationUserSync)
            .join(
                UserIntegration,
                IntegrationUserSync.integration_id == UserIntegration.id,
            )
            .filter(
                IntegrationUserSync.id == list_id,
                UserIntegration.user_id == user_id,
            )
            .first()
        )
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
        user_subscription = (
            self.db.query(UserSubscriptions.integrations_limit)
            .join(Users, Users.current_subscription_id == UserSubscriptions.id)
            .filter(Users.id == user_id)
            .first()
        )

        if user_subscription:
            integration_limit = user_subscription.integrations_limit
        else:
            return None, None

        domain_integrations_count = (
            self.db.query(func.count(UserIntegration.id))
            .filter(
                UserIntegration.domain_id == domain_id,
                UserIntegration.service_name
                != SourcePlatformEnum.SHOPIFY.value,
                UserIntegration.service_name
                != SourcePlatformEnum.BIG_COMMERCE.value,
            )
            .scalar()
        )

        return integration_limit, domain_integrations_count

    def get_filter_by(
        self,
        domain_id: int,
        user_id: Optional[int] = None,
        service_name: Optional[str] = None,
        integrations_users_sync_id: Optional[str] = None,
    ):
        processed_persons_query = (
            select(
                count(DataSyncImportedLead.id).label("processed"),
                IntegrationUserSync.id,
            )
            .select_from(DataSyncImportedLead)
            .join(
                IntegrationUserSync,
                IntegrationUserSync.id == DataSyncImportedLead.data_sync_id,
            )
            .where(
                DataSyncImportedLead.status != DataSyncImportedStatus.SENT.value
            )
            .group_by(IntegrationUserSync.id)
        ).subquery()

        validation_persons_query = (
            select(
                func.count(DataSyncImportedLead.id).label("validation"),
                IntegrationUserSync.id,
            )
            .select_from(DataSyncImportedLead)
            .join(
                IntegrationUserSync,
                IntegrationUserSync.id == DataSyncImportedLead.data_sync_id,
            )
            .where(DataSyncImportedLead.is_validation.is_(True))
            .group_by(IntegrationUserSync.id)
        ).subquery()

        all_synced_persons_query = (
            select(
                count(LeadUser.id).label("all_contacts"),
                IntegrationUserSync.id,
            )
            .select_from(LeadUser)
            .join(
                UserDomains,
                UserDomains.id == LeadUser.domain_id,
            )
            .join(
                IntegrationUserSync,
                IntegrationUserSync.domain_id == UserDomains.id,
            )
            .filter(LeadUser.is_active == True, LeadUser.is_confirmed == True)
            .group_by(IntegrationUserSync.id)
        ).subquery()

        success_synced_persons_query = (
            self.db.query(
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
                coalesce(all_synced_persons_query.c.all_contacts, 0).label(
                    "all_contacts"
                ),
                coalesce(processed_persons_query.c.processed, 0).label(
                    "processed"
                ),
                coalesce(validation_persons_query.c.validation, 0).label(
                    "validation"
                ),
                UserIntegration.service_name,
                UserIntegration.is_with_suppression,
                UserIntegration.platform_user_id,
                UserIntegration.error_message,
                UserIntegration.is_failed,
            )
            .join(
                UserIntegration,
                UserIntegration.id == IntegrationUserSync.integration_id,
            )
            .outerjoin(
                processed_persons_query,
                IntegrationUserSync.id == processed_persons_query.c.id,
            )
            .outerjoin(
                validation_persons_query,
                IntegrationUserSync.id == validation_persons_query.c.id,
            )
            .outerjoin(
                all_synced_persons_query,
                IntegrationUserSync.id == all_synced_persons_query.c.id,
            )
            .filter(
                IntegrationUserSync.domain_id == domain_id,
                IntegrationUserSync.sync_type == DataSyncType.CONTACT.value,
            )
        )

        if service_name:
            success_synced_persons_query = success_synced_persons_query.filter(
                UserIntegration.service_name == service_name
            )
        is_user_validations = None
        if user_id:
            user = self.db.query(Users).filter(Users.id == user_id).first()
            if user:
                is_user_validations = user.is_email_validation_enabled

        if integrations_users_sync_id:
            sync = success_synced_persons_query.filter(
                IntegrationUserSync.id == integrations_users_sync_id
            ).first()
            if sync:
                return {
                    "id": sync.id,
                    "createdDate": sync.created_at.strftime("%b %d, %Y")
                    if sync.created_at
                    else None,
                    "list_name": sync.list_name,
                    "lastSync": sync.last_sync_date.strftime("%b %d, %Y")
                    if sync.last_sync_date
                    else None,
                    "type": sync.leads_type,
                    "platform": sync.service_name.lower(),
                    "integration_id": sync.integration_id,
                    "dataSync": sync.is_active,
                    "suppression": sync.is_with_suppression,
                    "contacts": sync.all_contacts,
                    "processed_contacts": sync.processed,
                    "successful_contacts": sync.no_of_contacts,
                    "validation_contacts": sync.validation,
                    "createdBy": sync.created_by,
                    "accountId": sync.platform_user_id,
                    "data_map": sync.data_map,
                    "syncStatus": False
                    if sync.is_failed == True
                    else sync.sync_status,
                    "integration_is_failed": sync.is_failed,
                    "type_error": sync.error_message,
                    "list_id": sync.list_id,
                    "campaign_id": sync.campaign_id,
                    "campaign_name": sync.campaign_name,
                    "customer_id": sync.customer_id,
                    "hook_url": sync.hook_url,
                    "method": sync.method,
                    **(
                        {"is_user_validations": is_user_validations}
                        if is_user_validations is not None
                        else {}
                    ),
                }
        syncs = success_synced_persons_query.order_by(
            desc(IntegrationUserSync.created_at)
        ).all()
        return [
            {
                "id": sync.id,
                "createdDate": sync.created_at.strftime("%b %d, %Y")
                if sync.created_at
                else None,
                "list_name": sync.list_name,
                "lastSync": sync.last_sync_date.strftime("%b %d, %Y")
                if sync.last_sync_date
                else None,
                "type": sync.leads_type,
                "platform": sync.service_name.lower(),
                "integration_id": sync.integration_id,
                "dataSync": sync.is_active,
                "suppression": sync.is_with_suppression,
                "contacts": sync.all_contacts,
                "processed_contacts": sync.processed,
                "successful_contacts": sync.no_of_contacts,
                "validation_contacts": sync.validation,
                "createdBy": sync.created_by,
                "accountId": sync.platform_user_id,
                "campaign_id": sync.campaign_id,
                "campaign_name": sync.campaign_name,
                "data_map": sync.data_map,
                "syncStatus": False
                if sync.is_failed == True
                else sync.sync_status,
                "integration_is_failed": sync.is_failed,
                "type_error": sync.error_message,
                "customer_id": sync.customer_id,
                "list_id": sync.list_id,
                "hook_url": sync.hook_url,
                "method": sync.method,
                **(
                    {"is_user_validations": is_user_validations}
                    if is_user_validations is not None
                    else {}
                ),
            }
            for sync in syncs
        ]

    def get_all_audience_sync(
        self,
        user_id: int,
        service_name: str = None,
        integrations_users_sync_id: str = None,
    ):
        ImportedLeads = aliased(AudienceDataSyncImportedPersons)

        query = (
            self.db.query(
                IntegrationUserSync.id,
                IntegrationUserSync.created_at,
                IntegrationUserSync.is_active,
                IntegrationUserSync.last_sync_date,
                IntegrationUserSync.integration_id,
                IntegrationUserSync.sync_status,
                IntegrationUserSync.no_of_contacts,
                IntegrationUserSync.sent_contacts,
                IntegrationUserSync.created_by,
                IntegrationUserSync.list_id,
                IntegrationUserSync.list_name,
                IntegrationUserSync.customer_id,
                IntegrationUserSync.leads_type,
                IntegrationUserSync.campaign_id,
                IntegrationUserSync.campaign_name,
                IntegrationUserSync.data_map,
                UserIntegration.service_name,
                UserIntegration.is_failed,
                AudienceSmart.name,
                func.count(ImportedLeads.id)
                .filter(ImportedLeads.status != "sent")
                .label("imported_count"),
            )
            .join(
                UserIntegration,
                UserIntegration.id == IntegrationUserSync.integration_id,
            )
            .outerjoin(
                AudienceSmart,
                IntegrationUserSync.smart_audience_id == AudienceSmart.id,
            )
            .outerjoin(
                ImportedLeads,
                ImportedLeads.data_sync_id == IntegrationUserSync.id,
            )
            .filter(
                UserIntegration.user_id == user_id,
                IntegrationUserSync.sync_type == DataSyncType.AUDIENCE.value,
            )
            .group_by(
                IntegrationUserSync.id,
                UserIntegration.service_name,
                UserIntegration.is_failed,
                AudienceSmart.name,
                AudienceSmart.active_segment_records,
                AudienceSmart.total_records,
            )
        )

        if service_name:
            query = query.filter(UserIntegration.service_name == service_name)

        if integrations_users_sync_id:
            sync = query.filter(
                IntegrationUserSync.id == integrations_users_sync_id
            ).first()
            if sync:
                return {
                    "id": sync.id,
                    "createdDate": sync.created_at.strftime("%b %d, %Y")
                    if sync.created_at
                    else None,
                    "name": sync.name if sync.name else sync.list_name,
                    "lastSync": sync.last_sync_date.strftime("%b %d, %Y")
                    if sync.last_sync_date
                    else None,
                    "platform": sync.service_name.lower(),
                    "integration_id": sync.integration_id,
                    "dataSync": sync.is_active,
                    "contacts": sync.no_of_contacts,
                    "createdBy": sync.created_by,
                    "customer_id": sync.customer_id,
                    "campaign_id": sync.campaign_id,
                    "campaign_name": sync.campaign_name,
                    "type": sync.leads_type,
                    "data_map": sync.data_map,
                    "syncStatus": False if sync.is_failed else sync.sync_status,
                    "integration_is_failed": sync.is_failed,
                    "list_id": sync.list_id,
                    "active_segment": sync.sent_contacts,
                    "records_synced": sync.no_of_contacts,
                    "is_progress": sync.imported_count < sync.sent_contacts
                    or sync.sent_contacts == self.UNLIMITED
                    if sync.sent_contacts
                    else False,
                }

        syncs = query.order_by(desc(IntegrationUserSync.created_at)).all()

        return [
            {
                "id": sync.id,
                "createdDate": sync.created_at.strftime("%b %d, %Y")
                if sync.created_at
                else None,
                "name": sync.name if sync.name else sync.list_name,
                "lastSync": sync.last_sync_date.strftime("%b %d, %Y")
                if sync.last_sync_date
                else None,
                "platform": sync.service_name.lower(),
                "integration_id": sync.integration_id,
                "dataSync": sync.is_active,
                "createdBy": sync.created_by,
                "data_map": sync.data_map,
                "customer_id": sync.customer_id,
                "campaign_id": sync.campaign_id,
                "campaign_name": sync.campaign_name,
                "type": sync.leads_type,
                "syncStatus": False if sync.is_failed else sync.sync_status,
                "integration_is_failed": sync.is_failed,
                "list_id": sync.list_id,
                "active_segments": sync.sent_contacts,
                "records_synced": sync.no_of_contacts,
                "is_progress": sync.imported_count < sync.sent_contacts
                or sync.sent_contacts == self.UNLIMITED
                if sync.sent_contacts
                else False,
            }
            for sync in syncs
        ]

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
        update_data["no_of_contacts"] = (
            IntegrationUserSync.no_of_contacts + counter
        )
        update = (
            self.db.query(IntegrationUserSync)
            .filter_by(**filter_by)
            .update(update_data)
        )
        self.db.commit()
        return update

    def try_reset_error(self, integrations_users_sync_id: int):
        sync_record = (
            self.db.query(IntegrationUserSync)
            .filter_by(id=integrations_users_sync_id)
            .first()
        )

        if not sync_record:
            return False

        if not sync_record.sync_status:
            integration_record = (
                self.db.query(UserIntegration)
                .filter(UserIntegration.id == sync_record.integration_id)
                .first()
            )

            if integration_record and not integration_record.is_failed:
                sync_record.sync_status = True
                self.db.commit()
                return True

        return False

    def get_destinations(self, type: str):
        query = self.db.query(Integration.service_name)

        if type == DataSyncType.AUDIENCE.value:
            query = query.filter(Integration.for_audience == True)
        elif type == DataSyncType.CONTACT.value:
            query = query.filter(Integration.for_pixel == True)

        result = [row[0] for row in query.all()]

        return result

    def get_integration_by_sync_id(self, sync_id: int):
        return (
            self.db.query(UserIntegration)
            .join(
                IntegrationUserSync,
                IntegrationUserSync.integration_id == UserIntegration.id,
            )
            .filter(IntegrationUserSync.id == sync_id)
            .first()
        )

    def get_verified_email_and_phone(self, enrichment_user_id):
        rows = (
            self.db.query(
                AudienceSmartValidation.verified_business_email,
                AudienceSmartValidation.verified_personal_email,
                AudienceSmartValidation.verified_phone,
            )
            .join(
                AudienceSmartPerson,
                AudienceSmartPerson.id
                == AudienceSmartValidation.audience_smart_person_id,
            )
            .filter(
                AudienceSmartPerson.enrichment_user_id == enrichment_user_id
            )
            .limit(2)
            .all()
        )
        business_email = ""
        personal_email = ""
        phone = ""
        for (
            verified_business_email,
            verified_personal_email,
            verified_phone,
        ) in rows:
            if verified_business_email:
                business_email = verified_business_email
            if verified_personal_email:
                personal_email = verified_personal_email
            if verified_phone:
                phone = verified_phone

        return business_email, personal_email, phone
