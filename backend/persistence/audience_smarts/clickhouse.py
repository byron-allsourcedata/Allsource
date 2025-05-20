from typing import Optional, List, Tuple
from uuid import UUID

from dependencies import Clickhouse
from persistence.audience_smarts import AudienceSmartsPostgresPersistence
from persistence.audience_smarts.dto import AudienceSmartDTO, PersonRecord, SyncedPersonRecord
from persistence.audience_smarts.interface import AudienceSmartsPersistenceInterface
from resolver import injectable
from schemas.audience import DataSourcesFormat
from sqlalchemy.engine.row import Row


@injectable
class AudienceSmartsClickhousePersistence(AudienceSmartsPersistenceInterface):
    def __init__(self, client: Clickhouse, postgres: AudienceSmartsPostgresPersistence):
        self.client = client
        self.postgres = postgres

    def get_use_case_id_by_alias(self, use_case_alias: str) -> Optional[UUID]:
        return self.postgres.get_use_case_id_by_alias(use_case_alias)

    def create_audience_smarts_data_sources(
            self,
            smart_audience_id: UUID,
            data_sources: List[dict],
    ) -> None:
        return self.postgres.create_audience_smarts_data_sources(
            str(smart_audience_id), data_sources
        )

    def create_audience_smart(
            self,
            name: str,
            user_id: int,
            created_by_user_id: int,
            use_case_alias: str,
            data_sources: List[dict],
            total_records: int,
            status: str,
            target_schema: str,
            validation_params: dict | None,
            active_segment_records: int,
    ) -> AudienceSmartDTO:
        return self.postgres.create_audience_smart(
            name,
            user_id,
            created_by_user_id,
            use_case_alias,
            data_sources,
            total_records,
            status,
            target_schema,
            validation_params,
            active_segment_records,
        )

    def get_audience_smarts(
            self,
            user_id: int,
            page: int,
            per_page: int,
            from_date: int | None = None,
            to_date: int | None = None,
            sort_by: str | None = None,
            sort_order: str | None = None,
            search_query: str | None = None,
            statuses: list[str] | None = None,
            use_cases: list[str] | None = None,
    ) -> tuple[list[Row], int]:
        return self.postgres.get_audience_smarts(
            user_id,
            page,
            per_page,
            from_date,
            to_date,
            sort_by,
            sort_order,
            search_query,
            statuses,
            use_cases,
        )

    def get_datasources_by_aud_smart_id(self, id: UUID) -> Tuple[List[Row]]:
        return self.postgres.get_datasources_by_aud_smart_id(id)

    def get_validations_by_aud_smart_id(self, id: UUID) -> Tuple[List[Row]]:
        return self.postgres.get_validations_by_aud_smart_id(id)

    def search_audience_smart(
            self, start_letter: str, user_id: int
    ) -> list[Row[tuple]]:
        return self.postgres.search_audience_smart(start_letter, user_id)

    def delete_audience_smart(self, id: int) -> int:
        return self.postgres.delete_audience_smart(id)

    def update_audience_smart(self, id: int, new_name: str) -> int:
        return self.postgres.update_audience_smart(id, new_name)

    def set_data_syncing_status(self, id: int, status: str) -> int:
        return self.postgres.set_data_syncing_status(id, status)

    def get_processing_sources(self, id: int) -> Row:
        return self.postgres.get_processing_sources(id)

    def get_persons_by_smart_aud_id(
        self, smart_audience_id: UUID, sent_contacts: int, fields: List[str]
    ) -> List[PersonRecord]:
        ids = self.postgres.get_person_ids_by_smart_aud_id(smart_audience_id, sent_contacts)
        if not ids:
            return []

        cols = ", ".join(fields)
        in_list = ", ".join(f"'{i}'" for i in ids)
        sql = f"""
            SELECT {cols}
            FROM maximiz_local.enrichment_users
            WHERE asid IN ({in_list})
            LIMIT {sent_contacts}
        """
        q = self.client.query(sql)
        rows = q.result_rows
        col_names = q.column_names

        return [PersonRecord(**dict(zip(col_names, row))) for row in rows]

    def get_synced_persons_by_smart_aud_id(
        self, data_sync_id: int, enrichment_field_names: List[str]
    ) -> List[SyncedPersonRecord]:
        ids = self.postgres.get_synced_person_ids(data_sync_id)
        if not ids:
            return []

        cols = ", ".join(enrichment_field_names)
        in_list = ", ".join(f"'{i}'" for i in ids)
        sql = f"""
            SELECT
              {cols}
            FROM maximiz_local.enrichment_users
            WHERE asid IN ({in_list})
        """
        q = self.client.query(sql)
        rows = q.result_rows
        col_names = q.column_names

        return [SyncedPersonRecord(**dict(zip(col_names, row))) for row in rows]

    def calculate_smart_audience(self, data: DataSourcesFormat) -> int:
        ids = self.postgres.collect_user_ids_for_smart_audience(data)
        if not ids:
            return 0

        in_list = ", ".join(f"'{i}'" for i in ids)
        linkedin_filter = ""
        if data.get("use_case") == "linkedin":
            linkedin_filter = "AND linkedin_url IS NOT NULL"

        sql = f"""
        SELECT count(*) 
        FROM maximiz_local.enrichment_users 
        WHERE asid IN ({in_list})
        {linkedin_filter}
        """
        q = self.client.query(sql)
        return int(q.result_rows[0][0]) if q.result_rows else 0