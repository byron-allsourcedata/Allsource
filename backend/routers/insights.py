from uuid import UUID

from fastapi import APIRouter, Depends, Query
from typing import Any
from dependencies import (
    check_user_authorization_without_pixel,
)
from services.audience_insights import AudienceInsightsService

router = APIRouter()


@router.get("/sources/{uuid}")
async def get_source_insights_info(
    uuid: UUID,
    insights_service: AudienceInsightsService,
    is_debug: bool = Query(False),
    user: dict = Depends(check_user_authorization_without_pixel),
):
    return insights_service.get_source_insights(uuid, user, is_debug)


@router.get("/lookalikes/{uuid}")
async def get_lookalike_insights_info(
    uuid: UUID,
    insights_service: AudienceInsightsService,
    is_debug: bool = False,
    user: dict = Depends(check_user_authorization_without_pixel),
):
    return insights_service.get_lookalike_insights(uuid, user, is_debug)


@router.get("/get-data-sources")
def get_data_sources(
    insights_service: AudienceInsightsService,
    user: dict = Depends(check_user_authorization_without_pixel),
) -> dict[str, Any]:
    return insights_service.get_data_sources(user=user)


@router.get("/search-data-sources")
def search_data_sources(
    insights_service: AudienceInsightsService,
    query: str,
    user: dict = Depends(check_user_authorization_without_pixel),
) -> dict[str, Any]:
    return insights_service.search_data_sources(user=user, query=query)
