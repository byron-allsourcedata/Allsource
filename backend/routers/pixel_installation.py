from fastapi import APIRouter, Depends

from enums import PixelStatus
from schemas.pixel_installation import PixelInstallationRequest
from schemas.users import PixelFormResponse
from services.pixel_installation import PixelInstallationService
from dependencies import get_pixel_installation_service
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/manually")
async def manual(manual: PixelInstallationService = Depends(get_pixel_installation_service)):
    result_status = manual.get_manual()
    return result_status


@router.post("/check-pixel-installed", response_model=PixelFormResponse)
async def manual(pixel_installation_request: PixelInstallationRequest,
                 pixel_installation_service: PixelInstallationService = Depends(get_pixel_installation_service)):
    result = pixel_installation_service.check_pixel_installed(pixel_installation_request.url)
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
async def google_tag(google_tag: PixelInstallationService = Depends(get_pixel_installation_service)):
    result_status = google_tag.get_my_info()
    return result_status


@router.get("/cms")
async def cms(cms: PixelInstallationService = Depends(get_pixel_installation_service)):
    result_status = cms.get_manual()
    return result_status
