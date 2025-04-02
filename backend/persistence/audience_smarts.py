import logging
from datetime import datetime

import pytz
from sqlalchemy import desc, asc, or_
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql import func

from models.audience_smarts import AudienceSmart
from models.audience_lookalikes_persons import AudienceLookALikePerson
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from models.audience_smarts_use_cases import AudienceSmartsUseCase
from models.audience_smarts_data_sources import AudienceSmartsDataSources
from models.audience_lookalikes import AudienceLookalikes
from models.audience_sources import AudienceSource
from models.users import Users
from schemas.audience import DataSourcesFormat
from typing import Optional, Tuple, List
from sqlalchemy.engine.row import Row
from uuid import UUID

logger = logging.getLogger(__name__)

class AudienceSmartsPersistence:    
    def __init__(self, db: Session):
        self.db = db

    def get_use_case_id_by_alias(self, use_case_alias: str):
        use_case = (
            self.db.query(AudienceSmartsUseCase.id)
                .filter(AudienceSmartsUseCase.alias == use_case_alias)
                .first()
        )
        return use_case[0] if use_case else None
    
    def calculate_smart_audience(self, data: DataSourcesFormat) -> int:   
        AudienceLALP = aliased(AudienceLookALikePerson)
        AudienceSMP = aliased(AudienceSourcesMatchedPerson)

        lalp_query = (
            self.db.query(AudienceLALP.five_x_five_user_id)
            .filter(AudienceLALP.lookalike_id.in_(data["lookalike_ids"]["include"]))
            .filter(AudienceLALP.lookalike_id.notin_(data["lookalike_ids"]["exclude"]))
        )

        smp_query = (
            self.db.query(AudienceSMP.five_x_five_user_id)
            .filter(AudienceSMP.source_id.in_(data["source_ids"]["include"]))
            .filter(AudienceSMP.source_id.notin_(data["source_ids"]["exclude"]))
        )

        combined_query = lalp_query.union_all(smp_query).subquery()

        count_query = self.db.query(func.count()).select_from(combined_query)
        return count_query.scalar()

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
                source_id=source["selectedSourceId"] if source["sourceLookalike"] == "Source" else None,
                lookalike_id=source["selectedSourceId"] if source["sourceLookalike"] == "Lookalike" else None,
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
            validation_params: Optional[dict],
            contacts_to_validate: Optional[int]
    ) -> AudienceSmart:

        use_case_id = self.get_use_case_id_by_alias(use_case_alias)
        if not use_case_id:
            raise ValueError(f"Use case with alias '{use_case_alias}' not found.")

        new_audience = AudienceSmart(
            name=name,
            user_id=user_id,
            created_by_user_id=created_by_user_id,
            use_case_id=use_case_id,
            validations=validation_params,
            active_segment_records=contacts_to_validate,
            status="unvalidated"
        )

        self.db.add(new_audience)
        self.db.flush()

        self.create_audience_smarts_data_sources(new_audience.id, data_sources)

        self.db.commit()
        self.db.refresh(new_audience)

        return new_audience

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
            use_cases: Optional[List[str]] = None
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
            )
                .join(Users, Users.id == AudienceSmart.created_by_user_id)
                .join(AudienceSmartsUseCase, AudienceSmartsUseCase.id == AudienceSmart.use_case_id)
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
                AudienceSmart.created_at <= end_date
            )
        
        if search_query:
            query = query.filter(
                or_(
                    AudienceSmart.name.ilike(f"%{search_query}%"),
                    Users.full_name.ilike(f"%{search_query}%")
                )
            )

        sort_options = {
            'number_of_customers': AudienceSmart.total_records,
            'created_date': AudienceSmart.created_at,
            'active_segment_records': AudienceSmart.active_segment_records,
        }
        if sort_by in sort_options:
            sort_column = sort_options[sort_by]
            query = query.order_by(
                asc(sort_column) if sort_order == 'asc' else desc(sort_column),
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
                AudienceSource.matched_records
            )
                .select_from(AudienceSmart)
                .join(AudienceSmartsDataSources, AudienceSmartsDataSources.smart_audience_id == AudienceSmart.id)
                .outerjoin(AudienceLookalikes, AudienceSmartsDataSources.lookalike_id == AudienceLookalikes.id)
                .outerjoin(AudienceSource, (AudienceSmartsDataSources.source_id == AudienceSource.id) | (AudienceLookalikes.source_uuid == AudienceSource.id)) 
                .filter(AudienceSmart.id == id)
        )
        return query.all()


    def search_audience_smart(self, start_letter: str, user_id: int):
        query = (
            self.db.query(
                AudienceSmart.name,
                Users.full_name
            )
                .join(Users, Users.id == AudienceSmart.created_by_user_id)
                .filter(AudienceSmart.user_id == user_id)
        )

        if start_letter:
            query = query.filter(
                or_(
                    AudienceSmart.name.ilike(f"{start_letter}%"),
                    Users.full_name.ilike(f"{start_letter}%")
                )
            )

        smarts = query.all()
        return smarts
    

    def delete_audience_smart(self, id: int) -> int:
        deleted_count = self.db.query(AudienceSmart).filter(
            AudienceSmart.id == id
        ).delete()
        self.db.commit()
        return deleted_count
    
    def update_audience_smart(self, id, new_name) -> int:
        updated_count = self.db.query(AudienceSmart).filter(
            AudienceSmart.id == id
        ).update({AudienceSmart.name: new_name}, synchronize_session=False)
        self.db.commit()
        return updated_count