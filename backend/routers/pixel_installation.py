from fastapi import APIRouter, Depends

from schemas.install_pixel import PixelInstallationRequest
from services.pixel_installation import PixelInstallationService
from dependencies import get_pixel_installation_service


router = APIRouter()

@router.get("/manually")
async def manual(manual: PixelInstallationService = Depends(get_pixel_installation_service)):
    result_status = manual.get_manual()
    return result_status

@router.post("/pixel_installed")
async def manual(pixel_installation_request: PixelInstallationRequest, manual: PixelInstallationService = Depends(get_pixel_installation_service)):
    result_status = manual.pixel_installed(pixel_installation_request)
    return result_status

@router.get("/google-tag")
async def google_tag(google_tag: PixelInstallationService = Depends(get_pixel_installation_service)):
    result_status = google_tag.get_my_info()
    return result_status


@router.get("/cms")
async def cms(cms: PixelInstallationService = Depends(get_pixel_installation_service)):
    result_status = cms.get_my_info()
    return result_status
