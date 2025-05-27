import logging

from fastapi import APIRouter, Depends, Query

from dependencies import get_pixel_installation_service, check_user_authorization_without_pixel, \
    check_user_authentication, check_domain, get_domain_service, UserDomainsService
from enums import PixelStatus, BaseEnum
from typing import Optional
from models.users import User
from schemas.pixel_installation import PixelInstallationRequest, EmailFormRequest, ManualFormResponse, \
    PixelInstallationResponse
from schemas.users import PixelFormResponse
from schemas.domains import UpdateDomain
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

@router.put('/update-domain')
def update_domain(request: UpdateDomain,
                domain_service: UserDomainsService = Depends(get_domain_service),
                user=Depends(check_user_authentication)):
    domain_service.update_domain(user.get('id'), request)
    return True

@router.get("/google-tag")
async def google_tag(user: User = Depends(check_user_authorization_without_pixel), domain=Depends(check_domain)):
    return BaseEnum.SUCCESS


@router.get("/cms", response_model=ManualFormResponse)
async def cms(pixel_installation_service: PixelInstallationService = Depends(get_pixel_installation_service),
              user: User = Depends(check_user_authorization_without_pixel), domain=Depends(check_domain)):
    manual_result, pixel_client_id = pixel_installation_service.get_manual(user, domain)
    return ManualFormResponse(manual=manual_result, pixel_client_id=pixel_client_id)

@router.get("/check-pixel-installation-status", response_model=Optional[PixelInstallationResponse])
async def check_pixel_installation_status(
        domain: str = Query(..., description="The exact domain to check, e.g. example.com"),
        pixel_installation_service: PixelInstallationService = Depends(get_pixel_installation_service),
        user: dict = Depends(check_user_authorization_without_pixel)
):
    return pixel_installation_service.check_pixel_installation_status(user, domain)
