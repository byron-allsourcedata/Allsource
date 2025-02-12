from fastapi import APIRouter, Depends, Query

from dependencies import get_audience_service, check_user_authorization, check_domain
from schemas.audience import AudienceRequest
from typing import List, Optional
from models.users import User
from services.audience import AudienceService
from services.leads import LeadsService

router = APIRouter()

@router.get("/list")
async def get_user_audience_list(domain=Depends(check_domain),
                                 audience_service: AudienceService = Depends(get_audience_service)):
    return audience_service.get_user_audience_list(domain.id)


@router.post("")
async def post_audience(audience_request: AudienceRequest,
                        user: dict = Depends(check_user_authorization),
                         domain=Depends(check_domain),
                        audience_service: AudienceService = Depends(get_audience_service)):
    return audience_service.create_audience(user.get('id'), domain.id, audience_request.data_source, audience_request.audience_type, audience_request.audience_threshold)

