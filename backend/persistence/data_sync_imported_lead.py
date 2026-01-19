from typing import List
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from db_dependencies import Db
from enums import DataSyncImportedStatus
from models import DataSyncImportedLead, IntegrationUserSync
from resolver import injectable


@injectable
class DataSyncImportedPersistence:
    def __init__(self, db: Db):
        self.db = db

    async def save_data_imported_leads(
        self,
        lead_ids: List[int],
        data_sync: IntegrationUserSync,
        is_validation: bool,
        user_integrations_service_name: str,
    ):
        records = [
            {
                "status": DataSyncImportedStatus.SENT.value,
                "lead_users_id": lead_id,
                "is_validation": is_validation,
                "service_name": user_integrations_service_name,
                "data_sync_id": data_sync.id,
            }
            for lead_id in lead_ids
        ]
        if not records:
            return []
        stmt = (
            insert(DataSyncImportedLead)
            .values(records)
            .on_conflict_do_nothing(
                index_elements=["lead_users_id", "data_sync_id"]
            )
        )

        self.db.execute(stmt)
        self.db.commit()
        result = self.db.execute(
            select(DataSyncImportedLead.id)
            .where(DataSyncImportedLead.lead_users_id.in_(lead_ids))
            .where(DataSyncImportedLead.data_sync_id == data_sync.id)
        )
        data_sync_imported_ids = [row.id for row in result]
        return data_sync_imported_ids

    async def save_data_imported_leads_ch(
        self,
        ch_lead_ids: List[str],
        data_sync: IntegrationUserSync,
        is_validation: bool,
        user_integrations_service_name: str,
    ):
        """Insert ClickHouse-sourced leads (by UUID id) into data_sync_imported_leads.
        Ensures idempotency via unique (ch_lead_id, data_sync_id).
        """
        records = [
            {
                "status": DataSyncImportedStatus.SENT.value,
                "ch_lead_id": ch_id,
                "is_validation": is_validation,
                "service_name": user_integrations_service_name,
                "data_sync_id": data_sync.id,
            }
            for ch_id in ch_lead_ids
        ]
        if not records:
            return []
        stmt = (
            insert(DataSyncImportedLead)
            .values(records)
            .on_conflict_do_nothing(
                index_elements=["ch_lead_id", "data_sync_id"]
            )
        )
        self.db.execute(stmt)
        self.db.commit()
        result = self.db.execute(
            select(DataSyncImportedLead.id)
            .where(DataSyncImportedLead.ch_lead_id.in_(ch_lead_ids))
            .where(DataSyncImportedLead.data_sync_id == data_sync.id)
        )
        data_sync_imported_ids = [row.id for row in result]
        return data_sync_imported_ids
