from fastapi import APIRouter, Depends, Query
from starlette.responses import StreamingResponse

from dependencies import get_companies_service
from enums import BaseEnum
from schemas.companies import CompaniesRequest
from services.companies import CompanyService

router = APIRouter()


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
        employees_range: str = Query(None, description="Number of employees in the company"),
        revenue_range: str = Query(None, description="Company income range"),
        employee_visits: str = Query(None, description="Number of employees who visited the site"),
        industry: str = Query(None, description="Company industry "),
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
        employees_range=employees_range,
        employee_visits=employee_visits,
        revenue_range=revenue_range,
        industry=industry,
        search_query=search_query,
        timezone_offset=timezone_offset
    )


@router.get("/industry")
async def get_industry(company_service: CompanyService = Depends(get_companies_service)):
    return company_service.get_uniq_primary_industry()

@router.post("/download-company")
async def download_company(companies_request: CompaniesRequest,
                         company_service: CompanyService = Depends(get_companies_service)):
    result = company_service.download_companies(companies_ids=companies_request.companies_ids)
    if result:
        return StreamingResponse(result, media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=data.csv"})
    return BaseEnum.FAILURE

@router.get("/download-companies")
async def download_companies(
    
        from_date: int = Query(None, description="Start date in integer format"),
        to_date: int = Query(None, description="End date in integer format"),
        regions: str = Query(None, description="Comma-separated list of regions"),
        search_query: str = Query(None, description="Search for email, first name, lastname and phone number"),
        timezone_offset: float = Query(0, description="timezone offset in integer format"),
        company_service: CompanyService = Depends(get_companies_service)):
    result = company_service.download_companies(from_date=from_date, to_date=to_date, regions=regions, search_query=search_query, timezone_offset=timezone_offset)
    if result:
        return StreamingResponse(result, media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=data.csv"})
    return BaseEnum.FAILURE


@router.get("/search-location")
async def search_location(start_letter: str = Query(..., min_length=3),
                          company_service: CompanyService = Depends(get_companies_service)):
    return company_service.search_location(start_letter)


@router.get("/search-contact")
async def search_contact(start_letter: str = Query(..., min_length=3),
                         company_service: CompanyService = Depends(get_companies_service)):
    return company_service.search_company(start_letter)





