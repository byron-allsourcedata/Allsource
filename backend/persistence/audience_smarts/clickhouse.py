from typing import List, Callable
from typing_extensions import override
from uuid import UUID
import json
from datetime import datetime

from db_dependencies import Clickhouse
from persistence.audience_smarts.postgres import (
    AudienceSmartsPostgresPersistence,
)
from persistence.audience_smarts.dto import (
    PersonRecord,
    SyncedPersonRecord,
)
from resolver import injectable


@injectable
class AudienceSmartsClickhousePersistence:
    def __init__(
        self, client: Clickhouse, postgres: AudienceSmartsPostgresPersistence
    ):
        self.client = client
        self.postgres = postgres

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
        self.client.command("SET max_query_size = 104857600")

        ids = self.postgres.get_person_asids_by_smart_aud_id(
            smart_audience_id, sent_contacts
        )
        if not ids:
            return []

        if "asid" not in fields:
            fields = ["asid"] + fields

        cols = ", ".join(fields)

        sql = f"""
            SELECT {cols}
            FROM enrichment_users
            WHERE asid IN %(asids)s
            LIMIT {sent_contacts}
        """

        q = self.client.query(sql, parameters={"asids": ids})
        norm_rows = [self.squash_sequences(row) for row in q.result_rows]
        col_names = q.column_names

        try:
            asid_index = col_names.index("asid")
        except ValueError:
            raise RuntimeError("Missing 'asid' column in query result")

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
        ids = self.postgres.get_synced_person_asids(data_sync_id)
        if not ids:
            return []

        cols = ", ".join(enrichment_field_names)

        sql = f"""
            SELECT {cols}
            FROM enrichment_users
            WHERE asid IN %(asids)s
        """
        q = self.client.query(sql, parameters={"asids": ids})
        norm_rows = [self.squash_sequences(row) for row in q.result_rows]
        col_names = q.column_names

        return [
            SyncedPersonRecord(**dict(zip(col_names, row))) for row in norm_rows
        ]

    @override
    def sorted_enrichment_users_for_validation(
        self, ids: list[UUID], order_by_clause: str
    ) -> list[UUID]:
        self.client.command("SET max_query_size = 104857600")

        sql = f"""
        SELECT asid
        FROM enrichment_users
        WHERE asid IN %(ids)s
        ORDER BY {order_by_clause}
        """

        result = self.client.query(
            sql,
            parameters={"ids": ids},
        )

        sorted_found: list[UUID] = [row[0] for row in result.result_rows]

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

        ids = self.postgres.get_person_id_asids_by_smart_aud_id(
            smart_audience_id
        )
        if not ids:
            return []

        ids.sort(key=lambda e: e["id"])
        asid_to_id_map = {entry["asid"]: entry["id"] for entry in ids}
        asids = list(asid_to_id_map.keys())

        sql = f"""
        SELECT {", ".join(select_columns)}
        FROM enrichment_users
        WHERE asid IN %(asids)s
        """

        rows = self.client.query(sql, parameters={"asids": asids})
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
