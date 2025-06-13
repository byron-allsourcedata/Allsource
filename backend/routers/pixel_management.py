from fastapi import APIRouter, Depends, Query
from fastapi.params import Path

from dependencies import (
    get_pixel_management_service,
    check_user_authorization_without_pixel,
)
from services.pixel_management import PixelManagementService

router = APIRouter()


@router.get("")
async def get_pixel_management_data(pixel_management_service: PixelManagementService = Depends(get_pixel_management_service),
                                    user: dict = Depends(check_user_authorization_without_pixel)):
    return pixel_management_service.get_pixel_management_data(user_id=user.get('id'))

# @router.get("/pixel-contacts/{domain_id}")
# def get_contacts_for_pixel_contacts_by_domain_id(
#     domain_id: int = Path(..., description="Domain_id in integer format"),
#     from_date: int = Query(None, description="Start date in integer format"),
#     to_date: int = Query(None, description="End date in integer format"),
#     dashboard_service: DashboardAudienceService = Depends(
#         get_audience_dashboard_service
#     ),
#     user=Depends(check_user_authorization),
# ):
#     return dashboard_service.get_contacts_for_pixel_contacts_by_domain_id(
#         user=user, domain_id=domain_id, from_date=from_date, to_date=to_date
#     )
