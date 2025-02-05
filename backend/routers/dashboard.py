from fastapi import APIRouter, Depends, Query
from datetime import datetime, timezone
from dependencies import get_dashboard_service
from typing import Union
from dependencies import check_user_authorization
from schemas.dashboard import ContactResponse, RevenueResponse
from services.dashboard import DashboardService

router = APIRouter()

@router.get("/contact", response_model=ContactResponse)
def get_contact(
        from_date: int = Query(
            int(datetime(2024, 1, 1, tzinfo=timezone.utc).timestamp()), 
            description="Start date in integer format"
        ),
        to_date: int = Query(
            int(datetime(datetime.now(timezone.utc).year, 12, 31, 23, 59, 59, tzinfo=timezone.utc).timestamp()), 
            description="End date in integer format"
        ),
        dashboard_service: DashboardService = Depends(get_dashboard_service),
        user=Depends(check_user_authorization)):
    return dashboard_service.get_contact(from_date=from_date, to_date=to_date)

@router.get("/revenue", response_model=Union[RevenueResponse, None])
def get_revenue(
        from_date: int = Query(None, description="Start date in integer format"),
        to_date: int = Query(None, description="End date in integer format"),
        dashboard_service: DashboardService = Depends(get_dashboard_service),
        user=Depends(check_user_authorization)):
    return dashboard_service.get_revenue(from_date=from_date, to_date=to_date, user=user)
