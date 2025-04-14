from datetime import datetime
from decimal import Decimal
from uuid import UUID

import pytz
from pydantic.v1 import UUID4

from models.audience_sources import AudienceSource
from models.audience_lookalikes import AudienceLookalikes
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from models.enrichment_users import EnrichmentUser
from models.users_domains import UserDomains
from sqlalchemy.orm import Session
from typing import Optional, List
import math
from sqlalchemy import asc, desc, or_
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from urllib.parse import unquote
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
        lookalikes = query.limit(per_page).offset(offset).all()
        count = query.count()
        max_page = math.ceil(count / per_page)
        result = [
            {
                **lookalike.__dict__,
                "source": source_name,
                "source_type": source_type,
                "created_by": created_by,
                "source_origin": source_origin,
                "domain": domain,
                "target_schema": source_schema,
            }
            for lookalike, source_name, source_type, created_by, source_origin, domain, source_schema in lookalikes
        ]
        
        return result, count, max_page

    def create_lookalike(self, uuid_of_source, user_id, lookalike_size,
                         lookalike_name, created_by_user_id, audience_feature_importance: AudienceFeatureImportance):
        source_info = self.get_source_info(uuid_of_source, user_id)
        if not source_info:
            raise HTTPException(status_code=404, detail="Source not found or access denied")

        sources, created_by = source_info

        audience_feature_dict = audience_feature_importance.__dict__
        for key in audience_feature_dict.keys():
            audience_feature_dict[key] = round(audience_feature_dict[key] * 1000) / 1000
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

    def calculate_lookalikes(self, user_id: int, source_uuid: UUID) -> List[AudienceData]:
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

        rows = (
            self.db.query(
                AudienceSourcesMatchedPerson.email.label("EmailAddress"),
                EnrichmentUser.age.label("age"),
                EnrichmentUser.gender.label("PersonGender"),
                EnrichmentUser.estimated_household_income_code.label("EstimatedHouseholdIncomeCode"),
                EnrichmentUser.estimated_current_home_value_code.label("EstimatedCurrentHomeValueCode"),
                EnrichmentUser.homeowner_status.label("HomeownerStatus"),
                EnrichmentUser.has_children.label("HasChildren"),
                EnrichmentUser.number_of_children.label("NumberOfChildren"),
                EnrichmentUser.credit_rating.label("CreditRating"),
                EnrichmentUser.net_worth_code.label("NetWorthCode"),
                EnrichmentUser.zip_code5.label("ZipCode5"),
                EnrichmentUser.lat.label("Latitude"),
                EnrichmentUser.lon.label("Longitude"),
                EnrichmentUser.has_credit_card.label("HasCreditCard"),
                EnrichmentUser.length_of_residence_years.label("LengthOfResidenceYears"),
                EnrichmentUser.marital_status.label("MaritalStatus"),
                EnrichmentUser.occupation_group_code.label("OccupationGroupCode"),
                EnrichmentUser.is_book_reader.label("IsBookReader"),
                EnrichmentUser.is_online_purchaser.label("IsOnlinePurchaser"),
                EnrichmentUser.state_abbr.label("StateAbbr"),
                EnrichmentUser.is_traveler.label("IsTraveler"),
                AudienceSourcesMatchedPerson.value_score.label("customer_value")
            )
            .select_from(AudienceSource)
            .join(
                AudienceSourcesMatchedPerson,
                AudienceSourcesMatchedPerson.source_id == AudienceSource.id
            )
            .join(
                EnrichmentUser,
                EnrichmentUser.id == AudienceSourcesMatchedPerson.enrichment_user_id
            )
            .filter(AudienceSource.id == str(source_uuid))
            .all()
        )

        audience_data_list = []
        for row in rows:
            ad = AudienceData(
                EmailAddress=row.EmailAddress,
                PersonExactAge=str(row.age),
                PersonGender=str(row.PersonGender),
                EstimatedHouseholdIncomeCode=str(row.EstimatedHouseholdIncomeCode),
                EstimatedCurrentHomeValueCode=str(row.EstimatedCurrentHomeValueCode),
                HomeownerStatus=str(row.HomeownerStatus),
                HasChildren=str(row.HasChildren),
                NumberOfChildren=str(row.NumberOfChildren),
                CreditRating=str(row.CreditRating),
                NetWorthCode=str(row.NetWorthCode),
                ZipCode5=str(row.ZipCode5),
                Latitude=str(row.Latitude),
                Longitude=str(row.Longitude),
                HasCreditCard=str(row.HasCreditCard),
                LengthOfResidenceYears=str(row.LengthOfResidenceYears),
                MaritalStatus=str(row.MaritalStatus),
                OccupationGroupCode=row.OccupationGroupCode,
                IsBookReader=str(row.IsBookReader),
                IsOnlinePurchaser=str(row.IsOnlinePurchaser),
                StateAbbr=str(row.StateAbbr),
                IsTraveler=str(row.IsTraveler),
                customer_value=Decimal(row.customer_value)
            )
            audience_data_list.append(ad)

        return audience_data_list


