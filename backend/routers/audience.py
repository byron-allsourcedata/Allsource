from fastapi import APIRouter, Depends, Query

from dependencies import get_audience_service
from schemas.audience import AudienceInfoResponse, AudienceRequest

from services.audience import AudienceService

router = APIRouter()


@router.get("")
async def get_audience(page: int = Query(1, alias="page", ge=1, description="Page number"),
                       per_page: int = Query(15, alias="per_page", ge=1, le=100, description="Items per page"),
                       audience_service: AudienceService = Depends(get_audience_service)):
    return audience_service.get_audience(page, per_page)


@router.post("", response_model=AudienceInfoResponse)
async def post_audience(audience_request: AudienceRequest,
                        audience_service: AudienceService = Depends(get_audience_service)):
    return AudienceInfoResponse(
        status=audience_service.post_audience(audience_request.leads_ids, audience_request.audience_name))


@router.put("", response_model=AudienceInfoResponse)
async def put_audience(audience_request: AudienceRequest,
                       audience_service: AudienceService = Depends(get_audience_service)):
    return AudienceInfoResponse(
        status=audience_service.put_audience(audience_request.leads_ids, audience_request.remove_leads_ids,
                                             audience_request.audience_id, audience_request.new_audience_name))


@router.delete("", response_model=AudienceInfoResponse)
async def delete_audience(audience_request: AudienceRequest,
                          audience_service: AudienceService = Depends(get_audience_service)):
    return AudienceInfoResponse(status=audience_service.delete_audience(audience_request.audience_id))
