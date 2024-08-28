from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.params import Header
from typing_extensions import Annotated

from dependencies import get_users_service
from schemas.users import CalendlyUUID, CalendlyResponse

from services.users import UsersService


router = APIRouter()


@router.get('', response_model=CalendlyResponse)
def get_me(user_service: UsersService = Depends(get_users_service)):
    result = user_service.get_calendly_info()
    return CalendlyResponse(user=result)


@router.post('')
async def update_calendly_uuid(update_data: CalendlyUUID,
                          user: UsersService = Depends(get_users_service)):
    result_status = user.update_calendly_info(update_data.uuid, update_data.invitees)
    return result_status


