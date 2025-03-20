from fastapi import APIRouter, Depends, Query
from dependencies import get_audience_smarts_service, check_user_authorization_without_pixel
from services.audience_smarts import AudienceSmartsService
from schemas.audience import SmartsAudienceObjectResponse, UpdateSmartAudienceRequest
from typing import Optional
from uuid import UUID

router = APIRouter(dependencies=[Depends(check_user_authorization_without_pixel)])

@router.get("", response_model=SmartsAudienceObjectResponse)
def get_audience_smarts(
        user=Depends(check_user_authorization_without_pixel),
        page: int = Query(1, alias="page", ge=1),
        per_page: int = Query(10, alias="per_page", ge=1, le=500),
        sort_by: str = Query(None),
        sort_order: str = Query(None),
        from_date: int = Query(None),
        to_date: int = Query(None),
        search_query: Optional[str] = Query(None),
        statuses: Optional[str] = Query(None),
        use_cases: Optional[str] = Query(None),
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
        search_query=search_query,
        statuses=statuses,
        use_cases=use_cases
    )

    return {
        "audience_smarts_list": smarts_audience_list,
        "count": count
    }


@router.get("/search")
def search_audience_smart(
    start_letter: str = Query(..., min_length=3),
    audience_smarts_service: AudienceSmartsService = Depends(get_audience_smarts_service),
    user: dict = Depends(check_user_authorization_without_pixel)):
    return audience_smarts_service.search_audience_smart(start_letter, user=user)


@router.delete("/{id}", response_model=bool)
def delete_audience_smart(
        id: UUID,
        audience_smarts_service: AudienceSmartsService = Depends(get_audience_smarts_service)
):
    return audience_smarts_service.delete_audience_smart(
        id=id
    )


@router.put("/{id}")
def update_audience_smart(
        id: UUID,
        payload: UpdateSmartAudienceRequest,
        audience_smarts_service: AudienceSmartsService = Depends(get_audience_smarts_service),
):
    return audience_smarts_service.update_audience_smart(
        id=id, new_name=payload.new_name
    )