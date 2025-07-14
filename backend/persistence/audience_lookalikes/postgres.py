from datetime import datetime, timezone
from decimal import Decimal

import pytz

from db_dependencies import Db
from enums import LookalikeSize, BusinessType
from models.enrichment import (
    EnrichmentPersonalProfiles,
    EnrichmentFinancialRecord,
    EnrichmentLifestyle,
    EnrichmentVoterRecord,
    EnrichmentProfessionalProfile,
    EnrichmentEmploymentHistory,
)
from models.audience_sources import AudienceSource
from models.audience_lookalikes import AudienceLookalikes
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from models.enrichment.enrichment_users import EnrichmentUser
from models.users_domains import UserDomains
from typing import Optional, List, Dict, Any
import math
from sqlalchemy import asc, desc, or_, func, select, update
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from urllib.parse import unquote

from uuid import UUID

from models.users import Users
from .interface import (
    AudienceLookalikesPersistenceInterface,
)
from resolver import injectable
from schemas.similar_audiences import AudienceFeatureImportance


@injectable
class AudienceLookalikesPostgresPersistence(
    AudienceLookalikesPersistenceInterface
):
    def __init__(self, db: Db):
        self.db = db

    def get_source_info(self, uuid_of_source, user_id):
        source = (
            self.db.query(AudienceSource, Users.full_name)
            .join(Users, Users.id == AudienceSource.created_by_user_id)
            .filter(
                AudienceSource.id == uuid_of_source,
                AudienceSource.user_id == user_id,
            )
            .first()
        )

        return source

    def get_lookalikes(
        self,
        user_id: int,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
        from_date: Optional[int] = None,
        to_date: Optional[int] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
        lookalike_size: Optional[str] = None,
        lookalike_type: Optional[str] = None,
        search_query: Optional[str] = None,
        include_json_fields: bool = False,
    ):
        columns = [
            AudienceLookalikes.id,
            AudienceLookalikes.name,
            AudienceLookalikes.lookalike_size,
            AudienceLookalikes.created_date,
            AudienceLookalikes.size,
            AudienceLookalikes.processed_size,
            AudienceLookalikes.train_model_size,
            AudienceLookalikes.processed_train_model_size,
            AudienceSource.name.label("source"),
            AudienceSource.source_type,
            Users.full_name.label("created_by"),
            AudienceSource.source_origin,
            UserDomains.domain,
            AudienceSource.target_schema,
        ]

        if include_json_fields:
            columns.extend(
                [
                    AudienceLookalikes.significant_fields,
                    AudienceLookalikes.similarity_score,
                ]
            )

        query = (
            self.db.query(*columns)
            .join(
                AudienceSource,
                AudienceLookalikes.source_uuid == AudienceSource.id,
            )
            .outerjoin(UserDomains, AudienceSource.domain_id == UserDomains.id)
            .join(Users, Users.id == AudienceSource.created_by_user_id)
            .filter(
                AudienceLookalikes.user_id == user_id,
            )
        )

        source_count = (
            self.db.query(AudienceSource.id)
            .filter(AudienceSource.user_id == user_id)
            .count()
        )

        if search_query:
            query = query.filter(
                or_(
                    AudienceLookalikes.name.ilike(f"%{search_query}%"),
                    AudienceSource.name.ilike(f"%{search_query}%"),
                    Users.full_name.ilike(f"%{search_query}%"),
                )
            )

        sort_options = {
            "name": AudienceLookalikes.name,
            "created_date": AudienceLookalikes.created_date,
            "size": AudienceLookalikes.size,
        }
        if sort_by:
            sort_column = sort_options[sort_by]
            if sort_order == "asc":
                query = query.order_by(asc(sort_column))
            elif sort_order == "desc":
                query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(desc(AudienceLookalikes.created_date))

        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)
            query = query.filter(
                AudienceLookalikes.created_date >= start_date,
                AudienceLookalikes.created_date <= end_date,
            )
        if lookalike_size:
            sizes = [unquote(i.strip()) for i in lookalike_size.split(",")]
            query = query.filter(AudienceLookalikes.lookalike_size.in_(sizes))

        if lookalike_type:
            types = [
                unquote(i.strip()).replace(" ", "_")
                for i in lookalike_type.split(",")
            ]
            filters = [
                AudienceSource.source_type.ilike(f"%{t}%") for t in types
            ]
            query = query.filter(or_(*filters))

        offset = (page - 1) * per_page
        now = datetime.utcnow()
        rows = query.limit(per_page).offset(offset).all()

        result_query = []
        for row in rows:
            row_dict = row._asdict()

            eta_seconds = None
            processed = row_dict.get("processed_train_model_size")
            total = row_dict.get("train_model_size")
            created_date = row_dict.get("created_date")

            if processed is not None and total:
                remaining = total - processed
                if remaining > 0 and created_date:
                    time_elapsed = (now - created_date).total_seconds()
                    if time_elapsed > 0 and processed > 0:
                        speed = processed / time_elapsed
                        if speed > 0:
                            eta_seconds = int(remaining / speed)

            row_dict["eta_seconds"] = eta_seconds
            result_query.append(row_dict)

        count = query.count()
        max_page = math.ceil(count / per_page)
        return result_query, count, max_page, source_count

    def get_processed_lookalikes_by_user(self, user_id: int):
        columns = [
            AudienceLookalikes.id,
            AudienceLookalikes.name,
            AudienceLookalikes.lookalike_size,
            AudienceLookalikes.created_date,
            AudienceLookalikes.size,
            AudienceLookalikes.processed_size,
            AudienceLookalikes.train_model_size,
            AudienceLookalikes.processed_train_model_size,
            AudienceSource.name.label("source"),
            AudienceSource.source_type,
            Users.full_name.label("created_by"),
            AudienceSource.source_origin,
            UserDomains.domain,
            AudienceSource.target_schema,
        ]

        query = (
            self.db.query(*columns)
            .join(
                AudienceSource,
                AudienceLookalikes.source_uuid == AudienceSource.id,
            )
            .outerjoin(UserDomains, AudienceSource.domain_id == UserDomains.id)
            .join(Users, Users.id == AudienceSource.created_by_user_id)
            .filter(
                AudienceLookalikes.user_id == user_id,
                AudienceLookalikes.train_model_size
                == AudienceLookalikes.processed_train_model_size,
            )
        )

        result_query = [
            row._asdict()
            for row in query.order_by(
                desc(AudienceLookalikes.created_date)
            ).all()
        ]
        return result_query

    def get_lookalike(self, lookalike_id: UUID) -> Optional[AudienceLookalikes]:
        return self.db.execute(
            select(AudienceLookalikes).where(
                AudienceLookalikes.id == lookalike_id
            )
        ).scalar()

    def update_dataset_size(self, lookalike_id: UUID, dataset_size: int):
        self.db.execute(
            update(AudienceLookalikes)
            .where(AudienceLookalikes.id == lookalike_id)
            .values(train_model_size=dataset_size)
        )

    def get_max_size(self, lookalike_size: str) -> int:
        if lookalike_size == "almost_identical":
            size = 10000
        elif lookalike_size == "extremely_similar":
            size = 50000
        elif lookalike_size == "very_similar":
            size = 100000
        elif lookalike_size == "quite_similar":
            size = 200000
        elif lookalike_size == "broad":
            size = 500000
        else:
            size = 50000

        return size

    def create_lookalike(
        self,
        uuid_of_source,
        user_id,
        lookalike_size,
        lookalike_name,
        created_by_user_id,
        audience_feature_importance: AudienceFeatureImportance,
    ):
        source_info = self.get_source_info(uuid_of_source, user_id)
        if not source_info:
            raise HTTPException(
                status_code=404, detail="Source not found or access denied"
            )

        sources, created_by = source_info

        if (
            sources.matched_records == 0
            and sources.matched_records_status != "complete"
        ):
            raise HTTPException(
                status_code=400,
                detail="Cannot create lookalike: no matched records or matching not complete",
            )

        audience_feature_dict = {
            k: round(v * 1000) / 1000
            for k, v in audience_feature_importance.items()
        }

        sorted_dict = dict(
            sorted(
                audience_feature_dict.items(),
                key=lambda item: item[1],
                reverse=True,
            )
        )
        lookalike = AudienceLookalikes(
            name=lookalike_name,
            lookalike_size=lookalike_size,
            user_id=user_id,
            created_date=datetime.utcnow(),
            created_by_user_id=created_by_user_id,
            source_uuid=uuid_of_source,
            significant_fields=sorted_dict,
            size=self.get_max_size(lookalike_size),
        )
        self.db.add(lookalike)
        self.db.commit()

        return {
            "id": lookalike.id,
            "name": lookalike.name,
            "source": sources.source_origin,
            "source_type": sources.source_type,
            "size": lookalike.size,
            "size_progress": lookalike.processed_size,
            "train_model_size": lookalike.train_model_size,
            "processed_train_model_size": lookalike.processed_train_model_size,
            "lookalike_size": lookalike.lookalike_size,
            "created_date": lookalike.created_date,
            "created_by": created_by,
        }

    def delete_lookalike(self, uuid_of_lookalike, user_id):
        delete_lookalike = (
            self.db.query(AudienceLookalikes)
            .filter(
                AudienceLookalikes.id == uuid_of_lookalike,
                AudienceLookalikes.user_id == user_id,
            )
            .first()
        )

        if delete_lookalike:
            try:
                self.db.delete(delete_lookalike)
                self.db.commit()
                return True
            except IntegrityError:
                self.db.rollback()
                raise
        return False

    def update_lookalike(self, uuid_of_lookalike, name_of_lookalike, user_id):
        query = self.db.query(AudienceLookalikes).filter(
            AudienceLookalikes.id == uuid_of_lookalike,
            AudienceLookalikes.user_id == user_id,
        )

        updated_rows = query.update(
            {AudienceLookalikes.name: name_of_lookalike},
            synchronize_session=False,
        )
        self.db.commit()

        return updated_rows > 0

    def search_lookalikes(self, start_letter, user_id):
        query = (
            self.db.query(
                AudienceLookalikes,
                AudienceSource.name.label("source_name"),
                AudienceSource.source_type,
                Users.full_name,
            )
            .join(
                AudienceSource,
                AudienceLookalikes.source_uuid == AudienceSource.id,
            )
            .join(Users, Users.id == AudienceSource.created_by_user_id)
            .filter(AudienceLookalikes.user_id == user_id)
        )

        if start_letter:
            query = query.filter(
                or_(
                    AudienceLookalikes.name.ilike(f"{start_letter}%"),
                    AudienceSource.name.ilike(f"{start_letter}%"),
                    Users.full_name.ilike(f"{start_letter}%"),
                )
            )

        lookalike_data = query.all()

        return lookalike_data

    def get_all_sources(self, user_id):
        source = (
            self.db.query(AudienceSource, Users.full_name)
            .join(Users, Users.id == AudienceSource.created_by_user_id)
            .filter(AudienceSource.user_id == user_id)
            .order_by(AudienceSource.created_at.desc())
            .all()
        )

        return source

    def get_processing_lookalike(self, id: UUID):
        query = (
            self.db.query(
                AudienceLookalikes.id,
                AudienceLookalikes.name,
                AudienceLookalikes.size,
                AudienceLookalikes.processed_size,
                AudienceLookalikes.created_date,
                AudienceLookalikes.lookalike_size,
                AudienceLookalikes.processed_train_model_size,
                AudienceLookalikes.train_model_size,
                AudienceSource.name,
                AudienceSource.source_type,
                Users.full_name,
                AudienceSource.source_origin,
                AudienceSource.target_schema,
            )
            .join(
                AudienceSource,
                AudienceLookalikes.source_uuid == AudienceSource.id,
            )
            .join(Users, Users.id == AudienceSource.created_by_user_id)
            .filter(AudienceLookalikes.id == id)
        ).first()

        if not query:
            return None

        result = dict(query._asdict())

        try:
            now = datetime.now(timezone.utc)
            created = result["created_date"]

            if (
                created.tzinfo is None
                or created.tzinfo.utcoffset(created) is None
            ):
                created = created.replace(tzinfo=timezone.utc)

            processed = result["processed_train_model_size"] or 0
            total = result["train_model_size"] or 0

            elapsed_seconds = (now - created).total_seconds()

            if elapsed_seconds >= 1 and 0 < processed < total:
                speed = processed / elapsed_seconds
                remaining = total - processed
                eta_seconds = int(remaining / speed) if speed > 0 else None
                result["eta_seconds"] = eta_seconds
            else:
                result["eta_seconds"] = None
        except Exception as e:
            result["eta_seconds"] = None

        return result

    def retrieve_source_insights(
        self,
        source_uuid: UUID,
        audience_type: BusinessType,
        limit: Optional[int] = None,
    ) -> List[Dict]:
        def __all_columns_except(model, *skip: str):
            return tuple(c for c in model.__table__.c if c.name not in skip)

        # for b2c
        enrichment_models_b2c = [
            EnrichmentPersonalProfiles,
            EnrichmentFinancialRecord,
            EnrichmentLifestyle,
            EnrichmentVoterRecord,
        ]
        # for b2b
        enrichment_models_b2b = [
            EnrichmentProfessionalProfile,
            EnrichmentEmploymentHistory,
        ]

        if audience_type == BusinessType.B2C:
            enrichment_models = enrichment_models_b2c
        elif audience_type == BusinessType.B2B:
            enrichment_models = enrichment_models_b2b
        else:
            enrichment_models = enrichment_models_b2c + enrichment_models_b2b

        select_cols = [
            AudienceSourcesMatchedPerson.value_score.label("customer_value")
        ]
        for model in enrichment_models:
            select_cols.extend(__all_columns_except(model, "id", "asid"))

        q = (
            self.db.query(*select_cols)
            .select_from(AudienceSourcesMatchedPerson)
            .join(
                EnrichmentUser,
                AudienceSourcesMatchedPerson.enrichment_user_id
                == EnrichmentUser.id,
            )
            .order_by(EnrichmentUser.asid)
        )

        for model in enrichment_models:
            q = q.outerjoin(model, model.asid == EnrichmentUser.asid)

        q = q.filter(AudienceSourcesMatchedPerson.source_id == str(source_uuid))
        if limit is not None:
            q = q.limit(limit)
        rows = q.all()

        def __row2dict(row) -> Dict[str, Any]:
            d = dict(row._mapping)
            updated_dict = {}
            for k, v in d.items():
                if k == "zip_code5" and v:
                    updated_dict[k] = str(v)
                elif k == "state_abbr":
                    updated_dict["state"] = v
                elif isinstance(v, Decimal):
                    updated_dict[k] = str(v)
                else:
                    updated_dict[k] = v
            return updated_dict

        result: List[Dict[str, Any]] = [__row2dict(r) for r in rows]
        return result

    def calculate_lookalikes(
        self, user_id: int, source_uuid: UUID, lookalike_size: str
    ) -> List[Dict]:
        source_target_schema = (
            self.db.query(AudienceSource.target_schema)
            .filter(
                AudienceSource.id == str(source_uuid),
                AudienceSource.user_id == user_id,
            )
            .first()
        )
        if not source_target_schema:
            raise HTTPException(
                status_code=404,
                detail="Audience source not found or access denied",
            )

        total_matched = (
            self.db.query(func.count(AudienceSourcesMatchedPerson.id))
            .filter(AudienceSourcesMatchedPerson.source_id == str(source_uuid))
            .scalar()
        )

        def __get_number_users(lookalike_size: str, size: int) -> int:
            if lookalike_size == LookalikeSize.ALMOST.value:
                number = size * 0.2
            elif lookalike_size == LookalikeSize.EXTREMELY.value:
                number = size * 0.4
            elif lookalike_size == LookalikeSize.VERY.value:
                number = size * 0.6
            elif lookalike_size == LookalikeSize.QUITE.value:
                number = size * 0.8
            elif lookalike_size == LookalikeSize.BROAD.value:
                number = size * 1
            else:
                number = size * 1
            return int(number)

        number_required = __get_number_users(lookalike_size, total_matched)
        atype = {
            "b2b": BusinessType.B2B,
            "b2c": BusinessType.B2C,
        }.get(source_target_schema, BusinessType.ALL)

        result = self.retrieve_source_insights(
            source_uuid=source_uuid, audience_type=atype, limit=number_required
        )

        return result
