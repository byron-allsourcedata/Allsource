from fastapi import APIRouter, Depends, Query
from starlette.responses import StreamingResponse

from dependencies import get_leads_service
from enums import BaseEnum
from schemas.leads import LeadsRequest
from services.leads import LeadsService

router = APIRouter()


@router.get("")
async def get_leads(
        page: int = Query(1, alias="page", ge=1, description="Page number"),
        per_page: int = Query(15, alias="per_page", ge=1, le=500, description="Items per page"),
        from_date: int = Query(None, description="Start date in integer format"),
        to_date: int = Query(None, description="End date in integer format"),
        regions: str = Query(None, description="Comma-separated list of regions"),
        page_visits: str = Query(None, description="Minimum number of page visits"),
        average_time_sec: str = Query(None, description="average time sec on the page"),
        behavior_type: str = Query(None, description="funnel type stage"),
        status: str = Query(None, status="status type stage"),
        recurring_visits: str = Query(None, description="Minimum number of recurring visits"),
        sort_by: str = Query(None, description="Field"),
        sort_order: str = Query(None, description="Field to sort by: 'asc' or 'desc'"),
        search_query: str = Query(None, description="Search for email, first name, lastname and phone number"),
        from_time: str = Query(None, description="Start time in integer format"),
        to_time: str = Query(None, description="End time in integer format"),
        timezone_offset: int = Query(0, description="timezone offset in integer format"),
        leads_service: LeadsService = Depends(get_leads_service)
):
    return leads_service.get_leads(
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        per_page=per_page,
        status=status,
        from_date=from_date,
        to_date=to_date,
        regions=regions,
        page_visits=page_visits,
        average_time_sec=average_time_sec,
        behavior_type=behavior_type,
        recurring_visits=recurring_visits,
        search_query=search_query,
        from_time=from_time,
        to_time=to_time,
        timezone_offset=timezone_offset
    )


@router.get("/search-location")
async def search_location(start_letter: str = Query(..., min_length=3),
                          leads_service: LeadsService = Depends(get_leads_service)):
    return leads_service.search_location(start_letter)


@router.get("/search-contact")
async def search_contact(start_letter: str = Query(..., min_length=3),
                         leads_service: LeadsService = Depends(get_leads_service)):
    return leads_service.search_contact(start_letter)


@router.post("/download_leads")
async def download_leads(leads_request: LeadsRequest,
                         leads_service: LeadsService = Depends(get_leads_service)):
    result = leads_service.download_leads(leads_ids=leads_request.leads_ids)
    if result:
        return StreamingResponse(result, media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=data.csv"})
    return BaseEnum.FAILURE


@router.get("/download_leads")
async def download_leads(
        from_date: int = Query(None, description="Start date in integer format"),
        to_date: int = Query(None, description="End date in integer format"),
        regions: str = Query(None, description="Comma-separated list of regions"),
        page_visits: str = Query(None, description="Minimum number of page visits"),
        average_time_spent: float = Query(None, description="Average time spent on the page in minutes"),
        behavior_type: str = Query(None, description="funnel type stage"),
        status: str = Query(None, status="status type stage"),
        recurring_visits: str = Query(None, description="Minimum number of recurring visits"),
        sort_by: str = Query(None, description="Field"),
        sort_order: str = Query(None, description="Field to sort by: 'asc' or 'desc'"),
        search_query: str = Query(None, description="Search for email, first name, lastname and phone number"),
        from_time: str = Query(None, description="Start time in integer format"),
        to_time: str = Query(None, description="End time in integer format"),
        leads_service: LeadsService = Depends(get_leads_service)):
    result = leads_service.download_leads(from_date=from_date, to_date=to_date, regions=regions,
                                          page_visits=page_visits, average_time_spent=average_time_spent,
                                          behavior_type=behavior_type, status=status, recurring_visits=recurring_visits,
                                          sort_by=sort_by,
                                          sort_order=sort_order, search_query=search_query, from_time=from_time,
                                          to_time=to_time)
    if result:
        return StreamingResponse(result, media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=data.csv"})
    return BaseEnum.FAILURE
