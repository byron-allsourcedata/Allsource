from uuid import UUID

from fastapi import APIRouter, Depends, Query

from dependencies import get_audience_insights_service, check_user_authorization_without_pixel
from services.audience_insights import AudienceInsightsService

router = APIRouter()


@router.get("/sources/{uuid}")
async def get_source_insights_info(
    uuid: UUID,
    user: dict = Depends(check_user_authorization_without_pixel),
    insights_service: AudienceInsightsService = Depends(get_audience_insights_service)
):
    return insights_service.get_source_insights(uuid, user)


@router.get("/lookalikes/{uuid}")
async def get_lookalike_insights_info(
    uuid: UUID,
    user: dict = Depends(check_user_authorization_without_pixel),
    insights_service: AudienceInsightsService = Depends(get_audience_insights_service)
):
    return insights_service.get_lookalike_insights(uuid, user)
