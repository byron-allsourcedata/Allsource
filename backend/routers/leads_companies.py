from fastapi import APIRouter, Depends, Query
from starlette.responses import StreamingResponse

from dependencies import get_companies_service, check_user_company
from enums import BaseEnum
from schemas.leads import LeadsRequest
from services.companies import CompanyService

router = APIRouter(dependencies=[Depends(check_user_company)])


@router.get("")
async def get_companies(
        page: int = Query(1, alias="page", ge=1, description="Page number"),
        per_page: int = Query(15, alias="per_page", ge=1, le=500, description="Items per page"),
        from_date: int = Query(None, description="Start date in integer format"),
        to_date: int = Query(None, description="End date in integer format"),
        regions: str = Query(None, description="Comma-separated list of regions"),
        sort_by: str = Query(None, description="Field"),
        sort_order: str = Query(None, description="Field to sort by: 'asc' or 'desc'"),
        search_query: str = Query(None, description="Search for email, first name, lastname and phone number"),
        timezone_offset: float = Query(0, description="timezone offset in integer format"),
        company_service: CompanyService = Depends(get_companies_service)
):
    return company_service.get_companies(
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        per_page=per_page,
        from_date=from_date,
        to_date=to_date,
        regions=regions,
        search_query=search_query,
        timezone_offset=timezone_offset
    )


# @router.get("/search-location")
# async def search_location(start_letter: str = Query(..., min_length=3),
#                           leads_service: LeadsService = Depends(get_leads_service)):
#     return leads_service.search_location(start_letter)
#
#
# @router.get("/search-contact")
# async def search_contact(start_letter: str = Query(..., min_length=3),
#                          leads_service: LeadsService = Depends(get_leads_service)):
#     return leads_service.search_contact(start_letter)





