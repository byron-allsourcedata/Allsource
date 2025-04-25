from datetime import datetime
from decimal import Decimal
from uuid import UUID

import pytz
from pydantic.v1 import UUID4

from enums import LookalikeSize
from models import EnrichmentUserId, EnrichmentPersonalProfiles, EnrichmentFinancialRecord, EnrichmentLifestyle, \
    EnrichmentVoterRecord
from models.audience_sources import AudienceSource
from models.audience_lookalikes import AudienceLookalikes
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from models.enrichment_users import EnrichmentUser
from models.users_domains import UserDomains
from sqlalchemy.orm import Session
from typing import Optional, List
import math
from sqlalchemy import asc, desc, or_, func
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from urllib.parse import unquote
from models.enrichment_lookalike_scores import EnrichmentLookalikeScore
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
            key: round(value * 1000) / 1000
            for key, value in audience_feature_importance.__dict__.items()
            if value is not None
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

    def calculate_lookalikes(self, user_id: int, source_uuid: UUID, lookalike_size: str) -> List[AudienceData]:
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

        U = EnrichmentUserId
        P = EnrichmentPersonalProfiles
        F = EnrichmentFinancialRecord
        L = EnrichmentLifestyle
        V = EnrichmentVoterRecord
        M = AudienceSourcesMatchedPerson

        q = (
            self.db.query(
                M.email.label("EmailAddress"),
                M.value_score.label("customer_value"),
                P.age.label("AgeRange"),
                P.gender.label("Gender"),
                P.homeowner.label("HomeownerStatus"),
                P.length_of_residence_years.label("LengthOfResidenceYears"),
                P.marital_status.label("MaritalStatus"),
                P.has_children.label("HasChildren"),
                P.number_of_children.label("NumberOfChildren"),
                P.business_owner.label("BusinessOwner"),
                P.birth_day.label("BirthDay"),
                P.birth_month.label("BirthMonth"),
                P.birth_year.label("BirthYear"),
                P.religion.label("Religion"),
                P.ethnicity.label("Ethnicity"),
                P.language_code.label("LanguageCode"),
                P.state_abbr.label("StateAbbr_PP"),
                P.zip_code5.label("ZipCode5_PP"),
                F.income_range.label("IncomeRange"),
                F.net_worth.label("NetWorth"),
                F.credit_rating.label("CreditRating"),
                F.credit_cards.label("CreditCards"),
                F.bank_card.label("BankCard"),
                F.credit_card_premium.label("CreditCardPremium"),
                F.credit_card_new_issue.label("CreditCardNewIssue"),
                F.credit_lines.label("CreditLines"),
                F.credit_range_of_new_credit_lines.label("CreditRangeOfNewCreditLines"),
                F.donor.label("Donor"),
                F.investor.label("Investor"),
                F.mail_order_donor.label("MailOrderDonor"),
                L.pets.label("Pets"),
                L.cooking_enthusiast.label("CookingEnthusiast"),
                L.travel.label("Travel"),
                L.mail_order_buyer.label("MailOrderBuyer"),
                L.online_purchaser.label("OnlinePurchaser"),
                L.book_reader.label("BookReader"),
                L.health_and_beauty.label("HealthAndBeauty"),
                L.fitness.label("Fitness"),
                L.outdoor_enthusiast.label("OutdoorEnthusiast"),
                L.tech_enthusiast.label("TechEnthusiast"),
                L.diy.label("DIY"),
                L.gardening.label("Gardening"),
                L.automotive_buff.label("AutomotiveBuff"),
                L.golf_enthusiasts.label("GolfEnthusiasts"),
                L.beauty_cosmetics.label("BeautyCosmetics"),
                L.smoker.label("Smoker"),
                V.party_affiliation.label("PartyAffiliation"),
                V.voting_propensity.label("VotingPropensity"),
                V.congressional_district.label("CongressionalDistrict"),
            )
            .select_from(M)
            .join(U, M.enrichment_user_id == U.id)
            .outerjoin(P, P.asid == U.asid)
            .outerjoin(F, F.asid == U.asid)
            .outerjoin(L, L.asid == U.asid)
            .outerjoin(V, V.asid == U.asid)
            .filter(M.source_id == str(source_uuid))
            .order_by(M.value_score.desc())
            .limit(number_required)
        )
        rows = q.all()

        result: List[AudienceData] = []
        for r in rows:
            result.append(AudienceData(
                EmailAddress=r.EmailAddress,
                PersonExactAge=str(r.AgeRange),
                PersonGender=str(r.Gender),
                HomeownerStatus=str(r.HomeownerStatus),
                LengthOfResidenceYears=str(r.LengthOfResidenceYears),
                MaritalStatus=str(r.MaritalStatus),
                HasChildren=str(r.HasChildren),
                NumberOfChildren=str(r.NumberOfChildren),
                # BusinessOwner=str(r.BusinessOwner),
                # BirthDay=str(r.BirthDay),
                # BirthMonth=str(r.BirthMonth),
                # BirthYear=str(r.BirthYear),
                # Religion=r.Religion or "",
                # Ethnicity=r.Ethnicity or "",
                # LanguageCode=r.LanguageCode or "",
                StateAbbr=r.StateAbbr_PP or "",
                ZipCode5=str(r.ZipCode5_PP),

                # IncomeRange=r.IncomeRange or "",
                NetWorthCode=r.NetWorth or "",
                CreditRating=r.CreditRating or "",
                # CreditCards=r.CreditCards or "",
                # BankCard=str(r.BankCard or 0),
                # CreditCardPremium=str(r.CreditCardPremium or 0),
                # CreditCardNewIssue=str(r.CreditCardNewIssue or 0),
                # CreditLines=r.CreditLines or "",
                # CreditRangeOfNewCreditLines=r.CreditRangeOfNewCreditLines or "",
                # Donor=str(r.Donor or 0),
                # Investor=str(r.Investor or 0),
                # MailOrderDonor=str(r.MailOrderDonor or 0),

                # Pets=str(r.Pets),
                # CookingEnthusiast=str(r.CookingEnthusiast),
                # Travel=str(r.Travel),
                # MailOrderBuyer=str(r.MailOrderBuyer),
                # OnlinePurchaser=str(r.OnlinePurchaser),
                # BookReader=str(r.BookReader),
                # HealthAndBeauty=str(r.HealthAndBeauty),
                # Fitness=str(r.Fitness),
                # OutdoorEnthusiast=str(r.OutdoorEnthusiast),
                # TechEnthusiast=str(r.TechEnthusiast),
                # DIY=str(r.DIY),
                # Gardening=str(r.Gardening),
                # AutomotiveBuff=str(r.AutomotiveBuff),
                # GolfEnthusiasts=str(r.GolfEnthusiasts),
                # BeautyCosmetics=str(r.BeautyCosmetics),
                # Smoker=str(r.Smoker),
                #
                # PartyAffiliation=r.PartyAffiliation or "",
                # VotingPropensity=r.VotingPropensity or "",
                # CongressionalDistrict=str(r.CongressionalDistrict or ""),
                #
                # URN=str(r.URN or ""),
                # SiteStreetAddress=r.SiteStreetAddress or "",
                # SiteCity=r.SiteCity or "",
                # SiteState=r.SiteState or "",
                # SiteZipCode=str(r.SiteZipCode or ""),
                # OwnerFullName=r.OwnerFullName or "",
                # EstimatedHomeValue=str(r.EstimatedHomeValue or ""),
                # HomeValueNumeric=str(r.HomeValueNumeric or ""),
                # Equity=str(r.Equity or ""),
                # EquityNumeric=str(r.EquityNumeric or ""),
                # MortgageAmount=str(r.MortgageAmount or ""),
                # MortgageDate=str(r.MortgageDate or ""),
                # LenderName=r.LenderName or "",
                # PurchasePrice=str(r.PurchasePrice or ""),
                # PurchaseDate=str(r.PurchaseDate or ""),
                # OwnerOccupied=str(r.OwnerOccupied),
                # LandUseCode=r.LandUseCode or "",
                # YearBuilt=str(r.YearBuilt or ""),
                # LotSizeSqFt=str(r.LotSizeSqFt or ""),
                # BuildingTotalSqFt=str(r.BuildingTotalSqFt or ""),
                # AssessedValue=str(r.AssessedValue or ""),
                # MarketValue=str(r.MarketValue or ""),
                # TaxAmount=str(r.TaxAmount or ""),

                customer_value=Decimal(r.customer_value)
            ))
        return result


