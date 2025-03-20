import logging
from typing import Optional
from schemas.audience import SmartsAudienceObjectResponse
from persistence.audience_smarts import AudienceSmartsPersistence
from models.users import User

logger = logging.getLogger(__name__)

class AudienceSmartsService:
    def __init__(self, audience_smarts_persistence: AudienceSmartsPersistence):
        self.audience_smarts_persistence = audience_smarts_persistence

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
            statuses: Optional[str] = None,
            use_cases: Optional[str] = None
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