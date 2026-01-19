from fastapi import APIRouter, Depends, Query, Path
from datetime import datetime, timezone
from dependencies import (
    check_user_authorization_without_pixel,
)
from services.audience_dashboard import DashboardAudienceService

router = APIRouter()


@router.get("/get-sources")
async def get_all_sources(
    dashboard_service: DashboardAudienceService,
    user: dict = Depends(check_user_authorization_without_pixel),
):
    return dashboard_service.get_sources_overview(user=user)


@router.get("")
async def get_contact(
    dashboard_service: DashboardAudienceService,
    from_date: int = Query(
        int(datetime(2024, 1, 1, tzinfo=timezone.utc).timestamp()),
        description="Start date in integer format",
    ),
    to_date: int = Query(
        int(
            datetime(
                datetime.now(timezone.utc).year,
                12,
                31,
                23,
                59,
                59,
                tzinfo=timezone.utc,
            ).timestamp()
        ),
        description="End date in integer format",
    ),
    user=Depends(check_user_authorization_without_pixel),
):
    return await dashboard_service.get_audience_dashboard_data(
        from_date=from_date, to_date=to_date, user=user
    )


@router.get("/pixel-contacts/{domain_id}")
def get_contacts_for_pixel_contacts_by_domain_id(
    dashboard_service: DashboardAudienceService,
    domain_id: int = Path(..., description="Domain_id in integer format"),
    from_date: int = Query(None, description="Start date in integer format"),
    to_date: int = Query(None, description="End date in integer format"),
    user=Depends(check_user_authorization_without_pixel),
):
    return dashboard_service.get_contacts_for_pixel_contacts_by_domain_id(
        user=user, domain_id=domain_id, from_date=from_date, to_date=to_date
    )


@router.get("/events")
def get_events(
    dashboard_service: DashboardAudienceService,
    user=Depends(check_user_authorization_without_pixel),
):
    return dashboard_service.get_events(user=user)
