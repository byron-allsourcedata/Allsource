from fastapi import APIRouter, Depends, Query

from dependencies import get_lookalikes_service, check_user_authorization_without_pixel
from services.lookalikes import AudienceLookalikesService
from pydantic import BaseModel
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from fastapi import Body

AUDIENCE_LOOKALIKES_READER = 'audience_lookalikes_reader'


class LookalikeCreateRequest(BaseModel):
    uuid_of_source: str
    lookalike_size: str
    lookalike_name: str


class UpdateLookalikeRequest(BaseModel):
    uuid_of_lookalike: str
    name_of_lookalike: str


router = APIRouter()


@router.get("")
async def get_lookalikes(
        user: dict = Depends(check_user_authorization_without_pixel),
        page: int = Query(1, alias="page", ge=1, description="Page number"),
        per_page: int = Query(15, alias="per_page", ge=1, le=500, description="Items per page"),
        from_date: int = Query(None, description="Start date in integer format"),
        to_date: int = Query(None, description="End date in integer format"),
        lookalike_size: str = Query(None, description="Lookalike size"),
        lookalike_type: str = Query(None, description="Lookalike type"),
        sort_by: str = Query(None, description="Field"),
        sort_order: str = Query(None, description="Field to sort by: 'asc' or 'desc'"),
        timezone_offset: float = Query(0, description="timezone offset in integer format"),
        lookalike_service: AudienceLookalikesService = Depends(get_lookalikes_service),
        search_query: str = Query(None, description="Search by lookalikes name, source or creator"),
):
    return lookalike_service.get_lookalikes(
        user=user,
        sort_by=sort_by,
        sort_order=sort_order,
        lookalike_size=lookalike_size,
        lookalike_type=lookalike_type,
        page=page,
        per_page=per_page,
        from_date=from_date,
        to_date=to_date,
        search_query=search_query
    )


@router.get("/builder")
async def get_source(
        user: dict = Depends(check_user_authorization_without_pixel),
        uuid_of_source: str = Query(None, description="UUID of source"),
        lookalike_service: AudienceLookalikesService = Depends(get_lookalikes_service),
):
    return lookalike_service.get_source_info(uuid_of_source, user=user)


@router.get("/get-sources")
async def get_all_sources(
        user: dict = Depends(check_user_authorization_without_pixel),
        lookalike_service: AudienceLookalikesService = Depends(get_lookalikes_service),
):
    return lookalike_service.get_all_sources(user=user)


@router.post("/builder")
async def create_lookalike(
    request: LookalikeCreateRequest,
    lookalike_service: AudienceLookalikesService = Depends(get_lookalikes_service),
    user: dict = Depends(check_user_authorization_without_pixel)
):
    if user.get('team_member'):
        user_id = user.get('team_member').get('id')
    else:
        user_id = user.get('id')

    result = lookalike_service.create_lookalike(
        user=user,
        uuid_of_source=request.uuid_of_source,
        lookalike_size=request.lookalike_size,
        lookalike_name=request.lookalike_name,
        created_by_user_id=user_id
    )
    if result['status'] == 'SUCCESS':
        msg_body = {
            'lookalike_id': str(result['lookalike']['id'])
        }
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        await publish_rabbitmq_message(connection=connection, queue_name=AUDIENCE_LOOKALIKES_READER, message_body=msg_body)

    return result


@router.delete("/delete-lookalike")
async def delete_lookalike(
        user: dict = Depends(check_user_authorization_without_pixel),
        uuid_of_lookalike: str = Query(None, description="UUID of source"),
        lookalike_service: AudienceLookalikesService = Depends(get_lookalikes_service),
):
    return lookalike_service.delete_lookalike(uuid_of_lookalike, user=user)


@router.put("/update-lookalike")
async def update_lookalike(
        user: dict = Depends(check_user_authorization_without_pixel),
        data: UpdateLookalikeRequest = Body(...),
        lookalike_service: AudienceLookalikesService = Depends(get_lookalikes_service),
):
    return lookalike_service.update_lookalike(data.uuid_of_lookalike, data.name_of_lookalike, user=user)


@router.get("/search-lookalikes")
async def search_lookalikes(start_letter: str = Query(..., min_length=3),
                            lookalike_service: AudienceLookalikesService = Depends(get_lookalikes_service),
                            user: dict = Depends(check_user_authorization_without_pixel)):
    return lookalike_service.search_lookalikes(start_letter, user=user)


@router.get("/get-processing-lookalike")
def get_processing_lookalike(
        id: str = Query(...),
        lookalike_service: AudienceLookalikesService = Depends(get_lookalikes_service),
):
    
    return lookalike_service.get_processing_lookalike(id)