from collections.abc import Sequence
import json
import logging
from datetime import datetime, timezone

import pytz
from sqlalchemy import desc, asc, or_, func, select, case, not_, cast
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm.query import RowReturningQuery

from enums import AudienceValidationMode
from db_dependencies import Db
from models import SubscriptionPlan, UserSubscriptions
from models.audience_smarts import AudienceSmart
from models.audience_lookalikes_persons import AudienceLookalikesPerson
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from models.audience_smarts_persons import AudienceSmartPerson
from models.audience_smarts_use_cases import AudienceSmartsUseCase
from models.audience_smarts_data_sources import AudienceSmartsDataSources
from models.audience_lookalikes import AudienceLookalikes
from models.audience_sources import AudienceSource
from models.audience_data_sync_imported_persons import (
    AudienceDataSyncImportedPersons,
)
from models.users import Users
from persistence.audience_smarts.dto import (
    AudienceSmartDTO,
)
from schemas.audience import DataSourcesFormat, RegeneretedAudienceSmart
from typing import Optional, Tuple, List, Any
from typing_extensions import override
from sqlalchemy.engine.row import Row
from uuid import UUID
from resolver import injectable

logger = logging.getLogger(__name__)


@injectable
class AudienceSmartsPostgresPersistence:
    def __init__(self, db: Db):
        self.db = db

    def get_use_case_id_by_alias(self, use_case_alias: str):
        use_case = (
            self.db.query(AudienceSmartsUseCase.id)
            .filter(AudienceSmartsUseCase.alias == use_case_alias)
            .first()
        )
        return use_case[0] if use_case else None

    @override
    def get_include_exclude_query(
        self,
        lookalike_include: Sequence[UUID] = (),
        lookalike_exclude: Sequence[UUID] = (),
        source_include: Sequence[UUID] = (),
        source_exclude: Sequence[UUID] = (),
    ) -> RowReturningQuery[tuple[UUID]]:
        include_conditions = [
            (
                AudienceLookalikesPerson,
                AudienceLookalikesPerson.lookalike_id,
                lookalike_include,
            ),
            (
                AudienceSourcesMatchedPerson,
                AudienceSourcesMatchedPerson.source_id,
                source_include,
            ),
        ]

        exclude_conditions = [
            (
                AudienceLookalikesPerson,
                AudienceLookalikesPerson.lookalike_id,
                lookalike_exclude,
            ),
            (
                AudienceSourcesMatchedPerson,
                AudienceSourcesMatchedPerson.source_id,
                source_exclude,
            ),
        ]

        include_union = None

        for model, field, values in include_conditions:
            if values:
                query = self.db.query(
                    model.enrichment_user_asid.label("enrichment_user_asid")
                ).filter(field.in_(values))
                if include_union is None:
                    include_union = query
                else:
                    include_union = include_union.union(query)

        if not include_union:
            raise RuntimeError("Includes in smart audience are empty")

        include_subq = include_union.subquery()
        final_query = self.db.query(include_subq.c.enrichment_user_asid)

        for model, field, values in exclude_conditions:
            if values:
                exclude_subq = (
                    self.db.query(
                        model.enrichment_user_asid.label("enrichment_user_asid")
                    )
                    .filter(field.in_(values))
                    .subquery()
                )
                final_query = final_query.outerjoin(
                    exclude_subq,
                    include_subq.c.enrichment_user_asid
                    == exclude_subq.c.enrichment_user_asid,
                ).filter(exclude_subq.c.enrichment_user_asid.is_(None))

        return final_query

    @override
    def _get_test_include_exclude_query(
        self,
        lookalike_include: Sequence[UUID] = (),
        lookalike_exclude: Sequence[UUID] = (),
        source_include: Sequence[UUID] = (),
        source_exclude: Sequence[UUID] = (),
    ) -> RowReturningQuery[tuple[UUID]]:
        result_ids = set()

        if lookalike_include:
            result_ids |= {
                row[0]
                for row in self.db.query(
                    AudienceLookalikesPerson.enrichment_user_asid
                )
                .filter(
                    AudienceLookalikesPerson.lookalike_id.in_(lookalike_include)
                )
                .all()
            }

        if source_include:
            result_ids |= {
                row[0]
                for row in self.db.query(
                    AudienceSourcesMatchedPerson.enrichment_user_asid
                )
                .filter(
                    AudienceSourcesMatchedPerson.source_id.in_(source_include)
                )
                .all()
            }

        if lookalike_exclude:
            exclude_ids = {
                row[0]
                for row in self.db.query(
                    AudienceLookalikesPerson.enrichment_user_asid
                )
                .filter(
                    AudienceLookalikesPerson.lookalike_id.in_(lookalike_exclude)
                )
                .all()
            }
            result_ids -= exclude_ids

        if source_exclude:
            exclude_ids = {
                row[0]
                for row in self.db.query(
                    AudienceSourcesMatchedPerson.enrichment_user_asid
                )
                .filter(
                    AudienceSourcesMatchedPerson.source_id.in_(source_exclude)
                )
                .all()
            }
            result_ids -= exclude_ids

        return result_ids

    def set_smart_audience_validations(self, validations, aud_smart_id):
        self.db.query(AudienceSmart).filter(
            AudienceSmart.id == aud_smart_id
        ).update(
            {AudienceSmart.validations: json.dumps(validations)},
            synchronize_session=False,
        )

    def update_failed_persons(self, failed_ids: List[UUID]):
        self.db.query(AudienceSmartPerson).filter(
            AudienceSmartPerson.id.in_(failed_ids)
        ).update(
            {"is_validation_processed": False, "is_valid": False},
            synchronize_session=False,
        )

    def update_success_persons(self, success_ids: List[UUID]):
        self.db.query(AudienceSmartPerson).filter(
            AudienceSmartPerson.id.in_(success_ids)
        ).update({"is_validation_processed": False}, synchronize_session=False)

    # =================================================================================

    def get_audience_smart_validations_by_id(self, aud_smart_id: UUID):
        audience_smart = (
            self.db.query(AudienceSmart.validations)
            .filter_by(id=str(aud_smart_id))
            .first()
        )
        return audience_smart.validations

    def get_validations_by_aud_smart_id(self, id: UUID) -> Tuple[List[Row]]:
        query = self.db.query(AudienceSmart.validations).filter(
            AudienceSmart.id == id
        )
        return query.first()

    # =================================================================================

    def calculate_smart_audience(self, data: DataSourcesFormat) -> int:
        query = self.get_include_exclude_query(
            lookalike_include=data["lookalike_ids"]["include"],
            lookalike_exclude=data["lookalike_ids"]["exclude"],
            source_include=data["source_ids"]["include"],
            source_exclude=data["source_ids"]["exclude"],
        )

        return query.count()

    def create_audience_smarts_data_sources(
        self,
        smart_audience_id: str,
        data_sources: List[dict],
    ) -> None:
        new_data_sources = []

        for source in data_sources:
            data_entry = AudienceSmartsDataSources(
                smart_audience_id=smart_audience_id,
                data_type=source["includeExclude"],
                source_id=source["selectedSourceId"]
                if source["sourceLookalike"] == "Source"
                else None,
                lookalike_id=source["selectedSourceId"]
                if source["sourceLookalike"] == "Lookalike"
                else None,
            )
            new_data_sources.append(data_entry)

        self.db.bulk_save_objects(new_data_sources)
        self.db.flush()

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
        validation_mode: AudienceValidationMode,
        need_validate: bool = False,
    ) -> AudienceSmartDTO:
        use_case_id = self.get_use_case_id_by_alias(use_case_alias)
        if not use_case_id:
            raise ValueError(
                f"Use case with alias '{use_case_alias}' not found."
            )

        new_audience = AudienceSmart(
            name=name,
            user_id=user_id,
            created_by_user_id=created_by_user_id,
            use_case_id=use_case_id,
            validations=validation_params if need_validate else json.dumps({}),
            total_records=total_records,
            target_schema=target_schema,
            validated_records=0,
            active_segment_records=active_segment_records,
            status=status,
            validation_mode=validation_mode.value,
        )

        self.db.add(new_audience)
        self.db.flush()

        self.create_audience_smarts_data_sources(new_audience.id, data_sources)

        self.db.commit()
        self.db.refresh(new_audience)

        return AudienceSmartDTO(
            id=new_audience.id,
            name=new_audience.name,
            created_at=new_audience.created_at,
            updated_at=new_audience.updated_at,
            user_id=new_audience.user_id,
            created_by_user_id=new_audience.created_by_user_id,
            total_records=new_audience.total_records,
            validated_records=new_audience.validated_records,
            active_segment_records=new_audience.active_segment_records,
            processed_active_segment_records=new_audience.processed_active_segment_records,
            status=new_audience.status,
            use_case_id=new_audience.use_case_id,
            validations=json.loads(new_audience.validations),
            target_schema=new_audience.target_schema,
            n_a=new_audience.validations == {},
        )

    def get_audience_smarts(
        self,
        user_id: int,
        page: int,
        per_page: int,
        from_date: Optional[int] = None,
        to_date: Optional[int] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
        search_query: Optional[str] = None,
        statuses: Optional[List[str]] = None,
        use_cases: Optional[List[str]] = None,
    ) -> Tuple[List[Row], int]:
        query = (
            self.db.query(
                AudienceSmart.id,
                AudienceSmart.name,
                AudienceSmartsUseCase.alias,
                Users.full_name,
                AudienceSmart.created_at,
                AudienceSmart.total_records,
                AudienceSmart.validated_records,
                AudienceSmart.active_segment_records,
                AudienceSmart.status,
                AudienceSmartsUseCase.integrations,
                AudienceSmart.processed_active_segment_records,
                AudienceSmart.validations,
                AudienceSmart.target_schema,
                AudienceSmart.validations_step_size,
                AudienceSmart.validations_step_processed,
                AudienceSmart.validations_step_start_time,
                AudienceSmart.validation_mode,
            )
            .join(Users, Users.id == AudienceSmart.created_by_user_id)
            .join(
                AudienceSmartsUseCase,
                AudienceSmartsUseCase.id == AudienceSmart.use_case_id,
            )
            .filter(AudienceSmart.user_id == user_id)
        )

        if statuses:
            query = query.filter(AudienceSmart.status.in_(statuses))

        if use_cases:
            query = query.filter(AudienceSmartsUseCase.alias.in_(use_cases))

        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)

            query = query.filter(
                AudienceSmart.created_at >= start_date,
                AudienceSmart.created_at <= end_date,
            )

        if search_query:
            query = query.filter(
                or_(
                    AudienceSmart.name.ilike(f"%{search_query}%"),
                    Users.full_name.ilike(f"%{search_query}%"),
                )
            )

        sort_options = {
            "number_of_customers": AudienceSmart.total_records,
            "created_date": AudienceSmart.created_at,
            "active_segment_records": AudienceSmart.active_segment_records,
        }
        if sort_by in sort_options:
            sort_column = sort_options[sort_by]
            query = query.order_by(
                asc(sort_column) if sort_order == "asc" else desc(sort_column),
            )
        else:
            query = query.order_by(AudienceSmart.created_at.desc())

        offset = (page - 1) * per_page
        smarts = query.limit(per_page).offset(offset).all()
        count = query.count()

        return smarts, count

    def get_datasources_by_aud_smart_id(self, id: UUID) -> Tuple[List[Row]]:
        query = (
            self.db.query(
                AudienceSmartsDataSources.data_type,
                AudienceLookalikes.name.label("lookalike_name"),
                AudienceLookalikes.size.label("lookalike_size"),
                AudienceSource.name.label("source_name"),
                AudienceSource.source_type,
                AudienceSource.matched_records,
            )
            .select_from(AudienceSmart)
            .join(
                AudienceSmartsDataSources,
                AudienceSmartsDataSources.smart_audience_id == AudienceSmart.id,
            )
            .outerjoin(
                AudienceLookalikes,
                AudienceSmartsDataSources.lookalike_id == AudienceLookalikes.id,
            )
            .outerjoin(
                AudienceSource,
                (AudienceSmartsDataSources.source_id == AudienceSource.id)
                | (AudienceLookalikes.source_uuid == AudienceSource.id),
            )
            .filter(AudienceSmart.id == id)
        )
        return query.all()

    def search_audience_smart(self, start_letter: str, user_id: int):
        query = (
            self.db.query(AudienceSmart.name, Users.full_name)
            .join(Users, Users.id == AudienceSmart.created_by_user_id)
            .filter(AudienceSmart.user_id == user_id)
        )

        if start_letter:
            query = query.filter(
                or_(
                    AudienceSmart.name.ilike(f"{start_letter}%"),
                    Users.full_name.ilike(f"{start_letter}%"),
                )
            )

        smarts = query.all()
        return smarts

    def delete_audience_smart(self, id: int) -> int:
        deleted_count = (
            self.db.query(AudienceSmart).filter(AudienceSmart.id == id).delete()
        )
        self.db.commit()
        return deleted_count

    def update_audience_smart(self, id, new_name) -> int:
        updated_count = (
            self.db.query(AudienceSmart)
            .filter(AudienceSmart.id == id)
            .update({AudienceSmart.name: new_name}, synchronize_session=False)
        )
        self.db.commit()
        return updated_count

    def set_data_syncing_status(self, id, status) -> int:
        updated_count = (
            self.db.query(AudienceSmart)
            .filter(AudienceSmart.id == id)
            .update({AudienceSmart.status: status}, synchronize_session=False)
        )
        self.db.commit()
        return updated_count

    def get_processing_smarts(
        self, id
    ):  #############################################################
        query = (
            self.db.query(
                AudienceSmart.id,
                AudienceSmart.name,
                AudienceSmartsUseCase.alias,
                Users.full_name,
                AudienceSmart.created_at,
                AudienceSmart.total_records,
                AudienceSmart.validated_records,
                AudienceSmart.active_segment_records,
                AudienceSmart.processed_active_segment_records,
                AudienceSmart.status,
                AudienceSmart.validations,
                AudienceSmart.target_schema,
                AudienceSmart.validations_step_size,
                AudienceSmart.validations_step_processed,
                AudienceSmart.validations_step_start_time,
            )
            .join(Users, Users.id == AudienceSmart.created_by_user_id)
            .join(
                AudienceSmartsUseCase,
                AudienceSmartsUseCase.id == AudienceSmart.use_case_id,
            )
            .filter(AudienceSmart.id == id)
        ).first()
        return query

    def get_person_asids_by_smart_aud_id(
        self, smart_audience_id: UUID, limit: int
    ) -> List[UUID]:
        return [
            row[0]
            for row in (
                self.db.query(AudienceSmartPerson.enrichment_user_asid)
                .filter(
                    AudienceSmartPerson.smart_audience_id == smart_audience_id,
                    AudienceSmartPerson.is_valid == True,
                )
                .limit(limit)
                .all()
            )
        ]

    def get_smart_for_regenerate(self, smart_id: UUID):
        rows = (
            self.db.query(
                AudienceSmart.id,
                AudienceSmart.name,
                AudienceSmart.total_records,
                AudienceSmart.active_segment_records,
                AudienceSmart.validated_records,
                AudienceSmart.validations,
                AudienceSmartsUseCase.alias.label("use_case_alias"),
                AudienceSmartsDataSources.data_type,
                AudienceSmartsDataSources.source_id,
                AudienceSmartsDataSources.lookalike_id,
                Users.id.label("user_id"),
                Users.full_name.label("full_name"),
                AudienceSmart.created_by_user_id,
                AudienceSmart.created_at,
                AudienceSmart.status,
                AudienceSmart.target_schema,
            )
            .join(Users, Users.id == AudienceSmart.created_by_user_id)
            .join(
                AudienceSmartsUseCase,
                AudienceSmartsUseCase.id == AudienceSmart.use_case_id,
            )
            .outerjoin(
                AudienceSmartsDataSources,
                AudienceSmartsDataSources.smart_audience_id == AudienceSmart.id,
            )
            .filter(AudienceSmart.id == str(smart_id))
            .all()
        )

        if not rows:
            return None

        first = rows[0]
        data_sources = []
        for r in rows:
            if r.data_type and (r.source_id or r.lookalike_id):
                data_sources.append(
                    {
                        "includeExclude": r.data_type,
                        "selectedSourceId": r.source_id or r.lookalike_id,
                        "sourceLookalike": "Source"
                        if r.source_id
                        else "Lookalike",
                        "useCase": first.use_case_alias,
                    }
                )

        return {
            "id": first.id,
            "name": first.name,
            "total_records": first.total_records,
            "active_segment_records": first.active_segment_records,
            "validated_records": first.validated_records,
            "validations": json.loads(first.validations)
            if first.validations
            else [],
            "use_case_alias": first.use_case_alias,
            "user_id": first.user_id,
            "full_name": first.full_name,
            "created_by_user_id": first.created_by_user_id,
            "created_at": first.created_at,
            "status": first.status,
            "target_schema": first.target_schema,
            "data_sources": data_sources,
        }

    def get_person_id_asids_by_smart_aud_id(
        self, smart_audience_id: UUID
    ) -> List[dict]:
        return [
            {"id": row[0], "asid": row[1]}
            for row in (
                self.db.query(
                    AudienceSmartPerson.id,
                    AudienceSmartPerson.enrichment_user_asid,
                )
                .filter(
                    AudienceSmartPerson.smart_audience_id == smart_audience_id,
                    AudienceSmartPerson.is_valid == True,
                )
                .order_by(AudienceSmartPerson.sort_order)
                .all()
            )
        ]

    def get_person_id_asids_by_smart_aud_id(
        self, smart_audience_id: UUID
    ) -> List[dict]:
        processed_exists = func.jsonb_path_exists(
            cast(AudienceSmart.validations, JSONB),
            "$.** ? (@.processed == true)",
        )

        valid_condition = or_(
            AudienceSmart.validation_mode != "any", not_(processed_exists)
        )

        rows = (
            self.db.query(
                AudienceSmartPerson.id,
                AudienceSmartPerson.enrichment_user_asid,
            )
            .join(
                AudienceSmart,
                AudienceSmart.id == AudienceSmartPerson.smart_audience_id,
            )
            .filter(
                AudienceSmartPerson.smart_audience_id == smart_audience_id,
                AudienceSmartPerson.is_valid == valid_condition,
            )
            .order_by(AudienceSmartPerson.sort_order)
            .all()
        )
        return [{"id": row[0], "asid": row[1]} for row in rows]

    def get_synced_person_asids(self, data_sync_id: int) -> List[UUID]:
        return [
            row[0]
            for row in (
                self.db.query(
                    AudienceDataSyncImportedPersons.enrichment_user_asid
                )
                .filter(
                    AudienceDataSyncImportedPersons.data_sync_id == data_sync_id
                )
                .all()
            )
        ]

    def check_access_for_user(self, user: dict) -> bool:
        restricted_plans = ["free_trial_monthly", "basic"]
        subscription = (
            self.db.query(SubscriptionPlan)
            .join(
                UserSubscriptions,
                UserSubscriptions.plan_id == SubscriptionPlan.id,
            )
            .filter(UserSubscriptions.id == user["current_subscription_id"])
            .first()
        )

        return subscription.alias not in restricted_plans

    def get_matching_info(self, smart_audience_id: UUID):
        return (
            self.db.query(AudienceSmart.status, AudienceSmart.validated_records)
            .filter_by(id=str(smart_audience_id))
            .one_or_none()
        )._asdict()

    def get_validation_temp_counts(self, smart_audience_id: UUID):
        return self.db.execute(
            select(
                func.count(AudienceSmartPerson.id).label("total_count"),
                func.count(
                    case((AudienceSmartPerson.is_valid.is_(True), 1))
                ).label("total_valid"),
                func.count(
                    case(
                        (
                            AudienceSmartPerson.is_validation_processed.is_(
                                False
                            ),
                            1,
                        )
                    )
                ).label("count_processed"),
            ).where(AudienceSmartPerson.smart_audience_id == smart_audience_id)
        ).one()

    def get_problematic_smart_audiences(
        self, min_records_threshold: int
    ) -> list[dict[str, Any]]:
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        rows = (
            self.db.query(
                AudienceSmart.id,
                AudienceSmart.name,
                AudienceSmart.user_id,
                Users.email,
                AudienceSmart.created_at,
                AudienceSmart.status,
                AudienceSmart.active_segment_records,
            )
            .join(Users, Users.id == AudienceSmart.user_id)
            .filter(
                or_(
                    AudienceSmart.status.in_(
                        ["n_a", "data_syncing", "validating"]
                    ),
                    AudienceSmart.active_segment_records
                    < min_records_threshold,
                )
            )
            .all()
        )

        results: List[dict[str, Any]] = []
        for row in rows:
            minutes_passed = int((now - row.created_at).total_seconds() // 60)

            results.append(
                {
                    "id": row.id,
                    "name": row.name,
                    "user_id": row.user_id,
                    "email": row.email,
                    "active_segment_records": row.active_segment_records,
                    "created": row.created_at,
                    "minutes_passed": minutes_passed,
                    "status": row.status,
                }
            )

        return results
