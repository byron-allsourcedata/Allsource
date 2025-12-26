from fastapi import APIRouter, Depends, Query
from starlette.responses import StreamingResponse

from auth_dependencies import UnlimitedUser
from dependencies import check_pixel_install_domain
from enums import BaseEnum
from models import UserDomains
from schemas.leads import LeadsRequest
from services.leads import LeadsService
from services.leads_delivr import AsyncLeadsService

router = APIRouter()


# @router.get("")
# async def get_leads(
#     leads_service: LeadsService,
#     domain: UserDomains = Depends(check_pixel_install_domain),
#     page: int = Query(1, alias="page", ge=1, description="Page number"),
#     per_page: int = Query(
#         10, alias="per_page", ge=1, le=500, description="Items per page"
#     ),
#     from_date: int = Query(None, description="Start date in integer format"),
#     to_date: int = Query(None, description="End date in integer format"),
#     regions: str = Query(None, description="Comma-separated list of regions"),
#     page_url: str = Query(None, description="Comma-separated list of pages"),
#     page_visits: str = Query(None, description="Minimum number of page visits"),
#     average_time_sec: str = Query(
#         None, description="average time sec on the page"
#     ),
#     behavior_type: str = Query(None, description="funnel type stage"),
#     status: str = Query(None, status="status type stage"),
#     recurring_visits: str = Query(
#         None, description="Minimum number of recurring visits"
#     ),
#     sort_by: str = Query(None, description="Field"),
#     sort_order: str = Query(
#         None, description="Field to sort by: 'asc' or 'desc'"
#     ),
#     search_query: str = Query(
#         None,
#         description="Search for email, first name, lastname and phone number",
#     ),
#     from_time: str = Query(None, description="Start time in integer format"),
#     to_time: str = Query(None, description="End time in integer format"),
#     timezone_offset: float = Query(
#         0, description="timezone offset in integer format"
#     ),
# ):
#     return leads_service.get_leads(
#         domain=domain,
#         sort_by=sort_by,
#         sort_order=sort_order,
#         page=page,
#         per_page=per_page,
#         status=status,
#         from_date=from_date,
#         to_date=to_date,
#         regions=regions,
#         page_visits=page_visits,
#         average_time_sec=average_time_sec,
#         behavior_type=behavior_type,
#         recurring_visits=recurring_visits,
#         search_query=search_query,
#         from_time=from_time,
#         to_time=to_time,
#         timezone_offset=timezone_offset,
#         page_url=page_url,
#     )


@router.get("")
async def get_leads(
    leads_service: AsyncLeadsService,
    domain: UserDomains = Depends(check_pixel_install_domain),
    # pagination
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=500, description="Items per page"),
    # sorting
    sort_by: str | None = Query(None, description="Field to sort by"),
    sort_order: str | None = Query(None, description="'asc' or 'desc'"),
    # time filters (epoch seconds)
    from_date: int | None = Query(
        None, description="Start date (epoch seconds)"
    ),
    to_date: int | None = Query(None, description="End date (epoch seconds)"),
    # additional filters (comma-separated strings from UI)
    behavior_type: str | None = Query(
        None, description="Comma-separated visitor types"
    ),
    status: str | None = Query(
        None, description="Comma-separated lead statuses (funnels)"
    ),
    regions: str | None = Query(None, description="Comma-separated regions"),
    page_url: str | None = Query(
        None, description="Comma-separated page URL tags"
    ),
    recurring_visits: str | None = Query(
        None, description="Comma-separated recurring flags"
    ),
    average_time_sec: str | None = Query(
        None, description="Comma-separated time-spent buckets"
    ),
    page_visits: str | None = Query(
        None, description="Comma-separated page-visit buckets"
    ),
    search_query: str | None = Query(None, description="Free text search"),
    # time-of-day window
    from_time: str | None = Query(None, description="From time HH:MM"),
    to_time: str | None = Query(None, description="To time HH:MM"),
    # tz offset
    timezone_offset: int = Query(0, description="Timezone offset in hours"),
):
    """
    Async ClickHouse-based leads endpoint with rich filters.
    """
    return await leads_service.get_leads(
        pixel_id=domain.pixel_id,
        page=page,
        per_page=per_page,
        from_date=from_date,
        to_date=to_date,
        timezone_offset=timezone_offset,
        require_visit_in_range=True,
        sort_by=sort_by,
        sort_order=sort_order,
        behavior_type=behavior_type,
        status=status,
        regions=regions,
        page_url=page_url,
        recurring_visits=recurring_visits,
        average_time_sec=average_time_sec,
        page_visits=page_visits,
        search_query=search_query,
        from_time=from_time,
        to_time=to_time,
    )


@router.get("/search-location")
async def search_location(
    leads_service: LeadsService,
    domain: UserDomains = Depends(check_pixel_install_domain),
    start_letter: str = Query(..., min_length=3),
):
    return leads_service.search_location(start_letter, domain)


@router.get("/search-page-url")
async def search_page_url(
    leads_service: LeadsService,
    domain: UserDomains = Depends(check_pixel_install_domain),
    start_letter: str = Query(..., min_length=2),
):
    return leads_service.search_page_url(start_letter, domain)


@router.get("/search-contact")
async def search_contact(
    leads_service: LeadsService,
    domain: UserDomains = Depends(check_pixel_install_domain),
    start_letter: str = Query(..., min_length=3),
):
    return leads_service.search_contact(start_letter, domain)


@router.post("/download_leads")
async def download_leads(
    _user: UnlimitedUser,
    leads_service: LeadsService,
    leads_request: LeadsRequest,
    domain: UserDomains = Depends(check_pixel_install_domain),
):
    result = leads_service.download_leads(
        domain=domain, leads_ids=leads_request.leads_ids
    )
    if result:
        return StreamingResponse(
            result,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=data.csv"},
        )
    return BaseEnum.FAILURE


@router.get("/download_leads")
async def download_leads(
    _user: UnlimitedUser,
    leads_service: LeadsService,
    domain: UserDomains = Depends(check_pixel_install_domain),
    from_date: int = Query(None, description="Start date in integer format"),
    to_date: int = Query(None, description="End date in integer format"),
    regions: str = Query(None, description="Comma-separated list of regions"),
    page_url: str = Query(None, description="Comma-separated list of pages"),
    page_visits: str = Query(None, description="Minimum number of page visits"),
    average_time_spent: float = Query(
        None, description="Average time spent on the page in minutes"
    ),
    behavior_type: str = Query(None, description="funnel type stage"),
    status: str = Query(None, status="status type stage"),
    recurring_visits: str = Query(
        None, description="Minimum number of recurring visits"
    ),
    sort_by: str = Query(None, description="Field"),
    sort_order: str = Query(
        None, description="Field to sort by: 'asc' or 'desc'"
    ),
    search_query: str = Query(
        None,
        description="Search for email, first name, lastname and phone number",
    ),
    from_time: str = Query(None, description="Start time in integer format"),
    to_time: str = Query(None, description="End time in integer format"),
):
    result = leads_service.download_leads(
        domain=domain,
        from_date=from_date,
        to_date=to_date,
        regions=regions,
        page_visits=page_visits,
        average_time_spent=average_time_spent,
        behavior_type=behavior_type,
        status=status,
        recurring_visits=recurring_visits,
        sort_by=sort_by,
        sort_order=sort_order,
        search_query=search_query,
        from_time=from_time,
        to_time=to_time,
        page_url=page_url,
    )
    if result:
        return StreamingResponse(
            result,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=data.csv"},
        )
    return BaseEnum.FAILURE
