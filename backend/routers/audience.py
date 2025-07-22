from fastapi import APIRouter, Depends

from dependencies import (
    check_user_authorization_without_pixel,
    check_domain,
)
from schemas.audience import AudienceRequest
from services.audience import AudienceService

router = APIRouter()


@router.get("/list")
async def get_user_audience_list(
    audience_service: AudienceService,
    domain=Depends(check_domain),
):
    return audience_service.get_user_audience_list(domain.id)


@router.post("")
async def post_audience(
    audience_request: AudienceRequest,
    audience_service: AudienceService,
    user: dict = Depends(check_user_authorization_without_pixel),
    domain=Depends(check_domain),
):
    return audience_service.create_audience(
        user.get("id"),
        domain.id,
        audience_request.data_source,
        audience_request.audience_type,
        audience_request.audience_threshold,
    )
