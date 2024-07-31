from fastapi import APIRouter, Depends, Query
from dependencies import get_company_info_service, get_audience_service
from schemas.users import CompanyInfo, CompanyInfoResponse, AudienceRequest
from services.audience import AudienceService
from services.company_info import CompanyInfoService

router = APIRouter()


@router.get("")
async def get_audience(page: int = Query(1, alias="page", ge=1, description="Page number"),
                       per_page: int = Query(15, alias="per_page", ge=1, le=100, description="Items per page"),
                       audience_service: AudienceService = Depends(get_audience_service)):
    return audience_service.get_audience(page, per_page)


@router.post("")
async def post_audience(audience_request: AudienceRequest,
                        audience_service: AudienceService = Depends(get_audience_service)):
    return audience_service.post_audience(audience_request.leads_ids, audience_request.audience_name)
