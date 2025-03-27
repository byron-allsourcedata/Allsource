import logging
from typing import Optional, List
import json

from persistence.audience_lookalikes import AudienceLookalikesPersistence
from persistence.audience_sources_persistence import AudienceSourcesPersistence
from schemas.audience import SmartsAudienceObjectResponse
from persistence.audience_smarts import AudienceSmartsPersistence
from models.users import User

logger = logging.getLogger(__name__)

class AudienceSmartsService:
    def __init__(self, audience_smarts_persistence: AudienceSmartsPersistence,
                 lookalikes_persistence_service: AudienceLookalikesPersistence,
                 audience_sources_persistence: AudienceSourcesPersistence
                 ):
        self.audience_smarts_persistence = audience_smarts_persistence
        self.lookalikes_persistence_service = lookalikes_persistence_service
        self.audience_sources_persistence = audience_sources_persistence

    def get_audience_smarts(
            self,
            user: User,
            page: int,
            per_page: int,
            sort_by: Optional[str] = None,
            sort_order: Optional[str] = None,
            from_date: Optional[str] = None,
            to_date: Optional[str] = None,
            search_query: Optional[str] = None,
            statuses: Optional[List[str]] = None, 
            use_cases:Optional[List[str]] = None, 
    ) -> SmartsAudienceObjectResponse:
        audience_smarts, count = self.audience_smarts_persistence.get_audience_smarts(
            user_id=user.get("id"),
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order,
            from_date=from_date,
            to_date=to_date,
            search_query=search_query,
            statuses=statuses,
            use_cases=use_cases
        )

        audience_smarts_list = []
        for item in audience_smarts:
            integrations = json.loads(item[9]) if item[9] else []
            audience_smarts_list.append({
                'id': item[0],
                'name': item[1],
                'use_case_alias': item[2],
                'created_by': item[3],
                'created_at': item[4],
                'total_records': item[5],
                'validated_records': item[6],
                'active_segment_records': item[7],
                'status': item[8],
                'integrations': integrations,
            })

        return audience_smarts_list, count
    

    def search_audience_smart(self, start_letter, user):
        smarts = self.audience_smarts_persistence.search_audience_smart(
            user_id=user.get('id'),
            start_letter=start_letter
        )
        results = set()
        for smart_audience_name, creator_name in smarts:
                if start_letter.lower() in smart_audience_name.lower():
                    results.add(smart_audience_name)
                if start_letter.lower() in creator_name.lower():
                    results.add(creator_name)

        limited_results = list(results)[:10]
        return limited_results


    def delete_audience_smart(self, id) -> bool:
        count_deleted = self.audience_smarts_persistence.delete_audience_smart(id)
        return count_deleted > 0

    def update_audience_smart(self, id, new_name) -> bool:
        count_updated = self.audience_smarts_persistence.update_audience_smart(id, new_name)
        return count_updated > 0

    def create_audience_smart(
            self,
            name: str,
            user: dict,
            created_by_user_id: int,
            use_case_alias: str,
            data_sources: List[dict],
            validation_params: Optional[dict],
            contacts_to_validate: int
    ):

        return self.audience_smarts_persistence.create_audience_smart(
            name=name,
            user_id=user.get('id'),
            created_by_user_id=created_by_user_id,
            use_case_alias=use_case_alias,
            validation_params=validation_params,
            data_sources=data_sources,
            contacts_to_validate=contacts_to_validate
        )

    def get_datasource(self, user: dict):
        lookalikes, count, max_page = self.lookalikes_persistence_service.get_lookalikes(
            user_id=user.get('id'), page=1, per_page=50
        )

        sources, count = self.audience_sources_persistence.get_sources(
            user_id=user.get("id"), page=1, per_page=50
        )

        source_list = [
            {
                'id': source[0],
                'name': source[1],
                'source_origin': source[2],
                'source_type': source[3],
                'created_at': source[5],
                'created_by': source[4],
                'domain': source[6],
                'total_records': source[7],
                'matched_records': source[8],
                'matched_records_status': source[9],
                'processed_records': source[10],
            }
            for source in sources
        ]

        return {"lookalikes": lookalikes, "sources": source_list}

