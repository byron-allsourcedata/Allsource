from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.params import Path
from domains.mailing.exceptions import WaitMailTimeoutException
from domains.pixel.mailing.exceptions import (
    PixelScriptNotFound,
    TemplateNotFound,
    UnknownScriptType,
)
from domains.pixel.mailing.service import MailingPixelService
from enums import BaseEnum
from schemas.pixel_management import EmailFormRequest

from dependencies import (
    check_user_authorization_without_pixel,
    check_domain,
)
from services.pixel_installation import PixelInstallationService
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


@router.get("/additional_scripts")
async def get_additional_scripts_info(
    domain_id: int,
    pixel_management_service: PixelManagementService,
    user: dict = Depends(check_user_authorization_without_pixel),
):
    return pixel_management_service.get_additional_scripts_info(
        user_id=user.get("id"), domain_id=domain_id
    )


@router.get("/{action}/{domain_id}")
async def get_pixel_script(
    action: str,
    domain_id: int,
    pixel_management_service: PixelManagementService,
    user: dict = Depends(check_user_authorization_without_pixel),
):
    return pixel_management_service.get_pixel_scripts(
        action=action,
        domain_id=domain_id,
    )


@router.post("/send-pixel-code")
async def send_pixel_code_in_email(
    email_form: EmailFormRequest,
    pixel_mailing: MailingPixelService,
    user: dict = Depends(check_user_authorization_without_pixel),
    domain=Depends(check_domain),
):
    try:
        pixel_mailing.send_additional_pixel_code(
            email_form.email,
            email_form.script_type,
            email_form.install_type,
            user_id=user["id"],
            message_expiration_time=user["pixel_code_sent_at"],
            domain_id=domain.id,
        )
    except WaitMailTimeoutException:
        return BaseEnum.FAILURE
    except TemplateNotFound:
        raise HTTPException(status_code=500, detail="Error while sending email")
    except UnknownScriptType:
        raise HTTPException(
            status_code=400, detail="Unknown script type not found"
        )
    except PixelScriptNotFound:
        raise HTTPException(status_code=404, detail="Pixel script not found")

    return BaseEnum.SUCCESS
