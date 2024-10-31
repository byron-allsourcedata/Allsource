from fastapi import APIRouter, Depends, Query
from dependencies import get_dashboard_service
from dependencies import check_user_authorization
from schemas.dashboard import ContactResponse, RevenueResponse
from services.dashboard import DashboardService

router = APIRouter()


@router.get("/contact", response_model=ContactResponse)
def get_contact(
        from_date: int = Query(None, description="Start date in integer format"),
        to_date: int = Query(None, description="End date in integer format"),
        dashboard_service: DashboardService = Depends(get_dashboard_service),
        user=Depends(check_user_authorization)):
    return dashboard_service.get_contact(from_date=from_date, to_date=to_date)


@router.get("/revenue", response_model=RevenueResponse)
def get_revenue(
        from_date: int = Query(None, description="Start date in integer format"),
        to_date: int = Query(None, description="End date in integer format"),
        dashboard_service: DashboardService = Depends(get_dashboard_service),
        user=Depends(check_user_authorization)):
    return dashboard_service.get_revenue(from_date=from_date, to_date=to_date, user=user)
