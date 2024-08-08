from fastapi import APIRouter, Depends, Query

from dependencies import get_audience_service
from schemas.audience import AudienceInfoResponse, AudienceRequest
from typing import List, Optional
from services.audience import AudienceService

router = APIRouter()


@router.get("")
async def get_audience(page: int = Query(1, alias="page", ge=1, description="Page number"),
                       per_page: int = Query(15, alias="per_page", ge=1, le=100, description="Items per page"),
                       sort_by: str = Query(None, description="Field"),
                       sort_order: str = Query(None, description="Field to sort by: 'asc' or 'desc'"),
                       audience_service: AudienceService = Depends(get_audience_service)):
    return audience_service.get_audience(page=page, per_page=per_page, sort_by=sort_by, sort_order=sort_order)


@router.get("/leads")
async def get_leads(
        page: int = Query(1, alias="page", ge=1, description="Page number"),
        per_page: int = Query(15, alias="per_page", ge=1, le=100, description="Items per page"),
        regions: Optional[List[str]] = Query(None),
        professions: Optional[List[str]] = Query(None),
        ages: Optional[List[int]] = Query(None),
        genders: Optional[List[str]] = Query(None),
        net_worths: Optional[List[int]] = Query(None),
        interest_list: Optional[List[str]] = Query(None),
        not_in_existing_lists: Optional[List[str]] = Query(None),
        audience_service: AudienceService = Depends(get_audience_service)):
    return audience_service.get_leads_for_build_an_audience(page=page, per_page=per_page,
                                                            regions=regions, professions=professions,
                                                            ages=ages,
                                                            genders=genders, net_worths=net_worths,
                                                            interest_list=interest_list,
                                                            not_in_existing_lists=not_in_existing_lists)


@router.get("/list")
async def get_user_audience_list(audience_service: AudienceService = Depends(get_audience_service)):
    return audience_service.get_user_audience_list()


@router.post("", response_model=AudienceInfoResponse)
async def post_audience(audience_request: AudienceRequest,
                        audience_service: AudienceService = Depends(get_audience_service)):
    result = audience_service.post_audience(audience_request.leads_ids, audience_request.new_audience_name)
    return AudienceInfoResponse(id=result.get('id'), status=result['status'])


@router.put("", response_model=AudienceInfoResponse)
async def put_audience(audience_request: AudienceRequest,
                       audience_service: AudienceService = Depends(get_audience_service)):
    return AudienceInfoResponse(
        status=audience_service.put_audience(leads_ids=audience_request.leads_ids,
                                             remove_leads_ids=audience_request.remove_leads_ids,
                                             audience_ids=audience_request.audience_ids,
                                             new_audience_name=audience_request.new_audience_name))


@router.delete("", response_model=AudienceInfoResponse)
async def delete_audience(audience_request: AudienceRequest,
                          audience_service: AudienceService = Depends(get_audience_service)):
    return AudienceInfoResponse(status=audience_service.delete_audience(audience_request.audience_ids))
