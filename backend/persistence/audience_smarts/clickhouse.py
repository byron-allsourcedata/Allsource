from typing import Optional, List, Tuple, Callable
from uuid import UUID
import json
from datetime import datetime

from db_dependencies import Clickhouse, Db
from persistence.audience_smarts import AudienceSmartsPostgresPersistence
from persistence.audience_smarts.dto import (
    AudienceSmartDTO,
    PersonRecord,
    SyncedPersonRecord,
)
from persistence.audience_smarts.interface import (
    AudienceSmartsPersistenceInterface,
)
from resolver import injectable
from schemas.audience import DataSourcesFormat
from sqlalchemy.engine.row import Row


@injectable
class AudienceSmartsClickhousePersistence(AudienceSmartsPersistenceInterface):
    def __init__(
        self, client: Clickhouse, postgres: AudienceSmartsPostgresPersistence
    ):
        self.client = client
        self.postgres = postgres

    def get_use_case_id_by_alias(self, use_case_alias: str) -> Optional[UUID]:
        return self.postgres.get_use_case_id_by_alias(use_case_alias)

    def get_audience_smart_validations_by_id(self, aud_smart_id: UUID):
        return self.postgres.get_audience_smart_validations_by_id(aud_smart_id)

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
        validation_params: Optional[dict],
        active_segment_records: int,
        need_validate: bool = False,
    ) -> AudienceSmartDTO:
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

    def squash_sequences(self, row: tuple) -> tuple:
        return tuple(
            ",".join(map(str, cell))
            if isinstance(cell, (list, tuple))
            else cell
            for cell in row
        )

    def get_persons_by_smart_aud_id(
        self, smart_audience_id: UUID, sent_contacts: int, fields: List[str]
    ) -> List[PersonRecord]:
        ids = self.postgres.get_person_ids_by_smart_aud_id(
            smart_audience_id, sent_contacts
        )
        if not ids:
            return []

        cols = ", ".join(fields)
        in_list = ", ".join(f"'{i}'" for i in ids)
        sql = f"""
            SELECT {cols}
            FROM enrichment_users
            WHERE asid IN ({in_list})
            LIMIT {sent_contacts}
        """
        q = self.client.query(sql)
        norm_rows = [self.squash_sequences(row) for row in q.result_rows]
        col_names = q.column_names

        asid_index = col_names.index("asid")
        found_records = {
            row[asid_index]: PersonRecord(**dict(zip(col_names, row)))
            for row in norm_rows
        }

        final_result = []
        for asid in ids:
            record = found_records.get(asid)
            if record:
                final_result.append(record)
            else:
                empty_data = {key: None for key in col_names}
                empty_data["asid"] = asid
                final_result.append(PersonRecord(**empty_data))

        return final_result

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
            FROM enrichment_users
            WHERE asid IN ({in_list})
        """
        q = self.client.query(sql)
        rows = q.result_rows
        col_names = q.column_names

        return [SyncedPersonRecord(**dict(zip(col_names, row))) for row in rows]

    def calculate_smart_audience(self, data: DataSourcesFormat) -> int:
        self.client.command("SET max_query_size = 104857600")
        ids = self.postgres.collect_user_ids_for_smart_audience(data)
        if not ids:
            return 0
        return len(ids)
        # in_list = ", ".join(f"'{i}'" for i in ids)
        # linkedin_filter = ""
        # if data.get("use_case") == "linkedin":
        #     linkedin_filter = "AND linkedin_url IS NOT NULL"
        # sql = f"""
        # SELECT count(*)
        # FROM enrichment_users
        # WHERE asid IN ({in_list})
        # {linkedin_filter}
        # """
        # q = self.client.query(sql)
        # return int(q.result_rows[0][0]) if q.result_rows else 0

    def sorted_enrichment_users_for_validation(
        self, ids: List[UUID], order_by_clause: str
    ):
        self.client.command("SET max_query_size = 104857600")
        ids_sql_list = ", ".join(f"'{i}'" for i in ids)

        sql = f"""
        SELECT asid
        FROM enrichment_users
        WHERE asid IN ({ids_sql_list})
        ORDER BY {order_by_clause}
        """
        result = self.client.query(sql)
        sorted_found = [row[0] for row in result.result_rows]

        sorted_set = set(sorted_found)
        missing = [id_ for id_ in ids if id_ not in sorted_set]

        return sorted_found + missing

    def _get_enrichment_users_generic(
        self,
        smart_audience_id: UUID,
        select_columns: List[str],
        column_names: List[str],
        row_mapper: Callable[[dict], dict],
    ) -> List[dict]:
        self.client.command("SET max_query_size = 104857600")

        ids = self.postgres.get_person_asids_by_smart_aud_id(smart_audience_id)
        if not ids:
            return []

        ids.sort(key=lambda e: e["id"])
        asid_to_id_map = {entry["asid"]: entry["id"] for entry in ids}
        asids = list(asid_to_id_map.keys())
        in_list = ", ".join(f"'{asid}'" for asid in asids)

        sql = f"""
        SELECT 
            {", ".join(select_columns)}
        FROM enrichment_users
        WHERE asid IN ({in_list})
        """

        rows = self.client.query(sql)
        result_rows = [dict(zip(column_names, row)) for row in rows.result_rows]
        found_by_asid = {row["asid"]: row for row in result_rows}

        results = []
        for entry in ids:
            asid = entry["asid"]
            row = found_by_asid.get(asid)
            if row:
                row["audience_smart_person_id"] = entry["id"]
                results.append(row_mapper(row))
            else:
                empty_row = {col: None for col in column_names}
                empty_row["asid"] = asid
                empty_row["audience_smart_person_id"] = entry["id"]
                results.append(row_mapper(empty_row))

        return results

    def get_enrichment_users_for_delivery_validation(
        self, smart_audience_id: UUID
    ) -> List[dict]:
        select_columns = ["asid", "personal_email", "business_email"]
        column_names = ["asid", "personal_email", "business_email"]

        return self._get_enrichment_users_generic(
            smart_audience_id,
            select_columns=select_columns,
            column_names=column_names,
            row_mapper=lambda row: {
                "audience_smart_person_id": row["audience_smart_person_id"],
                "personal_email": row["personal_email"],
                "business_email": row["business_email"],
            },
        )

    def get_enrichment_users_for_postal_validation(
        self, smart_audience_id: UUID, validation_type: str
    ) -> List[dict]:
        if validation_type == "cas_home_address":
            prefix = "home_"
        elif validation_type == "cas_office_address":
            prefix = "business_"
        else:
            raise ValueError("Invalid validation type")

        select_columns = [
            "asid",
            f"{prefix}city AS city",
            f"{prefix}state AS state",
            f"{prefix}country AS country",
            f"{prefix}postal_code AS postal_code",
            f"{prefix}address_line_1 AS address",
        ]

        column_names = [
            "asid",
            "city",
            "state",
            "country",
            "postal_code",
            "address",
        ]

        return self._get_enrichment_users_generic(
            smart_audience_id,
            select_columns=select_columns,
            column_names=column_names,
            row_mapper=lambda row: {
                "audience_smart_person_id": row["audience_smart_person_id"],
                "postal_code": row["postal_code"],
                "country": row["country"],
                "city": row["city"],
                "state_name": row["state"],
                "address": row["address"],
            },
        )

    def get_enrichment_users_for_confirmation_validation(
        self, smart_audience_id: UUID
    ) -> List[dict]:
        select_columns = [
            "asid",
            "phone_mobile1",
            "phone_mobile2",
            "first_name",
            "middle_name",
            "last_name",
        ]
        column_names = select_columns

        return self._get_enrichment_users_generic(
            smart_audience_id,
            select_columns=select_columns,
            column_names=column_names,
            row_mapper=lambda row: {
                "audience_smart_person_id": row["audience_smart_person_id"],
                "phone_mobile1": row["phone_mobile1"],
                "phone_mobile2": row["phone_mobile2"],
                "full_name": " ".join(
                    filter(
                        None,
                        [
                            row["first_name"],
                            row["middle_name"],
                            row["last_name"],
                        ],
                    )
                ).strip(),
            },
        )

    def get_enrichment_users_for_job_validation(
        self, smart_audience_id: UUID
    ) -> List[dict]:
        select_columns = ["asid", "employment_json", "linkedin_url"]
        column_names = select_columns

        def job_mapper(row):
            employment_data = row.get("employment_json")
            selected_job = None
            if employment_data:
                try:
                    jobs = json.loads(employment_data)
                    current_jobs = [
                        j for j in jobs if j.get("end_date") is None
                    ]
                    selected_job = current_jobs[0] if current_jobs else None
                except Exception:
                    pass

            return {
                "audience_smart_person_id": row["audience_smart_person_id"],
                "job_title": selected_job.get("job_title")
                if selected_job
                else None,
                "company_name": selected_job.get("company_name")
                if selected_job
                else None,
                "linkedin_url": row["linkedin_url"],
            }

        return self._get_enrichment_users_generic(
            smart_audience_id,
            select_columns=select_columns,
            column_names=column_names,
            row_mapper=job_mapper,
        )

    def get_enrichment_users_for_free_validations(
        self, smart_audience_id: UUID, column_name: str
    ) -> List[dict]:
        select_columns = ["asid", column_name]
        column_names = ["asid", column_name]

        def mapper(row):
            val = row[column_name]
            return {
                "audience_smart_person_id": row["audience_smart_person_id"],
                column_name: val.isoformat()
                if isinstance(val, datetime)
                else val,
            }

        return self._get_enrichment_users_generic(
            smart_audience_id,
            select_columns=select_columns,
            column_names=column_names,
            row_mapper=mapper,
        )

    def check_access_for_user(self, user: dict) -> bool:
        return self.postgres.check_access_for_user(user)
