from datetime import datetime
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
            name: Optional[str] = None,
            status: Optional[str] = None,
            use_cases: Optional[str] = None,
            created_date_start: Optional[datetime] = None,
            created_date_end: Optional[datetime] = None
    ) -> SmartsAudienceObjectResponse:
        audience_smarts, count = self.audience_smarts_persistence.get_audience_smarts(
            user_id=user.get("id"),
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order,
            from_date=from_date,
            to_date=to_date,
            name=name,
            status=status,
            use_cases=use_cases,
            created_date_start=created_date_start,
            created_date_end=created_date_end
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

    def delete_audience_smart(self, id) -> bool:
        count_deleted = self.audience_smarts_persistence.delete_audience_smart(id)
        return count_deleted > 0