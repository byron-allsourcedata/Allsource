import csv
from datetime import datetime, timezone
import io
import json
import logging
from collections.abc import Sequence
from typing import Optional, List, Dict
from uuid import UUID

from sqlalchemy.orm.query import RowReturningQuery

from config.rmq_connection import (
    RabbitMQConnection,
    publish_rabbitmq_message_with_channel,
)
from enums import AudienceSmartDataSource, QueueName
from enums import AudienceSmartStatuses
from models.users import User
from persistence.audience_lookalikes import AudienceLookalikesPersistence
from persistence.audience_settings import AudienceSettingPersistence
from persistence.audience_smarts import AudienceSmartsPersistence
from persistence.audience_sources import AudienceSourcesPersistence
from resolver import injectable
from schemas.audience import (
    SmartsAudienceObjectResponse,
    DataSourcesFormat,
    DataSourcesResponse,
    SmartsResponse,
    ValidationHistory,
    SmartsProgress,
)
from schemas.audience_smart import AccessCheckResponse, SmartMatchingInfo
from utils import to_snake_case

logger = logging.getLogger(__name__)

STEP_CATEGORY_MAP = {
    "personal_email": "Personal Email",
    "business_email": "Business Email",
    "phone": "Phone",
    "postal_cas_verification": "Postal Address",
    "linked_in": "LinkedIn",
}


@injectable
class AudienceSmartsService:
    VALID_DAYS = {30, 60, 90}
    GENDER_MAPPDING = {0: "male", 1: "female", 2: "unknown"}

    def __init__(
        self,
        audience_smarts_persistence: AudienceSmartsPersistence,
        lookalikes_persistence_service: AudienceLookalikesPersistence,
        audience_sources_persistence: AudienceSourcesPersistence,
        audience_settings_persistence: AudienceSettingPersistence,
    ):
        self.audience_smarts_persistence = audience_smarts_persistence
        self.lookalikes_persistence_service = lookalikes_persistence_service
        self.audience_sources_persistence = audience_sources_persistence
        self.audience_settings_persistence = audience_settings_persistence

    def get_audience_smarts(
        self,
        user: User,
        page: int,
        per_page: int,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
        from_date: Optional[int] = None,
        to_date: Optional[int] = None,
        search_query: Optional[str] = None,
        statuses: Optional[List[str]] = None,
        use_cases: Optional[List[str]] = None,
    ) -> SmartsAudienceObjectResponse:
        audience_smarts, count = (
            self.audience_smarts_persistence.get_audience_smarts(
                user_id=user.get("id"),
                page=page,
                per_page=per_page,
                sort_by=sort_by,
                sort_order=sort_order,
                from_date=from_date,
                to_date=to_date,
                search_query=search_query,
                statuses=statuses,
                use_cases=use_cases,
            )
        )

        audience_smarts_list = []
        for item in audience_smarts:
            integrations = json.loads(item[9]) if item[9] else []

            progress_dict = self.compute_eta(
                step_size_json=item[13],
                step_processed_json=item[14],
                step_start_time_json=item[15],
            )
            audience_smarts_list.append(
                {
                    "id": item[0],
                    "name": item[1],
                    "use_case_alias": item[2],
                    "created_by": item[3],
                    "created_at": item[4],
                    "total_records": item[5],
                    "validated_records": item[6],
                    "active_segment_records": item[7],
                    "status": item[8],
                    "integrations": integrations,
                    "processed_active_segment_records": item[10],
                    "n_a": item[11] == "{}",
                    "target_schema": item[12],
                    "progress_info": progress_dict,
                }
            )

        return audience_smarts_list, count

    def search_audience_smart(self, start_letter: str, user: User):
        smarts = self.audience_smarts_persistence.search_audience_smart(
            user_id=user.get("id"), start_letter=start_letter
        )
        results = set()
        for smart_audience_name, creator_name in smarts:
            if start_letter.lower() in smart_audience_name.lower():
                results.add(smart_audience_name)
            if start_letter.lower() in creator_name.lower():
                results.add(creator_name)

        limited_results = list(results)[:10]
        return limited_results

    def delete_audience_smart(self, id: UUID) -> bool:
        count_deleted = self.audience_smarts_persistence.delete_audience_smart(
            id
        )
        return count_deleted > 0

    def _compute_step_eta(
        self,
        size: int,
        processed: int,
        start_iso: str | None,
        now: datetime,
    ) -> (int | None, float | None):
        """
        Helper function for calculating ETA and step progress.
        """
        if not (start_iso and processed > 0 and processed < size):
            return None, None

        try:
            start_dt = datetime.fromisoformat(start_iso)
            if start_dt.tzinfo is None:
                start_dt = start_dt.replace(tzinfo=timezone.utc)

            elapsed = (now - start_dt).total_seconds()
            if elapsed <= 0:
                return None, None

            speed = processed / elapsed
            if speed <= 0:
                return None, None

            eta_seconds = int((size - processed) / speed)
            total_time = elapsed + eta_seconds
            time_progress = min(1.0, elapsed / total_time)
            return eta_seconds, time_progress

        except Exception:
            return None, None

    def compute_eta(
        self,
        step_size_json: Optional[str],
        step_processed_json: Optional[str],
        step_start_time_json: Optional[str],
    ) -> SmartsProgress:
        """
        Args:
            step_size_json
            step_processed_json
            step_start_time_json

        Returns:
            dict SmartsProgress:
            {
              "completed_steps": int,
              "total_steps": int,
              "current_step_index": int,
              "current_step_key": Optional[str],
              "eta_seconds": Optional[int],
            }
        """
        now = datetime.now(timezone.utc)

        step_size: Dict[str, int] = json.loads(step_size_json or "{}")
        step_processed: Dict[str, int] = json.loads(step_processed_json or "{}")
        step_start_time: Dict[str, Optional[str]] = json.loads(
            step_start_time_json or "{}"
        )

        steps: List[str] = list(step_size.keys())

        if not steps:
            return SmartsProgress(
                completed_steps=0,
                total_steps=0,
                current_step_index=0,
                current_step_key=None,
                current_step_name=None,
                eta_seconds=None,
                time_progress=None,
            )

        completed_steps = 0
        current_step_key: Optional[str] = None

        for key in steps:
            size = int(step_size.get(key, 0) or 0)
            processed = int(step_processed.get(key, 0) or 0)
            if size == 0 or processed >= size:
                completed_steps += 1
            else:
                current_step_key = key
                break

        total_steps = len(steps)

        if current_step_key is None:
            return SmartsProgress(
                completed_steps=completed_steps,
                total_steps=total_steps,
                current_step_index=total_steps,
                current_step_key=None,
                current_step_name=None,
                eta_seconds=None,
                time_progress=None,
            )

        current_step_index = completed_steps + 1

        size = int(step_size.get(current_step_key, 0) or 0)
        processed = int(step_processed.get(current_step_key, 0) or 0)
        start_iso = step_start_time.get(current_step_key)

        eta_seconds, time_progress = self._compute_step_eta(
            size=size,
            processed=processed,
            start_iso=start_iso,
            now=now,
        )

        def humanize_step_name(step_key: Optional[str]) -> Optional[str]:
            if not step_key:
                return None
            category, *_ = step_key.split("-", 1)
            return STEP_CATEGORY_MAP.get(
                category, category.replace("_", " ").title()
            )

        return SmartsProgress(
            completed_steps=completed_steps,
            total_steps=total_steps,
            current_step_index=current_step_index,
            current_step_key=current_step_key,
            current_step_name=humanize_step_name(current_step_key),
            eta_seconds=eta_seconds,
            time_progress=time_progress,
        )

    # def estimates_predictable_validation(
    #     self, validations: List[str]
    # ) -> Dict[str, float]:
    #     stats = (
    #         self.audience_settings_persistence.get_average_success_validations()
    #     )
    #     product = 1.0
    #     for key in validations:
    #         product *= stats.get(key, 1.0)

    #     return product

    def estimates_predictable_validation(
        self, validations: List[str]
    ) -> Dict[str, float]:
        stats_raw = self.audience_settings_persistence.get_stats_validations()
        stats = json.loads(stats_raw.value) if stats_raw else {}

        product = 1.0
        for key in validations:
            vstat = stats.get(key, {})
            valid = vstat.get("valid_count", 1.0)
            total = vstat.get("total_count", 1.0)
            product *= valid / total

        return product

    # def calculate_validation_cost(
    #     self, count_active_segment: int, validations: List[str]
    # ) -> float:
    #     stats = self.audience_settings_persistence.get_cost_validations()
    #     costs = 0
    #     for key in validations:
    #         costs += count_active_segment * stats.get(key, 1.0)

    #     return round(costs, 2)

    def calculate_validation_cost(
        self, count_active_segment: int, validations: List[str]
    ) -> float:
        costs_raw = self.audience_settings_persistence.get_cost_validations()
        cost_map = costs_raw or {}

        stats_raw = self.audience_settings_persistence.get_stats_validations()
        stats = json.loads(stats_raw.value) if stats_raw else {}

        priority_row = (
            self.audience_settings_persistence.get_validation_priority()
        )
        priority_order = priority_row.split(",") if priority_row else []

        validations_sorted = sorted(
            validations,
            key=lambda x: priority_order.index(x)
            if x in priority_order
            else len(priority_order) + validations.index(x),
        )

        current_cnt = float(count_active_segment)
        total_cost = 0.0

        for key in validations_sorted:
            total_cost += current_cnt * cost_map.get(key, 1.0)

            vstat = stats.get(key, {})
            valid = vstat.get("valid_count", 1.0)
            total = vstat.get("total_count", 1.0)
            current_cnt *= valid / total

        return round(total_cost, 2)

    def update_audience_smart(self, id: UUID, new_name: str) -> bool:
        count_updated = self.audience_smarts_persistence.update_audience_smart(
            id, new_name
        )
        return count_updated > 0

    def set_data_syncing_status(self, id: UUID) -> bool:
        count_updated = (
            self.audience_smarts_persistence.set_data_syncing_status(
                id, AudienceSmartStatuses.DATA_SYNCING.value
            )
        )
        return count_updated > 0

    def transform_datasource(self, raw_data: dict) -> DataSourcesFormat:
        data_sources = {
            "lookalike_ids": {"include": [], "exclude": []},
            "source_ids": {"include": [], "exclude": []},
            "use_case": None,
        }

        for item in raw_data:
            key = (
                "lookalike_ids"
                if item["sourceLookalike"] == "Lookalike"
                else "source_ids"
            )
            include_exclude = (
                "include" if item["includeExclude"] == "include" else "exclude"
            )
            data_sources["use_case"] = item["useCase"].lower()
            data_sources[key][include_exclude].append(item["selectedSourceId"])

        return data_sources

    async def start_scripts_for_matching(
        self,
        aud_smart_id: UUID,
        user_id: int,
        need_validate: bool,
        data_sources: dict,
        active_segment_records: int,
        validation_params: dict,
    ):
        queue_name = QueueName.AUDIENCE_SMARTS_FILLER.value
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        data = {
            "aud_smart_id": str(aud_smart_id),
            "user_id": user_id,
            "need_validate": need_validate,
            "data_sources": self.transform_datasource(data_sources),
            "active_segment": active_segment_records,
            "validation_params": validation_params,
        }

        try:
            message_body = {"data": data}
            await publish_rabbitmq_message_with_channel(
                channel=channel,
                queue_name=queue_name,
                message_body=message_body,
            )
        except Exception as e:
            logger.error(
                f"Failed to publish message to {queue_name}. Error: {e}"
            )
        finally:
            await rabbitmq_connection.close()

    def validate_recency_days(self, days: int):
        if days not in self.VALID_DAYS:
            raise ValueError(f"Invalid recency days: {days}.")

    async def create_audience_smart(
        self,
        name: str,
        user_id: int,
        user_full_name: str,
        created_by_user_id: int,
        use_case_alias: str,
        data_sources: List[dict],
        validation_params: Optional[dict],
        active_segment_records: int,
        total_records: int,
        target_schema: str,
        is_validate_skip: Optional[bool] = None,
        contacts_to_validate: Optional[int] = None,
    ) -> SmartsResponse:
        need_validate = False
        if is_validate_skip:
            status = AudienceSmartStatuses.UNVALIDATED.value
        elif not contacts_to_validate:
            status = AudienceSmartStatuses.N_A.value
        else:
            need_validate = True
            status = AudienceSmartStatuses.VALIDATING.value

        if validation_params:
            for key in validation_params.keys():
                for item in validation_params[key]:
                    if "recency" in item:
                        self.validate_recency_days(item["recency"]["days"])
                        item["recency"]["processed"] = False
                    else:
                        for sub_key in item.keys():
                            item[sub_key]["processed"] = False

        created_data = self.audience_smarts_persistence.create_audience_smart(
            name=name,
            user_id=user_id,
            created_by_user_id=created_by_user_id,
            use_case_alias=use_case_alias,
            validation_params=json.dumps(validation_params),
            data_sources=data_sources,
            active_segment_records=active_segment_records,
            total_records=total_records,
            target_schema=target_schema,
            status=status,
            need_validate=need_validate,
        )
        await self.start_scripts_for_matching(
            created_data.id,
            user_id,
            need_validate,
            data_sources,
            active_segment_records,
            validation_params,
        )

        return SmartsResponse(
            id=created_data.id,
            name=created_data.name,
            use_case_alias=use_case_alias,
            created_by=user_full_name,
            created_at=created_data.created_at,
            total_records=created_data.total_records,
            validated_records=created_data.validated_records,
            active_segment_records=created_data.active_segment_records,
            processed_active_segment_records=created_data.processed_active_segment_records,
            status=created_data.status,
            integrations=None,
            n_a=created_data.n_a,
        )

    def calculate_smart_audience(self, raw_data_sources: dict) -> int:
        transformed_data_source = self.transform_datasource(raw_data_sources)
        return self.audience_smarts_persistence.calculate_smart_audience(
            transformed_data_source
        )

    def get_include_exclude_query(
        self,
        lookalike_include: Sequence[UUID],
        lookalike_exclude: Sequence[UUID],
        source_include: Sequence[UUID],
        source_exclude: Sequence[UUID],
    ) -> RowReturningQuery[tuple[UUID]]:
        return self.audience_smarts_persistence.get_include_exclude_query(
            lookalike_include, lookalike_exclude, source_include, source_exclude
        )

    def _get_test_include_exclude_query(
        self,
        lookalike_include: Sequence[UUID],
        lookalike_exclude: Sequence[UUID],
        source_include: Sequence[UUID],
        source_exclude: Sequence[UUID],
    ) -> RowReturningQuery[tuple[UUID]]:
        return self.audience_smarts_persistence._get_test_include_exclude_query(
            lookalike_include, lookalike_exclude, source_include, source_exclude
        )

    def get_datasources_by_aud_smart_id(self, id: UUID) -> DataSourcesResponse:
        data_sources = (
            self.audience_smarts_persistence.get_datasources_by_aud_smart_id(id)
        )
        includes = []
        excludes = []

        for data_source in data_sources:
            source_data = {
                "name": data_source.lookalike_name or data_source.source_name,
                "source_type": data_source.source_type,
                "size": data_source.lookalike_size
                if data_source.lookalike_name
                else data_source.matched_records,
            }

            if data_source.data_type == AudienceSmartDataSource.INCLUDE.value:
                includes.append(source_data)
            elif data_source.data_type == AudienceSmartDataSource.EXCLUDE.value:
                excludes.append(source_data)

        return {"includes": includes, "excludes": excludes}

    def get_validations_by_aud_smart_id(
        self, id: UUID
    ) -> List[Dict[str, ValidationHistory]]:
        raw_validations_obj = (
            self.audience_smarts_persistence.get_validations_by_aud_smart_id(id)
        )
        validation_priority = (
            self.audience_settings_persistence.get_validation_priority()
        )

        priority_order = (
            validation_priority.split(",") if validation_priority else []
        )

        parsed_validations = json.loads(raw_validations_obj.validations)

        result = []

        for key, value in parsed_validations.items():
            if len(value):
                for item in value:
                    for subkey in item.keys():
                        count_submited = item[subkey].get("count_submited", 0)
                        count_validated = item[subkey].get("count_validated", 0)
                        count_cost = item[subkey].get("count_cost", 0)

                        if subkey == "recency":
                            subkey_with_param = (
                                "recency "
                                + str(item[subkey].get("days"))
                                + " days"
                            )
                        else:
                            subkey_with_param = subkey

                        result.append(
                            {
                                "key": f"{key}-{subkey}",
                                "validation": {
                                    "type_validation": subkey_with_param,
                                    "count_submited": count_submited,
                                    "count_validated": count_validated,
                                    "count_cost": count_cost,
                                },
                            }
                        )

        result.sort(
            key=lambda x: priority_order.index(x["key"])
            if x["key"] in priority_order
            else len(priority_order)
        )

        return [{item["key"]: item["validation"]} for item in result]

    def check_access(self, user: dict) -> AccessCheckResponse:
        allowed = self.audience_smarts_persistence.check_access_for_user(user)
        return AccessCheckResponse(allowed=allowed)

    def get_datasource(self, user: dict):
        lookalikes = self.lookalikes_persistence_service.get_processed_lookalikes_by_user(
            user_id=user.get("id")
        )

        sources = (
            self.audience_sources_persistence.get_completed_sources_by_user(
                user_id=user.get("id")
            )
        )

        source_list = [
            {
                "id": s[0],
                "name": s[1],
                "source_type": s[3],
                "source_origin": s[4],
                "domain": s[7],
                "matched_records": s[9],
            }
            for s in sources
        ]

        return {"lookalikes": lookalikes, "sources": source_list}

    def download_persons(self, smart_audience_id, sent_contacts, data_map):
        types = [contact.type for contact in data_map]
        values = [contact.value for contact in data_map]
        leads = self.audience_smarts_persistence.get_persons_by_smart_aud_id(
            smart_audience_id, sent_contacts, types
        )

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(values)

        for lead in leads:
            relevant_data = [
                self.GENDER_MAPPDING.get(
                    getattr(lead, field, ""), getattr(lead, field, "")
                )
                if field == "gender"
                else getattr(lead, field, "")
                for field in types
            ]
            writer.writerow(relevant_data)

        output.seek(0)
        return output

    def download_synced_persons(self, data_sync_id):
        headers = [
            "First Name",
            "Middle Name",
            "Last Name",
            "Phone Mobile1",
            "Phone Mobile2",
            "Linkedin url",
            "Business Email",
            "Personal Email",
            "Other Emails",
            "Business Email Last Seen Date",
            "Personal Email Last Seen",
            "Mobile Phone DNC",
        ]
        fields = [to_snake_case(h) for h in headers]

        persons = (
            self.audience_smarts_persistence.get_synced_persons_by_smart_aud_id(
                data_sync_id, fields
            )
        )

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)

        for lead in persons:
            relevant_data = [getattr(lead, field, "") for field in fields]
            writer.writerow(relevant_data)

        output.seek(0)
        return output

    def get_processing_smarts(self, id: str) -> Optional[SmartsResponse]:
        smart_source = self.audience_smarts_persistence.get_processing_smarts(
            id
        )
        if not smart_source:
            return None

        (
            source_id,
            name,
            use_case_alias,
            created_by,
            created_at,
            total_records,
            validated_records,
            active_segment_records,
            processed_active_segment_records,
            status,
            validations,
            target_schema,
            step_size,
            step_processed,
            step_start_time,
        ) = smart_source

        progress_dict = self.compute_eta(
            step_size_json=step_size,
            step_processed_json=step_processed,
            step_start_time_json=step_start_time,
        )

        return SmartsResponse(
            id=source_id,
            name=name,
            use_case_alias=use_case_alias,
            created_by=created_by,
            created_at=created_at,
            total_records=total_records,
            validated_records=validated_records,
            active_segment_records=active_segment_records,
            processed_active_segment_records=processed_active_segment_records,
            status=status,
            integrations=None,
            n_a=validations == "{}",
            target_schema=target_schema,
            progress_info=progress_dict,
        )

    def get_enrichment_users_for_job_validation(self, smart_audience_id: UUID):
        return self.audience_smarts_persistence.get_enrichment_users_for_job_validation(
            smart_audience_id
        )

    def get_enrichment_users_for_delivery_validation(
        self, smart_audience_id: UUID
    ):
        return self.audience_smarts_persistence.get_enrichment_users_for_delivery_validation(
            smart_audience_id
        )

    def get_enrichment_users_for_postal_validation(
        self, smart_audience_id: UUID, validation_type: str
    ):
        return self.audience_smarts_persistence.get_enrichment_users_for_postal_validation(
            smart_audience_id, validation_type
        )

    def get_enrichment_users_for_confirmation_validation(
        self, smart_audience_id: UUID
    ):
        return self.audience_smarts_persistence.get_enrichment_users_for_confirmation_validation(
            smart_audience_id
        )

    def get_enrichment_users_for_free_validations(
        self, smart_audience_id: UUID, column_name: str
    ):
        return self.audience_smarts_persistence.get_enrichment_users_for_free_validations(
            smart_audience_id, column_name
        )

    def sorted_enrichment_users_for_validation(
        self, persons: List[UUID], order_by_clause: str
    ):
        return self.audience_smarts_persistence.sorted_enrichment_users_for_validation(
            persons, order_by_clause
        )

    def get_audience_smart_validations_by_id(
        self,
        smart_audience_id: UUID,
    ):
        return self.audience_smarts_persistence.get_audience_smart_validations_by_id(
            smart_audience_id
        )

    def get_smart_for_regenerate(
        self,
        smart_audience_id: UUID,
    ):
        return self.audience_smarts_persistence.get_smart_for_regenerate(
            smart_audience_id
        )

    def get_matching_info(self, id: UUID):
        return SmartMatchingInfo(
            **self.audience_smarts_persistence.get_matching_info(id)
        )

    def update_stats_validations(
        self,
        validation_type: str,
        count_persons_before_validation: int,
        count_valid_persons: int,
    ):
        new_data = {
            "total_count": count_persons_before_validation,
            "valid_count": count_valid_persons,
        }
        stats = self.audience_settings_persistence.get_stats_validations()
        stats = json.loads(stats.value) if stats else {}

        if stats:
            current = stats.get(
                validation_type, {"total_count": 0, "valid_count": 0}
            )

            updated_data = {
                "total_count": current.get("total_count")
                + new_data["total_count"],
                "valid_count": current.get("valid_count")
                + new_data["valid_count"],
            }

            stats[validation_type] = updated_data
            self.audience_settings_persistence.upsert_stats_validations(stats)

        else:
            self.audience_settings_persistence.set_stats_item_validations(
                {validation_type: new_data}
            )
