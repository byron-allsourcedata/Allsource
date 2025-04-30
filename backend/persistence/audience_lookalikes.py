from datetime import datetime
from decimal import Decimal
from uuid import UUID

import pytz
from psycopg2.extras import NumericRange
from pydantic.v1 import UUID4
from sqlalchemy.dialects.postgresql import INT4RANGE

from enums import LookalikeSize
from models.enrichment import EnrichmentUser, EnrichmentPersonalProfiles, EnrichmentFinancialRecord, EnrichmentLifestyle, \
    EnrichmentVoterRecord, ProfessionalProfile, EnrichmentEmploymentHistory
from models.audience_sources import AudienceSource
from models.audience_lookalikes import AudienceLookalikes
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from models.enrichment.enrichment_users import EnrichmentUser
from models.users_domains import UserDomains
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import math
from sqlalchemy import asc, desc, or_, func
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from urllib.parse import unquote
from models.enrichment.enrichment_lookalike_scores import EnrichmentLookalikeScore
from uuid import UUID

from models.users import Users
from schemas.similar_audiences import AudienceData, AudienceFeatureImportance


class AudienceLookalikesPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_source_info(self, uuid_of_source, user_id):
        source = self.db.query(AudienceSource, Users.full_name).join(Users, Users.id == AudienceSource.created_by_user_id) \
            .filter(AudienceSource.id == uuid_of_source, AudienceSource.user_id == user_id).first()

        return source
    
    def get_lookalikes(self, user_id: int, page: Optional[int] = None, per_page: Optional[int] = None, from_date: Optional[int] = None, to_date: Optional[int] = None,
                       sort_by: Optional[str] = None, sort_order: Optional[str] = None,
                       lookalike_size: Optional[str] = None, lookalike_type: Optional[str] = None,
                       search_query: Optional[str] = None):
        
        query = self.db.query(
            AudienceLookalikes,
            AudienceSource.name,
            AudienceSource.source_type,
            Users.full_name,
            AudienceSource.source_origin,
            UserDomains.domain,
            AudienceSource.target_schema)\
            .join(AudienceSource, AudienceLookalikes.source_uuid == AudienceSource.id)\
            .outerjoin(UserDomains, AudienceSource.domain_id == UserDomains.id)\
            .join(Users, Users.id == AudienceSource.created_by_user_id)\
            .order_by(desc(AudienceLookalikes.created_date))\
            .filter(AudienceLookalikes.user_id == user_id)
            
        if search_query:
            query = query.filter(
                or_(
                    AudienceLookalikes.name.ilike(f"%{search_query}%"),
                    AudienceSource.name.ilike(f"%{search_query}%"),
                    Users.full_name.ilike(f"%{search_query}%")
                )
            )

        sort_options = {
            'name': AudienceLookalikes.name,
            'created_date': AudienceLookalikes.created_date,
            'size': AudienceLookalikes.size,
        }
        if sort_by:
            sort_column = sort_options[sort_by]
            if sort_order == 'asc':
                query = query.order_by(asc(sort_column))
            elif sort_order == 'desc':
                query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(desc(AudienceLookalikes.created_date))

        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)

            query = query.filter(
                AudienceLookalikes.created_date >= start_date,
                AudienceLookalikes.created_date <= end_date
            )
        if lookalike_size:
            sizes = [unquote(i.strip()) for i in lookalike_size.split(',')]
            query = query.filter(AudienceLookalikes.lookalike_size.in_(sizes))

        if lookalike_type:
            types = [unquote(i.strip()).replace(' ', '_') for i in lookalike_type.split(',')]
            filters = [AudienceSource.source_type.ilike(f"%{t}%") for t in types]
            query = query.filter(or_(*filters))

        offset = (page - 1) * per_page
        result_query = query.limit(per_page).offset(offset).all()
        count = query.count()
        max_page = math.ceil(count / per_page)
        return result_query, count, max_page

    def create_lookalike(self, uuid_of_source, user_id, lookalike_size,
                         lookalike_name, created_by_user_id, audience_feature_importance: AudienceFeatureImportance):
        source_info = self.get_source_info(uuid_of_source, user_id)
        if not source_info:
            raise HTTPException(status_code=404, detail="Source not found or access denied")

        sources, created_by = source_info

        audience_feature_dict = {
            k: round(v * 1000) / 1000
            for k, v in audience_feature_importance.items()
        }

        sorted_dict = dict(sorted(audience_feature_dict.items(), key=lambda item: item[1], reverse=True))
        lookalike = AudienceLookalikes(
            name=lookalike_name,
            lookalike_size=lookalike_size,
            user_id=user_id,
            created_date=datetime.utcnow(),
            created_by_user_id=created_by_user_id,
            source_uuid=uuid_of_source,
            significant_fields=sorted_dict
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
            "lookalike_size": lookalike.lookalike_size,
            "created_date": lookalike.created_date,
            "created_by": created_by,
        }

    def delete_lookalike(self, uuid_of_lookalike, user_id):
        delete_lookalike = self.db.query(AudienceLookalikes).filter(
            AudienceLookalikes.id == uuid_of_lookalike,
            AudienceLookalikes.user_id == user_id
        ).first()

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
            AudienceLookalikes.user_id == user_id
        )

        updated_rows = query.update({AudienceLookalikes.name: name_of_lookalike}, synchronize_session=False)
        self.db.commit()

        return updated_rows > 0

    def search_lookalikes(self, start_letter, user_id):
        query = self.db.query(
            AudienceLookalikes, AudienceSource.name.label('source_name'), AudienceSource.source_type, Users.full_name) \
            .join(AudienceSource, AudienceLookalikes.source_uuid == AudienceSource.id) \
            .join(Users, Users.id == AudienceSource.created_by_user_id) \
            .filter(AudienceLookalikes.user_id == user_id)

        if start_letter:
            query = query.filter(
                or_(
                    AudienceLookalikes.name.ilike(f"{start_letter}%"),
                    AudienceSource.name.ilike(f"{start_letter}%"),
                    Users.full_name.ilike(f"{start_letter}%")
                )
            )

        lookalike_data = query.all()

        return lookalike_data

    def get_all_sources(self, user_id):
        source = self.db.query(AudienceSource, Users.full_name).join(Users,
                                                                     Users.id == AudienceSource.created_by_user_id) \
            .filter(AudienceSource.user_id == user_id).order_by(AudienceSource.created_at.desc()).all()

        return source
    
    def get_processing_lookalike(self, id: UUID):
        query = (
            self.db.query(
                AudienceLookalikes.id,
                AudienceLookalikes.name,
                AudienceLookalikes.size,
                AudienceLookalikes.processed_size,
                AudienceLookalikes.lookalike_size,
                AudienceSource.name,
                AudienceSource.source_type,
                Users.full_name,
                AudienceSource.source_origin,
                AudienceSource.target_schema
            )
                .join(AudienceSource, AudienceLookalikes.source_uuid == AudienceSource.id)
                .join(Users, Users.id == AudienceSource.created_by_user_id)
                .filter(AudienceLookalikes.id == id)
        ).first()

        return dict(query._asdict()) if query else None

    def calculate_lookalikes(self, user_id: int, source_uuid: UUID, lookalike_size: str) -> List[Dict]:
        audience_source = (
            self.db.query(AudienceSource)
            .filter(
                AudienceSource.id == str(source_uuid),
                AudienceSource.user_id == user_id
            )
            .first()
        )
        if not audience_source:
            raise HTTPException(status_code=404, detail="Audience source not found or access denied")

        total_matched = self.db.query(func.count(AudienceSourcesMatchedPerson.id)).filter(
            AudienceSourcesMatchedPerson.source_id == str(source_uuid)
        ).scalar()
        def get_number_users(lookalike_size: str, size: int) -> int:
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

        number_required = get_number_users(lookalike_size, total_matched)

        def all_columns_except(model, *skip: str):
            return tuple(
                c for c in model.__table__.c
                if c.name not in skip
            )

        q = (
            self.db.query(
                AudienceSourcesMatchedPerson.value_score.label("customer_value"),
                *all_columns_except(EnrichmentPersonalProfiles, "id", "asid"),
                *all_columns_except(EnrichmentFinancialRecord, "id", "asid"),
                *all_columns_except(EnrichmentLifestyle, "id", "asid"),
                *all_columns_except(EnrichmentVoterRecord, "id", "asid"),
                *all_columns_except(ProfessionalProfile, "id", "asid"),
                *all_columns_except(EnrichmentEmploymentHistory, "id", "asid")
            )
            .select_from(AudienceSourcesMatchedPerson)
            .join(
                EnrichmentUser,
                AudienceSourcesMatchedPerson.enrichment_user_id == EnrichmentUser.id
            )
            .outerjoin(
                EnrichmentPersonalProfiles,
                EnrichmentPersonalProfiles.asid == EnrichmentUser.asid
            )
            .outerjoin(
                EnrichmentFinancialRecord,
                EnrichmentFinancialRecord.asid == EnrichmentUser.asid
            )
            .outerjoin(
                EnrichmentLifestyle,
                EnrichmentLifestyle.asid == EnrichmentUser.asid
            )
            .outerjoin(
                EnrichmentVoterRecord,
                EnrichmentVoterRecord.asid == EnrichmentUser.asid
            )
            .outerjoin(
                ProfessionalProfile,
                ProfessionalProfile.asid == EnrichmentUser.asid
            )
            .outerjoin(
                EnrichmentEmploymentHistory,
                EnrichmentEmploymentHistory.asid == EnrichmentUser.asid
            )
            .filter(AudienceSourcesMatchedPerson.source_id == str(source_uuid))
            .order_by(AudienceSourcesMatchedPerson.value_score.desc())
            .limit(number_required)
        )

        rows = q.all()

        def _row2dict(row) -> Dict[str, Any]:
            d = dict(row._mapping)
            updated_dict = {}
            for k, v in d.items():
                if k == "age" and v:
                    updated_dict[k] = int(v.lower) if v.lower is not None else None
                elif k == "zip_code5" and v:
                    updated_dict[k] = str(v)
                elif k == "state_abbr":
                    updated_dict["state"] = v
                elif isinstance(v, Decimal):
                    updated_dict[k] = str(v)
                else:
                    updated_dict[k] = v
            return updated_dict

        result: List[Dict[str, Any]] = [_row2dict(r) for r in rows]
        return result


