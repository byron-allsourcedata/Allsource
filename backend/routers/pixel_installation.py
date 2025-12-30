import logging
from fastapi.responses import JSONResponse
from typing_extensions import deprecated

from fastapi import APIRouter, Depends, HTTPException, Query
import os

from db_dependencies import Db
from dependencies import (
    SecretPixelKey,
    check_user_authorization_without_pixel,
    check_user_authentication,
    check_domain,
    UserDomainsService,
)
from domains.mailing.exceptions import WaitMailTimeoutException
from domains.pixel.mailing.schemas import MailingUserData, ManualPixelRequest
from domains.pixel.mailing.service import (
    MailingPixelService,
)
from enums import BaseEnum
from models.users import User
from schemas.pixel_installation import (
    DataProvidersResponse,
    EmailFormRequest,
    ManualFormResponse,
    PixelInstallationResponse,
    DomainsListResponse,
)
from schemas.domains import UpdateDomain
from services.pixel_installation import PixelInstallationService

logger = logging.getLogger(__name__)
router = APIRouter()
SECRET_PIXEL_KEY = os.getenv("SECRET_PIXEL_KEY")


@router.get("/manually", response_model=ManualFormResponse)
async def manual(
    pixel_installation_service: PixelInstallationService,
    user: dict = Depends(check_user_authorization_without_pixel),
    domain=Depends(check_domain),
):
    (
        manual_result,
        pixel_client_id,
    ) = await pixel_installation_service.get_pixel_script(user, domain)
    return ManualFormResponse(
        manual=manual_result, pixel_client_id=pixel_client_id
    )


@router.post("/send-pixel-code")
async def send_pixel_code_in_email(
    email_form: EmailFormRequest,
    db: Db,
    pixel_mailing: MailingPixelService,
    user: User = Depends(check_user_authorization_without_pixel),
    domain=Depends(check_domain),
):
    receiver_email = email_form.email
    receiver_name = receiver_email.split("@")[0]

    try:
        await pixel_mailing.send_normal_pixel_code(
            user=user,
            domain=domain,
            user_data=MailingUserData(
                email=receiver_email,
                full_name=receiver_name,
            ),
            manual_pixel_req=ManualPixelRequest(
                domain_id=domain.id,
                user_id=user["id"],
            ),
        )
    except WaitMailTimeoutException:
        return JSONResponse(
            status_code=429,
            content={
                "detail": "Email was already sent. Please wait a few minutes and try again later."
            },
        )

    db.commit()

    return BaseEnum.SUCCESS


@router.put("/update-domain")
def update_domain(
    request: UpdateDomain,
    domain_service: UserDomainsService,
    user=Depends(check_user_authentication),
):
    domain_service.update_domain(user.get("id"), request)
    return True


@router.get("/google-tag")
async def google_tag(
    user: User = Depends(check_user_authorization_without_pixel),
    domain=Depends(check_domain),
):
    return BaseEnum.SUCCESS


@router.get("/cms", response_model=ManualFormResponse)
async def cms(
    pixel_installation_service: PixelInstallationService,
    user: dict = Depends(check_user_authorization_without_pixel),
    domain=Depends(check_domain),
):
    (
        manual_result,
        pixel_client_id,
    ) = await pixel_installation_service.get_pixel_script(user, domain)
    return ManualFormResponse(
        manual=manual_result, pixel_client_id=pixel_client_id
    )


@router.get(
    "/check-pixel-installation-status",
    response_model=PixelInstallationResponse | None,
)
async def check_pixel_installation_status(
    pixel_installation_service: PixelInstallationService,
    domain: str = Query(
        ..., description="The exact domain to check, e.g. example.com"
    ),
    user: dict = Depends(check_user_authorization_without_pixel),
):
    return pixel_installation_service.check_pixel_installation_status(
        user, domain
    )


@deprecated("use /verified-data-providers instead")
@router.get("/verified_domains", response_model=DomainsListResponse)
def get_verify_domains(
    _secret_key: SecretPixelKey, domain_service: UserDomainsService
):
    domain_list_name = domain_service.get_verify_domains()
    return DomainsListResponse(domains=domain_list_name)


@router.get("/verified-data-providers", response_model=DataProvidersResponse)
def get_verified_data_providers(
    _secret_key: SecretPixelKey, domain_service: UserDomainsService
):
    data_providers_ids = domain_service.get_verified_data_providers()
    return DataProvidersResponse(data_providers_ids=data_providers_ids)
