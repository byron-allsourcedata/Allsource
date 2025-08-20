from uuid import UUID
from collections.abc import Sequence
from resolver import injectable
from .interface import AudienceSmartsPersistenceInterface
from .postgres import AudienceSmartsPostgresPersistence
from .clickhouse import AudienceSmartsClickhousePersistence

from sqlalchemy.orm.query import RowReturningQuery
from persistence.audience_smarts.dto import SyncedPersonRecord, PersonRecord
from schemas.audience import DataSourcesFormat
from models import AudienceSmart
from sqlalchemy.engine.row import Row
from typing import Any, Optional


@injectable
class AudienceSmartsUnifiedPersistence(AudienceSmartsPersistenceInterface):
    def __init__(
        self,
        postgres: AudienceSmartsPostgresPersistence,
        clickhouse: AudienceSmartsClickhousePersistence,
    ):
        self.postgres = postgres
        self.clickhouse = clickhouse

    def get_use_case_id_by_alias(self, alias: str):
        return self.postgres.get_use_case_id_by_alias(alias)

    def get_audience_smart_validations_by_id(self, aud_smart_id: UUID):
        return self.postgres.get_audience_smart_validations_by_id(aud_smart_id)

    def calculate_smart_audience(self, data: DataSourcesFormat) -> int:
        return self.postgres.calculate_smart_audience(data)

    def get_include_exclude_query(
        self,
        lookalike_include: Sequence[UUID],
        lookalike_exclude: Sequence[UUID],
        source_include: Sequence[UUID],
        source_exclude: Sequence[UUID],
    ) -> RowReturningQuery[tuple[UUID]]:
        return self.postgres.get_include_exclude_query(
            lookalike_include, lookalike_exclude, source_include, source_exclude
        )

    def create_audience_smarts_data_sources(
        self, smart_audience_id: UUID, data_sources: list[dict[str, Any]]
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
        data_sources: list[dict[str, Any]],
        total_records: int,
        status: str,
        target_schema: str,
        validation_params: dict | None,
        active_segment_records: int,
        need_validate: bool,
    ) -> AudienceSmart:
        return self.postgres.create_audience_smart(
            name=name,
            user_id=user_id,
            created_by_user_id=created_by_user_id,
            use_case_alias=use_case_alias,
            data_sources=data_sources,
            total_records=total_records,
            status=status,
            target_schema=target_schema,
            validation_params=validation_params,
            active_segment_records=active_segment_records,
            need_validate=need_validate,
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

    def get_datasources_by_aud_smart_id(self, id: UUID) -> list[Row]:
        return self.postgres.get_datasources_by_aud_smart_id(id)

    def get_validations_by_aud_smart_id(self, id: UUID) -> Optional[Row]:
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

    def get_persons_by_smart_aud_id(
        self, smart_audience_id: UUID, sent_contacts: int, fields: list[str]
    ) -> list[PersonRecord]:
        return self.clickhouse.get_persons_by_smart_aud_id(
            smart_audience_id, sent_contacts, fields
        )

    def get_synced_persons_by_smart_aud_id(
        self, data_sync_id: int, enrichment_field_names: list[str]
    ) -> list[SyncedPersonRecord]:
        return self.clickhouse.get_synced_persons_by_smart_aud_id(
            data_sync_id, enrichment_field_names
        )

    def sorted_enrichment_users_for_validation(
        self, ids: list[UUID], order_by_clause: str
    ) -> list[UUID]:
        return self.clickhouse.sorted_enrichment_users_for_validation(
            ids, order_by_clause
        )

    def get_processing_sources(self, id: int) -> Optional[Row]:
        return self.postgres.get_processing_smarts(id)

    def get_enrichment_users_for_confirmation_validation(
        self, smart_audience_id
    ):
        return self.clickhouse.get_enrichment_users_for_confirmation_validation(
            smart_audience_id
        )

    def get_enrichment_users_for_job_validation(
        self, smart_audience_id: UUID
    ) -> list[dict]:
        return self.clickhouse.get_enrichment_users_for_job_validation(
            smart_audience_id
        )

    def get_enrichment_users_for_delivery_validation(
        self, smart_audience_id: UUID
    ) -> list[dict]:
        return self.clickhouse.get_enrichment_users_for_delivery_validation(
            smart_audience_id
        )

    def get_enrichment_users_for_postal_validation(
        self, smart_audience_id: UUID, validation_type: str
    ) -> list[dict]:
        return self.clickhouse.get_enrichment_users_for_postal_validation(
            smart_audience_id, validation_type
        )

    def get_enrichment_users_for_free_validations(
        self, smart_audience_id: UUID, column_name: str
    ) -> list[dict]:
        return self.clickhouse.get_enrichment_users_for_free_validations(
            smart_audience_id, column_name
        )

    def check_access_for_user(self, user: dict) -> list[dict]:
        return self.postgres.check_access_for_user(user)

    def _get_test_include_exclude_query(
        self,
        lookalike_include: Sequence[UUID],
        lookalike_exclude: Sequence[UUID],
        source_include: Sequence[UUID],
        source_exclude: Sequence[UUID],
    ) -> RowReturningQuery[tuple[UUID]]:
        return self.postgres._get_test_include_exclude_query(
            lookalike_include, lookalike_exclude, source_include, source_exclude
        )

    def get_matching_info(self, id: int):
        return self.postgres.get_matching_info(id)

    def get_smart_for_regenerate(self, smart_id: UUID):
        return self.postgres.get_smart_for_regenerate(smart_id)

    def get_validation_temp_counts(self, smart_audience_id: UUID):
        return self.postgres.get_validation_temp_counts(smart_audience_id)

    def set_smart_audience_validations(self, validations, aud_smart_id):
        return self.postgres.set_smart_audience_validations(
            validations, aud_smart_id
        )

    def update_failed_persons(self, failed_ids):
        return self.postgres.update_failed_persons(failed_ids)

    def update_success_persons(self, failed_ids):
        return self.postgres.update_success_persons(failed_ids)
