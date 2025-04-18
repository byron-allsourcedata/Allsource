from typing import List
from uuid import UUID

from pydantic.v1 import UUID4

from persistence.audience_lookalikes import AudienceLookalikesPersistence
from enums import BaseEnum
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from schemas.lookalikes import CalculateRequest
from schemas.similar_audiences import AudienceFeatureImportance
from services.similar_audiences import SimilarAudienceService


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

    def create_lookalike(self, user, uuid_of_source, lookalike_size, lookalike_name, created_by_user_id, audience_feature_importance: AudienceFeatureImportance):
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

    def calculate_lookalike(
        self,
        similar_audience_service: SimilarAudienceService,
        user: dict,
        uuid_of_source: UUID,
        lookalike_size: str
    ) -> CalculateRequest:
        audience_data = self.lookalikes_persistence_service.calculate_lookalikes(
            user_id=user.get("id"),
            source_uuid=uuid_of_source,
            lookalike_size=lookalike_size
        )
        audience_feature = similar_audience_service.get_audience_feature_importance(audience_data)
        audience_feature_dict = audience_feature.dict()
        rounded_feature = {
            key: round(value * 1000) / 1000 if isinstance(value, (int, float)) else value
            for key, value in audience_feature_dict.items()
        }

        return CalculateRequest(
            count_matched_persons = len(audience_data),
            audience_feature_importance = AudienceFeatureImportance(**rounded_feature)
        )

    
    def get_processing_lookalike(self, id: str):
        lookalike = self.lookalikes_persistence_service.get_processing_lookalike(id)
        if not lookalike:
            return None

        result = {key: value for key, value in lookalike.items()}
        return result
