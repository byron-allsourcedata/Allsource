from typing import Optional
from uuid import UUID

from sqlalchemy import func, desc, select
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql.functions import count, coalesce
from sqlalchemy.sql import and_, or_

from db_dependencies import Db
from enums import (
    SourcePlatformEnum,
    DataSyncType,
    DataSyncImportedStatus,
    ProccessDataSyncResult,
)
from models import (
    DataSyncImportedLead,
    LeadUser,
    LeadsUsersAddedToCart,
    LeadsUsersOrdered,
)
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

    # ---------------------------
    # ClickHouse helpers
    # ---------------------------
    def _build_ch_where(self, leads_type: str | None) -> str:
        base = "is_active = 1 AND is_confirmed = 1"
        if not leads_type or leads_type == "allContacts":
            return base
        if leads_type == "visitor":
            return (
                base
                + " AND behavior_type = 'visitor' AND is_converted_sales = 0"
            )
        if leads_type == "viewed_product":
            return (
                base
                + " AND behavior_type = 'viewed_product' AND is_converted_sales = 0"
            )
        if leads_type == "converted_sales":
            return base + " AND is_converted_sales = 1"
        if leads_type == "abandoned_cart":
            return (
                base
                + " AND behavior_type = 'product_added_to_cart' AND is_converted_sales = 0"
            )
        # Fallback to base for unknown types
        return base

    def _count_leads_in_clickhouse(
        self, pixel_id: str | None, leads_type: str | None
    ) -> int:
        """Return count of leads from ClickHouse leads_users for given pixel and type.
        On any error or missing pixel_id, returns 0.
        """
        if not pixel_id:
            return 0
        try:
            from config.clickhouse import ClickhouseConfig
            import clickhouse_connect

            client = ClickhouseConfig.get_client()
            where_tail = self._build_ch_where(leads_type)
            table = f"{ClickhouseConfig.database}.leads_users"
            sql = (
                f"SELECT count() AS cnt FROM {table} "
                "WHERE pixel_id = toUUID(%(pixel)s) AND " + where_tail
            )
            res = client.query(sql, {"pixel": str(pixel_id)})
            # clickhouse_connect may return QueryResult or list
            if hasattr(res, "first_row"):
                row = res.first_row
                return int(row[0]) if row and row[0] is not None else 0
            elif isinstance(res, list) and res:
                # list of dicts
                val = (
                    res[0].get("cnt") if isinstance(res[0], dict) else res[0][0]
                )
                return int(val or 0)
            return 0
        except Exception:
            # Log at upper layer if needed; keep UI alive with zero
            return 0

    def _get_pixel_id_for_domain(self, domain_id: int | None) -> str | None:
        if not domain_id:
            return None
        row = (
            self.db.query(UserDomains.pixel_id)
            .filter(UserDomains.id == domain_id)
            .first()
        )
        if not row:
            return None
        try:
            return str(row[0]) if row[0] is not None else None
        except Exception:
            return None

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

    def add_leads_type_filter(self, query):
        return query.filter(
            or_(
                IntegrationUserSync.leads_type == "allContacts",
                and_(
                    IntegrationUserSync.leads_type == "converted_sales",
                    or_(
                        and_(
                            LeadUser.behavior_type != "product_added_to_cart",
                            LeadUser.is_converted_sales == True,
                        ),
                        and_(
                            LeadUser.is_converted_sales == True,
                            LeadsUsersOrdered.ordered_at.isnot(None),
                            LeadsUsersAddedToCart.added_at
                            < LeadsUsersOrdered.ordered_at,
                        ),
                    ),
                ),
                and_(
                    IntegrationUserSync.leads_type == "viewed_product",
                    LeadUser.behavior_type == "viewed_product",
                    LeadUser.is_converted_sales == False,
                ),
                and_(
                    IntegrationUserSync.leads_type == "visitor",
                    LeadUser.behavior_type == "visitor",
                    LeadUser.is_converted_sales == False,
                ),
                and_(
                    IntegrationUserSync.leads_type == "abandoned_cart",
                    LeadUser.behavior_type == "product_added_to_cart",
                    LeadUser.is_converted_sales == False,
                    LeadsUsersAddedToCart.added_at.isnot(None),
                    or_(
                        LeadsUsersOrdered.ordered_at.is_(None),
                        LeadsUsersAddedToCart.added_at
                        > LeadsUsersOrdered.ordered_at,
                    ),
                ),
            )
        )

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
            .where(
                DataSyncImportedLead.is_validation.is_(True),
                DataSyncImportedLead.status
                == ProccessDataSyncResult.SUCCESS.value,
            )
            .group_by(IntegrationUserSync.id)
        ).subquery()

        base_query = (
            select(
                count(LeadUser.id).label("all_contacts"),
                IntegrationUserSync.id,
            )
            .select_from(LeadUser)
            .join(UserDomains, UserDomains.id == LeadUser.domain_id)
            .join(
                IntegrationUserSync,
                IntegrationUserSync.domain_id == UserDomains.id,
            )
            .filter(
                LeadUser.is_active == True,
                LeadUser.is_confirmed == True,
            )
        )
        base_query = base_query.outerjoin(
            LeadsUsersAddedToCart,
            LeadsUsersAddedToCart.lead_user_id == LeadUser.id,
        ).outerjoin(
            LeadsUsersOrdered, LeadsUsersOrdered.lead_user_id == LeadUser.id
        )
        all_synced_persons_query = self.add_leads_type_filter(base_query)
        all_synced_persons_query = all_synced_persons_query.group_by(
            IntegrationUserSync.id
        ).subquery()

        successful_contacts_query = (
            select(
                func.count(DataSyncImportedLead.id).label(
                    "successful_contacts"
                ),
                IntegrationUserSync.id,
            )
            .select_from(DataSyncImportedLead)
            .join(
                IntegrationUserSync,
                IntegrationUserSync.id == DataSyncImportedLead.data_sync_id,
            )
            .where(
                DataSyncImportedLead.status
                == ProccessDataSyncResult.SUCCESS.value,
            )
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
                IntegrationUserSync.domain_id,  # for ClickHouse mapping
                coalesce(all_synced_persons_query.c.all_contacts, 0).label(
                    "all_contacts"
                ),
                coalesce(processed_persons_query.c.processed, 0).label(
                    "processed"
                ),
                coalesce(validation_persons_query.c.validation, 0).label(
                    "validation"
                ),
                coalesce(
                    successful_contacts_query.c.successful_contacts, 0
                ).label("successful_contacts"),
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
                successful_contacts_query,
                IntegrationUserSync.id == successful_contacts_query.c.id,
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
                    "contacts": self._count_leads_in_clickhouse(
                        self._get_pixel_id_for_domain(sync.domain_id),
                        sync.leads_type,
                    ),
                    "processed_contacts": sync.processed,
                    "successful_contacts": sync.successful_contacts,
                    "validation_contacts": sync.validation,
                    "synced_contacts": sync.successful_contacts,
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
                "contacts": self._count_leads_in_clickhouse(
                    self._get_pixel_id_for_domain(sync.domain_id),
                    sync.leads_type,
                ),
                "processed_contacts": sync.processed,
                "successful_contacts": sync.successful_contacts,
                "validation_contacts": sync.validation,
                "synced_contacts": sync.successful_contacts,
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
                    "list_name": sync.list_name,
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
                "list_name": sync.list_name,
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
                AudienceSmartPerson.enrichment_user_asid == enrichment_user_id
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
