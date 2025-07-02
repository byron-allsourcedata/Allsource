import logging
from fastapi import Request, APIRouter, HTTPException
from schemas.opt_out import OptOutRequest
from services.opt_out import OptOutService

router = APIRouter()

logger = logging.getLogger(__name__)


@router.post("")
async def opt_out(
    data: OptOutRequest, request: Request, service: OptOutService
):
    ip = None
    source = None

    if forwarded := request.headers.get("x-forwarded-for"):
        ip = forwarded.split(",")[0].strip()
        source = "x-forwarded-for"
    elif real_ip := request.headers.get("x-real-ip"):
        ip = real_ip
        source = "x-real-ip"
    else:
        ip = request.client.host
        source = "request.client.host"
    logger.info("New opt-out request:")
    logger.info(f"Source: {source}")
    logger.info(f"IP: {ip}")

    try:
        service.process_opt_out(
            email=data.email,
            recaptcha_token=data.recaptcha_token,
            ip_address=ip,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"status": "ok"}
