from fastapi import APIRouter, Depends, Query
from datetime import datetime, timezone
from dependencies import get_audience_dashboard_service
from dependencies import check_user_authorization
from services.audience_dashboard import DashboardAudienceService

router = APIRouter()


@router.get("")
def get_contact(
        from_date: int = Query(
            int(datetime(2024, 1, 1, tzinfo=timezone.utc).timestamp()),
            description="Start date in integer format"
        ),
        to_date: int = Query(
            int(datetime(datetime.now(timezone.utc).year, 12, 31, 23, 59, 59, tzinfo=timezone.utc).timestamp()),
            description="End date in integer format"
        ),
        dashboard_service: DashboardAudienceService = Depends(get_audience_dashboard_service),
        user=Depends(check_user_authorization)):
    return dashboard_service.get_audience_dashboard_data(from_date=from_date, to_date=to_date, user=user)
