from fastapi import APIRouter, Depends, Query

from dependencies import get_lookalikes_service, check_user_authorization_without_pixel
from services.lookalikes import LookalikesService
from pydantic import BaseModel
from models.users import User


class LookalikeCreateRequest(BaseModel):
    uuid_of_source: str
    lookalike_size: str
    lookalike_name: str


router = APIRouter()


@router.get("/builder")
async def get_source(
        uuid_of_source: str = Query(None, description="UUID of source"),
        lookalike_service: LookalikesService = Depends(get_lookalikes_service),
):
    return lookalike_service.get_source_info(uuid_of_source)


@router.post("/builder")
async def create_lookalike(
    request: LookalikeCreateRequest,
    lookalike_service: LookalikesService = Depends(get_lookalikes_service),
    user: dict = Depends(check_user_authorization_without_pixel)
):
    if user.get('team_member'):
        user_id = user.get('team_member').get('id')
    else:
        user_id = user.get('id')

    return lookalike_service.create_lookalike(
        uuid_of_source=request.uuid_of_source,
        lookalike_size=request.lookalike_size,
        lookalike_name=request.lookalike_name,
        created_by_user_id=user_id
    )
