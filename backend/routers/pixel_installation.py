from fastapi import APIRouter, Depends

from schemas.pixel_installation import PixelInstallationRequest
from services.pixel_installation import PixelInstallationService
from dependencies import get_pixel_installation_service, get_users_auth_service
from services.users_auth import UsersAuth

router = APIRouter()

@router.get("/manually")
async def manual(manual: PixelInstallationService = Depends(get_pixel_installation_service)):
    result_status = manual.get_manual()
    return result_status

@router.post("/pixel_installed")
async def manual(pixel_installation_request: PixelInstallationRequest, users_service: UsersAuth = Depends(get_users_auth_service)):
    result_status = users_service.set_pixel_installed(pixel_installation_request)
    return result_status

@router.get("/google-tag")
async def google_tag(google_tag: PixelInstallationService = Depends(get_pixel_installation_service)):
    result_status = google_tag.get_my_info()
    return result_status


@router.get("/cms")
async def cms(cms: PixelInstallationService = Depends(get_pixel_installation_service)):
    result_status = cms.get_my_info()
    return result_status
