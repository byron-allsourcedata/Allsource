from fastapi import APIRouter, Depends

from enums import PixelStatus, BaseEnum
from models.users import User
from schemas.pixel_installation import PixelInstallationRequest, EmailFormRequest, ManualFormResponse
from schemas.users import PixelFormResponse
from services.pixel_installation import PixelInstallationService
from dependencies import get_pixel_installation_service, check_user_authorization_without_pixel, check_user_authentication
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/manually", response_model=ManualFormResponse)
async def manual(pixel_installation_service: PixelInstallationService = Depends(get_pixel_installation_service),
                 user: User = Depends(check_user_authorization_without_pixel)):
    manual_result, pixel_client_id = pixel_installation_service.get_manual(user)
    return ManualFormResponse(manual=manual_result, pixel_client_id=pixel_client_id)


@router.post("/send-pixel-code")
async def send_pixel_code_in_email(email_form: EmailFormRequest,
                                   pixel_installation_service: PixelInstallationService = Depends(
                                       get_pixel_installation_service),
                                   user: User = Depends(check_user_authorization_without_pixel)):
    return pixel_installation_service.send_pixel_code_in_email(email_form.email, user)


@router.post("/check-pixel-installed", response_model=PixelFormResponse)
async def manual(pixel_installation_request: PixelInstallationRequest,
                 pixel_installation_service: PixelInstallationService = Depends(get_pixel_installation_service), user: User = Depends(check_user_authentication)):
    if pixel_installation_request.pixelClientId is None:
        result = pixel_installation_service.check_pixel_installed_via_parse(pixel_installation_request.url, user)
    else:
        result = pixel_installation_service.check_pixel_installed_via_api(pixel_installation_request.pixelClientId, pixel_installation_request.url)
    queue_name = f"sse_events_{str(result['user_id'])}"
    rabbitmq_connection = RabbitMQConnection()
    connection = await rabbitmq_connection.connect()
    if result['success']:
        status = PixelStatus.PIXEL_CODE_INSTALLED
    else:
        status = PixelStatus.PIXEL_CODE_PARSE_FAILED
    try:
        await publish_rabbitmq_message(
            connection=connection,
            queue_name=queue_name,
            message_body={'status': status.value}
        )
    except Exception as e:
        logger.error(e)
        await rabbitmq_connection.close()
    finally:
        await rabbitmq_connection.close()
    return PixelFormResponse(status=status)


@router.get("/google-tag")
async def google_tag(user: User = Depends(check_user_authorization_without_pixel)):
    return BaseEnum.SUCCESS


@router.get("/cms", response_model=ManualFormResponse)
async def cms(pixel_installation_service: PixelInstallationService = Depends(get_pixel_installation_service),
              user: User = Depends(check_user_authorization_without_pixel)):
    manual_result, pixel_client_id = pixel_installation_service.get_manual(user)
    return ManualFormResponse(manual=manual_result, pixel_client_id=pixel_client_id)
