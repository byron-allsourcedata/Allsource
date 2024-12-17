import logging

from fastapi import APIRouter, Depends

from dependencies import get_pixel_installation_service, check_user_authorization_without_pixel, \
    check_user_authentication, check_domain
from enums import PixelStatus, BaseEnum
from models.users import User
from schemas.pixel_installation import PixelInstallationRequest, EmailFormRequest, ManualFormResponse
from schemas.users import PixelFormResponse
from services.pixel_installation import PixelInstallationService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/manually", response_model=ManualFormResponse)
async def manual(pixel_installation_service: PixelInstallationService = Depends(get_pixel_installation_service),
                 user: User = Depends(check_user_authorization_without_pixel), domain=Depends(check_domain)):
    manual_result, pixel_client_id = pixel_installation_service.get_manual(user, domain)
    return ManualFormResponse(manual=manual_result, pixel_client_id=pixel_client_id)


@router.post("/send-pixel-code")
async def send_pixel_code_in_email(email_form: EmailFormRequest,
                                   pixel_installation_service: PixelInstallationService = Depends(
                                       get_pixel_installation_service),
                                   user: User = Depends(check_user_authorization_without_pixel),
                                   domain=Depends(check_domain)):
    return pixel_installation_service.send_pixel_code_in_email(email_form.email, user, domain)


@router.post("/check-pixel-installed-parse", response_model=PixelFormResponse)
async def manual(pixel_installation_request: PixelInstallationRequest,
                 pixel_installation_service: PixelInstallationService = Depends(get_pixel_installation_service),
                 user: User = Depends(check_user_authentication), domain=Depends(check_domain)):
    result = pixel_installation_service.check_pixel_installed_via_parse(pixel_installation_request.url, user, domain)
    if result['success']:
        status = PixelStatus.PIXEL_CODE_INSTALLED
    else:
        status = PixelStatus.PIXEL_CODE_PARSE_FAILED
    return PixelFormResponse(status=status)


@router.get("/google-tag")
async def google_tag(user: User = Depends(check_user_authorization_without_pixel), domain=Depends(check_domain)):
    return BaseEnum.SUCCESS


@router.get("/cms", response_model=ManualFormResponse)
async def cms(pixel_installation_service: PixelInstallationService = Depends(get_pixel_installation_service),
              user: User = Depends(check_user_authorization_without_pixel), domain=Depends(check_domain)):
    manual_result, pixel_client_id = pixel_installation_service.get_manual(user, domain)
    return ManualFormResponse(manual=manual_result, pixel_client_id=pixel_client_id)
