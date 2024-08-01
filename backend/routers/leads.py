from fastapi import APIRouter, Depends, Query
from dependencies import get_leads_service
from schemas.users import CompanyInfo, CompanyInfoResponse
from services.leads import LeadsService

router = APIRouter()


@router.get("")
async def get_leads(
        page: int = Query(1, alias="page", ge=1, description="Page number"),
        per_page: int = Query(15, alias="per_page", ge=1, le=100, description="Items per page"),
        filter: str = Query("all", description="Filter for leads: 'all', 'new_customers', 'existing_customers'"),
        leads_service: LeadsService = Depends(get_leads_service)
):
    return leads_service.get_leads(page, per_page, filter)
