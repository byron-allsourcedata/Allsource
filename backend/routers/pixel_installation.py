from fastapi import APIRouter, Depends
from services.pixel_installation import PixelInstallationService
from dependencies import get_pixel_installation_service


router = APIRouter()


@router.get("/manually")
async def manual(manual: PixelInstallationService = Depends(get_pixel_installation_service)):
    result_status = manual.get_my_info()
    return result_status


@router.get("/google-tag")
async def google_tag(google_tag: PixelInstallationService = Depends(get_pixel_installation_service)):
    result_status = google_tag.get_my_info()
    return result_status


@router.get("/cms")
async def cms(cms: PixelInstallationService = Depends(get_pixel_installation_service)):
    result_status = cms.get_my_info()
    return result_status
