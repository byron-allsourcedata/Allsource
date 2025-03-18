from fastapi import APIRouter, Depends, Query
from dependencies import get_audience_smarts_service, check_user_authorization
from services.audience_smarts import AudienceSmartsService
from schemas.audience import SmartsAudienceObjectResponse
from typing import Optional
from datetime import datetime
from uuid import UUID

router = APIRouter(dependencies=[Depends(check_user_authorization)])

@router.get("", response_model=SmartsAudienceObjectResponse)
def get_audience_smarts(
        user=Depends(check_user_authorization),
        page: int = Query(1, alias="page", ge=1),
        per_page: int = Query(10, alias="per_page", ge=1, le=500),
        sort_by: str = Query(None),
        sort_order: str = Query(None),
        from_date: int = Query(None),
        to_date: int = Query(None),
        name: Optional[str] = Query(None),
        status: Optional[str] = Query(None),
        use_cases: Optional[str] = Query(None),
        created_date_start: Optional[datetime] = Query(None),
        created_date_end: Optional[datetime] = Query(None),
        audience_smarts_service: AudienceSmartsService = Depends(get_audience_smarts_service)
):
    smarts_audience_list, count = audience_smarts_service.get_audience_smarts(
        user=user,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        per_page=per_page,
        from_date=from_date,
        to_date=to_date,
        name=name,
        status=status,
        use_cases=use_cases,
        created_date_start=created_date_start,
        created_date_end=created_date_end,
    )

    return {
        "audience_smarts_list": smarts_audience_list,
        "count": count
    }

@router.delete("/{id}", response_model=bool)
def delete_audience_smart(
        id: UUID,
        audience_smarts_service: AudienceSmartsService = Depends(get_audience_smarts_service)
):
    return audience_smarts_service.delete_audience_smart(
        id=id
    )
