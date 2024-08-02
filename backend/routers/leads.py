from fastapi import APIRouter, Depends, Query
from dependencies import get_leads_service
from schemas.users import CompanyInfo, CompanyInfoResponse
from services.leads import LeadsService

router = APIRouter()


@router.get("")
async def get_leads(
        page: int = Query(1, alias="page", ge=1, description="Page number"),
        per_page: int = Query(15, alias="per_page", ge=1, le=100, description="Items per page"),
        status: str = Query("all", description="Status for leads: 'all', 'new_customers', 'existing_customers'"),
        from_date: int = Query(None, description="Start date in integer format"),
        to_date: int = Query(None, description="End date in integer format"),
        regions: str = Query(None, description="Comma-separated list of regions"),
        page_visits: int = Query(None, description="Minimum number of page visits"),
        average_time_spent: float = Query(None, description="Average time spent on the page in minutes"),
        lead_funnel: str = Query(None, description="Lead funnel stage"),
        emails: str = Query(None, description="Comma-separated list of emails"),
        recurring_visits: int = Query(None, description="Minimum number of recurring visits"),
        leads_service: LeadsService = Depends(get_leads_service)
):
    return leads_service.get_user_leads_by_filter(
        page=page,
        per_page=per_page,
        status=status,
        date_start=from_date,
        date_end=to_date,
        regions=regions,
        page_visits=page_visits,
        average_time_spent=average_time_spent,
        lead_funnel=lead_funnel,
        emails=emails,
        recurring_visits=recurring_visits
    )
