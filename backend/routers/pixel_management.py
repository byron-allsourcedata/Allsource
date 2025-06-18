from fastapi import APIRouter, Depends, Query
from fastapi.params import Path

from dependencies import (
    check_user_authorization_without_pixel,
)
from services.pixel_management import PixelManagementService

router = APIRouter()


@router.get("")
async def get_pixel_management_data(
    pixel_management_service: PixelManagementService,
    user: dict = Depends(check_user_authorization_without_pixel),
):
    return pixel_management_service.get_pixel_management_data(
        user_id=user.get("id")
    )


@router.get("/{action}/{domain_id}")
async def get_pixel_script(
    action: str,
    domain_id: int,
    pixel_management_service: PixelManagementService,
    user: dict = Depends(check_user_authorization_without_pixel),
):
    return pixel_management_service.get_pixel_script(
        action=action,
        domain_id=domain_id,
    )
