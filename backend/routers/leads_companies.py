from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from models import UserDomains
from services.leads_companies_delivr import AsyncCompanyLeadsService
from fastapi import APIRouter, Depends, Query
from starlette.responses import StreamingResponse

from auth_dependencies import UnlimitedUser
from dependencies import (
    check_pixel_install_domain,
    check_user_authorization_without_pixel,
)
from enums import BaseEnum

router = APIRouter()


@router.get("")
async def get_companies(
    company_service: AsyncCompanyLeadsService,
    domain: UserDomains = Depends(check_pixel_install_domain),
    user=Depends(check_user_authorization_without_pixel),
    page: int = Query(1, alias="page", ge=1, description="Page number"),
    per_page: int = Query(
        10, alias="per_page", ge=1, description="Items per page"
    ),
    from_date: int = Query(None, description="Start date in integer format"),
    to_date: int = Query(None, description="End date in integer format"),
    regions: str = Query(None, description="Comma-separated list of regions"),
    sort_by: str = Query(None, description="Field"),
    sort_order: str = Query(
        None, description="Field to sort by: 'asc' or 'desc'"
    ),
    search_query: str = Query(
        None,
        description="Search for email, first name, lastname and phone number",
    ),
    timezone_offset: float = Query(
        0, description="timezone offset in integer format"
    ),
    employees_range: str = Query(
        None, description="Number of employees in the company"
    ),
    revenue_range: str = Query(None, description="Company income range"),
    employee_visits: str = Query(
        None, description="Number of employees who visited the site"
    ),
    industry: str = Query(None, description="Company industry "),
) -> Tuple[List[Dict[str, Any]], int, int]:
    return await company_service.get_company_leads(
        pixel_id=domain.pixel_id,
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
        timezone_offset=timezone_offset,
    )


@router.get("/employess")
async def get_employees(
    company_service: AsyncCompanyLeadsService,
    page: int = Query(1, alias="page", ge=1, description="Page number"),
    per_page: int = Query(
        10, alias="per_page", ge=1, le=500, description="Items per page"
    ),
    sort_by: str = Query(None, description="Field"),
    sort_order: str = Query(
        None, description="Field to sort by: 'asc' or 'desc'"
    ),
    search_query: str = Query(
        None,
        description="Search for email, first name, lastname and phone number",
    ),
    company_id: str = Query(None),
    job_title: str = Query(None),
    department: str = Query(None),
    seniority: str = Query(None),
    regions: str = Query(None, description="Company regions "),
    user=Depends(check_user_authorization_without_pixel),
):
    return company_service.get_employees(
        company_id=company_id,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        per_page=per_page,
        department=department,
        job_title=job_title,
        seniority=seniority,
        regions=regions,
        search_query=search_query,
    )


@router.get("/employee")
def get_employees(
    company_service: AsyncCompanyLeadsService,
    company_id: str = Query(None),
    id: int = Query(None),
):
    return company_service.get_employee_by_id(
        company_id=company_id, employee_id=id
    )


@router.get("/employees/{employee_id}")
async def get_employees_by_id(
    company_service: AsyncCompanyLeadsService,
    employee_id: int,
    company_id: str = Query(None),
):
    return company_service.get_full_information_employee(
        company_id=company_id, employee_id=employee_id
    )


@router.get("/industry")
async def get_industry(
    company_service: AsyncCompanyLeadsService,
    domain: UserDomains = Depends(check_pixel_install_domain),
) -> List[str]:
    return await company_service.get_uniq_primary_industry(
        pixel_id=domain.pixel_id
    )


@router.get("/{company_id}/departments")
async def get_department(
    company_service: AsyncCompanyLeadsService, company_id: str
) -> List[str]:
    return await company_service.get_uniq_primary__departments(
        company_id=company_id
    )


@router.get("/{company_id}/seniorities")
async def get_seniority(
    company_service: AsyncCompanyLeadsService,
    company_id: str,
):
    return await company_service.get_uniq_primary__seniorities(company_id)


@router.get("/{company_id}/job-titles")
async def get_seniority(
    company_service: AsyncCompanyLeadsService,
    company_id: str,
):
    return await company_service.get_uniq_primary__job_titles(company_id)


@router.get("/download-companies")
async def download_companies(
    company_service: AsyncCompanyLeadsService,
    _user: UnlimitedUser,
    domain: UserDomains = Depends(check_pixel_install_domain),
    company_id: Optional[str] = Query(None),
    from_date: Optional[int] = Query(
        None, description="Start date in integer format"
    ),
    to_date: Optional[int] = Query(
        None, description="End date in integer format"
    ),
    regions: str = Query(None, description="Company regions "),
    employees_range: str = Query(
        None, description="Number of employees in the company"
    ),
    employee_visits: str = Query(
        None, description="Number of employees who visited the site"
    ),
    revenue_range: str = Query(None, description="Company income range"),
    industry: str = Query(None, description="Company industry "),
    search_query: Optional[str] = Query(
        None,
        description="Search for email, first name, lastname and phone number",
    ),
):
    result = await company_service.download_companies(
        pixel_id=domain.pixel_id,
        company_id=company_id,
        from_date=from_date,
        to_date=to_date,
        employee_visits=employee_visits,
        revenue_range=revenue_range,
        search_query=search_query,
        regions=regions,
        employees_range=employees_range,
        industry=industry,
    )
    if result:
        return StreamingResponse(
            result,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=data.csv"},
        )
    return BaseEnum.FAILURE


@router.get("/download-employees")
async def download_employees(
    company_service: AsyncCompanyLeadsService,
    _user: UnlimitedUser,
    company_id: str = Query(None),
    job_title: str = Query(None),
    department: str = Query(None),
    seniority: str = Query(None),
    sort_by: str = Query(None, description="Field"),
    sort_order: str = Query(
        None, description="Field to sort by: 'asc' or 'desc'"
    ),
    regions: str = Query(None, description="Comma-separated list of regions"),
    search_query: str = Query(
        None,
        description="Search for email, first name, lastname and phone number",
    ),
):
    result = company_service.download_employees(
        company_id=company_id,
        regions=regions,
        sort_by=sort_by,
        sort_order=sort_order,
        search_query=search_query,
        job_title=job_title,
        department=department,
        seniority=seniority,
    )
    if result:
        return StreamingResponse(
            result,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=data.csv"},
        )
    return BaseEnum.FAILURE


@router.get("/download-employee/{employee_id}")
async def download_employee(
    company_service: AsyncCompanyLeadsService,
    _user: UnlimitedUser,
    employee_id: int,
    company_id: str = Query(None),
):
    result = company_service.download_employee(
        company_id=company_id, employee_id=employee_id
    )
    if result:
        return StreamingResponse(
            result,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=data.csv"},
        )
    return BaseEnum.FAILURE


@router.get("/search-location")
async def search_location(
    company_service: AsyncCompanyLeadsService,
    domain: UserDomains = Depends(check_pixel_install_domain),
    start_letter: str = Query(..., min_length=3),
):
    return await company_service.search_location(
        start_letter, pixel_id=domain.pixel_id
    )


@router.get("/search-contact")
async def search_contact(
    company_service: AsyncCompanyLeadsService,
    domain: UserDomains = Depends(check_pixel_install_domain),
    start_letter: str = Query(..., min_length=3),
):
    return await company_service.search_company(
        start_letter=start_letter, pixel_id=domain.pixel_id
    )
