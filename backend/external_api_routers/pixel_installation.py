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


@router.post("/check-pixel-installed", response_model=PixelFormResponse)
async def manual(pixel_installation_request: PixelInstallationRequest,
                 pixel_installation_service: PixelInstallationService = Depends(get_pixel_installation_service)):
    result = pixel_installation_service.check_pixel_installed_via_api(pixel_installation_request.pixelClientId, pixel_installation_request.url)
    
    if result['status'] == PixelStatus.PIXEL_CODE_INSTALLED.value:
        queue_name = f"sse_events_{str(result['user_id'])}"
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        message_body = {
            'status': PixelStatus.PIXEL_CODE_INSTALLED.value,
            'need_reload_page': pixel_installation_request.need_reload_page
        }

        try:
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=queue_name,
                message_body=message_body
            )
        except Exception as e:
            logger.error(e)
            await rabbitmq_connection.close()
        finally:
            await rabbitmq_connection.close()
            
    return PixelFormResponse(status=result['status'])
