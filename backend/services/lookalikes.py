from typing import List, Tuple, Dict, Set
from uuid import UUID

from pydantic.v1 import UUID4

from persistence.audience_lookalikes import AudienceLookalikesPersistence
from enums import BaseEnum, BusinessType
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from schemas.lookalikes import CalculateRequest, B2CInsights, B2BInsights
from schemas.similar_audiences import AudienceFeatureImportance, NormalizationConfig
from services.similar_audiences import SimilarAudienceService
from services.similar_audiences.exceptions import EqualTrainTargets, EmptyTrainDataset, \
    LessThenTwoTrainDataset


PERSONAL   = {
    "age","gender","homeowner","length_of_residence_years",
    "marital_status","business_owner","birth_day","birth_month",
    "birth_year","has_children","number_of_children",
    "religion","ethnicity","language_code","state","zip_code5",
}
FINANCIAL  = {
    "income_range","net_worth","credit_rating","credit_cards",
    "bank_card","credit_card_premium","credit_card_new_issue",
    "credit_lines","credit_range_of_new_credit_lines",
    "donor","investor","mail_order_donor",
}
LIFESTYLE  = {
    "pets","cooking_enthusiast","travel","mail_order_buyer",
    "online_purchaser","book_reader","health_and_beauty","fitness",
    "outdoor_enthusiast","tech_enthusiast","diy","gardening",
    "automotive_buff","golf_enthusiasts","beauty_cosmetics","smoker",
}
VOTER      = {"party_affiliation","congressional_district","voting_propensity"}
EMPLOYMENT_HISTORY = {
    "job_title",
    "company_name",
    "start_date",
    "end_date",
    "is_current",
    "location",
    "job_description",
}
PROFESSIONAL_PROFILE = {
    "current_job_title",
    "current_company_name",
    "job_start_date",
    "job_duration",
    "job_location",
    "job_level",
    "department",
    "company_size",
    "primary_industry",
    "annual_sales",
}

class AudienceLookalikesService:
    def __init__(self, lookalikes_persistence_service: AudienceLookalikesPersistence):
        self.lookalikes_persistence_service = lookalikes_persistence_service

    def get_lookalikes(self, user, page, per_page, from_date, to_date,
                   sort_by, sort_order, lookalike_size,
                   lookalike_type, search_query):
        result_query, total, max_page = (
            self.lookalikes_persistence_service.get_lookalikes(
                user_id=user.get('id'),
                page=page,
                per_page=per_page,
                sort_by=sort_by,
                sort_order=sort_order,
                from_date=from_date,
                to_date=to_date,
                lookalike_size=lookalike_size,
                lookalike_type=lookalike_type,
                search_query=search_query,
            )
        )

        result = []
        for (
            lookalike,
            source_name,
            source_type,
            created_by,
            source_origin,
            domain,
            target_schema
        ) in result_query:
            significant_fields = getattr(lookalike, 'significant_fields', None)
            if significant_fields and isinstance(significant_fields, dict):
                processed_fields = {}
                for key, value in significant_fields.items():
                    if value:
                        scaled = round(value * 100, 3)
                        if scaled != 0:
                            processed_fields[key] = scaled
                lookalike.significant_fields = processed_fields
                
            similarity_score = getattr(lookalike, 'similarity_score', None)
            if similarity_score and isinstance(similarity_score, dict):
                similarity_scores = {}
                for key, value in similarity_score.items():
                    if value:
                        scaled = round(value * 100, 3)
                        if scaled != 0:
                                similarity_scores[key] = scaled
                lookalike.similarity_score = similarity_scores
                
            result.append({
                **lookalike.__dict__,
                "source": source_name,
                "source_type": source_type,
                "created_by": created_by,
                "source_origin": source_origin,
                "domain": domain,
                "target_schema": target_schema
            })

        return result, total, max_page

    def get_source_info(self, uuid_of_source, user):
        source_info = self.lookalikes_persistence_service.get_source_info(uuid_of_source, user.get('id'))
        if source_info:
            sources, created_by = source_info
            return {
                'name': sources.name,
                'target_schema': sources.target_schema,
                'source': sources.source_origin,
                'type': sources.source_type,
                'created_date': sources.created_at,
                'created_by': created_by,
                'number_of_customers': sources.total_records,
                'matched_records': sources.matched_records,
            }
        return {}

    def get_all_sources(self, user):
        sources = self.lookalikes_persistence_service.get_all_sources(user.get('id'))
        result = [
            {'id': source.id,
             'name': source.name,
             'target_schema': source.target_schema,
             'source': source.source_origin,
             'type': source.source_type,
             'created_date': source.created_at,
             'created_by': created_by,
             'number_of_customers': source.total_records,
             'matched_records': source.matched_records,
             }
            for source, created_by in sources
        ]

        return result

    def delete_lookalike(self, uuid_of_lookalike, user):
        try:
            delete_lookalike = self.lookalikes_persistence_service.delete_lookalike(uuid_of_lookalike, user.get('id'))
            if delete_lookalike:
                return {'status': 'SUCCESS'}
            return {'status': 'FAILURE'}

        except IntegrityError:
            raise HTTPException(status_code=400, detail="Cannot remove lookalike because it is used for smart audience")

    def create_lookalike(self, user, uuid_of_source, lookalike_size, lookalike_name, created_by_user_id, audience_feature_importance: Dict):
        lookalike = self.lookalikes_persistence_service.create_lookalike(
            uuid_of_source, user.get('id'), lookalike_size, lookalike_name, created_by_user_id, audience_feature_importance=audience_feature_importance
        )
        return {
            'status': BaseEnum.SUCCESS.value,
            'lookalike': lookalike
        }

    def update_lookalike(self, uuid_of_lookalike, name_of_lookalike, user):
        update = self.lookalikes_persistence_service.update_lookalike(
            uuid_of_lookalike=uuid_of_lookalike, name_of_lookalike=name_of_lookalike, user_id=user.get('id')
        )
        if update:
            return {'status': 'SUCCESS'}
        return {'status': 'FAILURE'}


    def _default_insights(self) -> Tuple[B2CInsights, B2BInsights, Dict[str, float]]:
        zero_dicts = CalculateRequest._make_zero_dicts(
            personal=PERSONAL,
            financial=FINANCIAL,
            lifestyle=LIFESTYLE,
            voter=VOTER,
            employment_history=EMPLOYMENT_HISTORY,
            professional_profile=PROFESSIONAL_PROFILE,
        )

        b2c = B2CInsights(
            personal=zero_dicts['personal'],
            financial=zero_dicts['financial'],
            lifestyle=zero_dicts['lifestyle'],
            voter=zero_dicts['voter'],
        )
        b2b = B2BInsights(
            employment_history=zero_dicts['employment_history'],
            professional_profile=zero_dicts['professional_profile'],
        )
        return b2c, b2b, {}

    def search_lookalikes(self, start_letter, user):
        lookalike_data = self.lookalikes_persistence_service.search_lookalikes(start_letter=start_letter,
                                                                               user_id=user.get('id'))
        results = set()
        for lookalike, source_name, source_type, creator_name in lookalike_data:
            if start_letter.lower() in lookalike.name.lower():
                results.add(lookalike.name)
            if start_letter.lower() in source_name.lower():
                results.add(source_name)
            if start_letter.lower() in creator_name.lower():
                results.add(creator_name)

        limited_results = list(results)[:10]
        return limited_results

    def split_insights(self, insights: dict[str, float]) -> Tuple[B2CInsights, B2BInsights, Dict]:
        personal = {}
        financial = {}
        lifestyle = {}
        voter = {}
        employment_history = {}
        professional_profile = {}
        other = {}

        for k, v in insights.items():
            if k in PERSONAL:
                personal[k] = v
            elif k in FINANCIAL:
                financial[k] = v
            elif k in LIFESTYLE:
                lifestyle[k] = v
            elif k in VOTER:
                voter[k] = v
            elif k in EMPLOYMENT_HISTORY:
                employment_history[k] = v
            elif k in PROFESSIONAL_PROFILE:
                professional_profile[k] = v
            else:
                other[k] = v

        b2c = B2CInsights(
            personal=personal,
            financial=financial,
            lifestyle=lifestyle,
            voter=voter,
        )

        b2b = B2BInsights(
            employment_history=employment_history,
            professional_profile=professional_profile,
        )

        return b2c, b2b, other
    
    def build_normalization_config(self, audience_data: List[dict]):
        cleaned_personal = PERSONAL - {"zip_code5"}
        allowed: Set[str] = (
                cleaned_personal
                | FINANCIAL
                | LIFESTYLE
                | VOTER
                | EMPLOYMENT_HISTORY
                | PROFESSIONAL_PROFILE
        )
        present_keys = {key for record in audience_data for key in record.keys()}
        unordered = [field for field in allowed if field in present_keys]
        return NormalizationConfig(
            numerical_features=[],
            ordered_features={},
            unordered_features=unordered,
        )

    def calculate_insights(self, audience_data: List[dict], similar_audience_service: SimilarAudienceService, audience_type: BusinessType = BusinessType.ALL) -> CalculateRequest:
        try:
            if len(audience_data) < 2:
                raise LessThenTwoTrainDataset

            normalization_config = self.build_normalization_config(audience_data)
            
            audience_feature_dict = similar_audience_service.get_audience_feature_importance_with_config(
                audience_data=audience_data,
                config=normalization_config
            )

            rounded_feature = {
                k: round(v, 6) if isinstance(v, (int, float)) else v
                for k, v in audience_feature_dict.items()
            }

            return self.split_insights(rounded_feature)

        except (EqualTrainTargets, EmptyTrainDataset, LessThenTwoTrainDataset, Exception):
            return self._default_insights()
            

    def calculate_lookalike(self, similar_audience_service: SimilarAudienceService, user: dict, uuid_of_source: UUID, lookalike_size: str) -> CalculateRequest:
        audience_data = self.lookalikes_persistence_service.calculate_lookalikes(
            user_id=user.get("id"),
            source_uuid=uuid_of_source,
            lookalike_size=lookalike_size
        )
        b2c_insights, b2b_insights, other = self.calculate_insights(audience_data=audience_data, similar_audience_service=similar_audience_service)
        return CalculateRequest(
            count_matched_persons=len(audience_data),
            audience_feature_importance_b2c=b2c_insights,
            audience_feature_importance_b2b=b2b_insights,
            audience_feature_importance_other=other
        )
    
    def get_processing_lookalike(self, id: str):
        lookalike = self.lookalikes_persistence_service.get_processing_lookalike(id)
        if not lookalike:
            return None

        result = {key: value for key, value in lookalike.items()}
        return result
