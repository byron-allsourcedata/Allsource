from fastapi import APIRouter, Depends, Query
from dependencies import get_audience_sources_service, check_user_authorization
from services.audience_sources import AudienceSourceService
from schemas.audience import HeadingSubstitutionRequest

router = APIRouter()


@router.get("")
def get_sources(
        user=Depends(check_user_authorization),
        page: int = Query(1, alias="page", ge=1, description="Page number"),
        per_page: int = Query(15, alias="per_page", ge=1, le=500, description="Items per page"),
        sort_by: str = Query(None, description="Field"),
        sort_order: str = Query(None, description="Field to sort by: 'asc' or 'desc'"),
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)
):
    return sources_service.get_sources(
        user=user,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        per_page=per_page,
    )

@router.post("/heading-substitution")
def substitution_headings(
        payload: HeadingSubstitutionRequest,
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)
):
    return sources_service.substitution_headings(payload.headings)