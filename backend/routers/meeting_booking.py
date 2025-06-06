import logging

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.params import Header
from typing_extensions import Annotated

from dependencies import get_users_service
from schemas.users import CalendlyUUID, MeetingBookingResponse

from services.users import UsersService


router = APIRouter()

logger = logging.getLogger(__name__)

@router.get('', response_model=MeetingBookingResponse)
def get_me(user_service: UsersService = Depends(get_users_service)):
    result = user_service.get_meeting_info()
    return MeetingBookingResponse(user=result)


@router.post('')
async def update_calendly_uuid():
    logger.warning("POST /calendly is deprecated and does nothing")
    return None


