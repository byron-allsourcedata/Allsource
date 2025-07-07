import logging
from fastapi import Request, Depends, APIRouter
from schemas.privacy_policy import PrivacyPolicyRequest
from services.privacy_policy import PrivacyPolicyService
from dependencies import check_user_authentication

router = APIRouter()

logger = logging.getLogger(__name__)


@router.post("")
def privacy_policy(
    data: PrivacyPolicyRequest,
    request: Request,
    service: PrivacyPolicyService,
    user=Depends(check_user_authentication),
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
    logger.info("New privacy policy request:")
    logger.info(f"Source: {source}")
    logger.info(f"IP: {ip}")

    service.save_privacy_policy(
        privacy_policy_data=data, ip_address=ip, user=user
    )

    return {"status": "ok"}
